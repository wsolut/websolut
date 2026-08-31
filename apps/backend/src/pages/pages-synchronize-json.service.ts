import { Inject, Injectable } from '@nestjs/common';
import { PageEntity } from './page.entity';
import { PagesExportPreviewService } from './pages-export-preview.service';
import { AsyncJobManagerService } from '../services';
import * as WebsolutCore from '@wsolut/websolut-core';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../config';
import { PagesService } from './pages.service';
import {
  createDirSync,
  errorHasStack,
  sanitizedRoute,
  writeJsonFileSync,
  sanitizedFileName,
} from '../utils';
import { JobStatusesService } from '../job-statuses';
import { ProjectEntity } from '../projects';
import {
  FigmaResponseConverter,
  Utils as WebsolutCoreUtils,
} from '@wsolut/websolut-core';

type FigmaClient = InstanceType<typeof WebsolutCoreUtils.FigmaClient>;

/** Shape of the extra fields the Websolut Figma plugin embeds in the JSON. */
interface PluginExtras {
  _source?: string;
  _imageFills?: Record<string, string>; // imageRef → data-URI (on the root node)
  _svgAssets?: Record<string, string>;  // nodeId  → data-URI
}

/**
 * Variant of FigmaResponseConverter that resolves asset URLs from the
 * embedded base64 data-URIs the plugin exported — no REST calls needed.
 */
class PluginFigmaResponseConverter extends FigmaResponseConverter {
  private imageFills: Record<string, string>;
  private svgAssets: Record<string, string>;

  constructor(
    client: FigmaClient,
    imageFills: Record<string, string>,
    svgAssets: Record<string, string>,
  ) {
    super(client);
    this.imageFills = imageFills;
    this.svgAssets = svgAssets;
  }

  /** Override: skip REST calls; fill URLs from the embedded data. */
  protected override async fetchAndUpdateAssetUrls(_client: FigmaClient): Promise<void> {
    // Resolve imageRef fills (IMAGE paints)
    if (Object.keys(this.imageFills).length > 0) {
      this.updateAssets(this.imageFills, this.imageRefQueue);
    }

    // Resolve SVG vector assets
    if (Object.keys(this.svgAssets).length > 0) {
      this.updateAssets(this.svgAssets, this.assetsQueue);
    }
  }
}

@Injectable()
export class PagesSynchronizeJsonService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly pagesExportPreviewService: PagesExportPreviewService,
    private readonly asyncJobManager: AsyncJobManagerService,
    private readonly pagesService: PagesService,
    private readonly jobStatusesService: JobStatusesService,
  ) {}

  async synchronizeFromJson(
    id: number,
    figmaResponse: Record<string, unknown>,
  ): Promise<PageEntity> {
    const page = await this.pagesService.fetchOne({
      where: { id },
      relations: ['project'],
    });
    const project = page.project;

    const jobStatus = await this.jobStatusesService.upsert(
      page.id,
      'pages',
      'synchronize',
    );
    await this.jobStatusesService.setAsStarted(jobStatus);

    // Extract plugin-added asset data from the root node (if present)
    const rootNodeId = Object.keys(
      (figmaResponse.nodes as Record<string, unknown>) || {},
    )[0];

    const rootDocument = rootNodeId
      ? ((figmaResponse.nodes as Record<string, { document: PluginExtras }>)[
          rootNodeId
        ]?.document ?? {})
      : {};

    const imageFills = (rootDocument as PluginExtras)._imageFills ?? {};
    const svgAssets = (rootDocument as PluginExtras)._svgAssets ?? {};

    // Build a stub client (never actually called in PluginFigmaResponseConverter)
    const stubClient = new WebsolutCoreUtils.FigmaClient(
      page.figmaFileKey || 'plugin',
      { figmaToken: 'plugin' },
    );

    const converterClass = class PluginConverter extends PluginFigmaResponseConverter {
      constructor(client: FigmaClient) {
        super(client, imageFills, svgAssets);
      }
    };

    const websolutManager = new WebsolutCore.Manager({
      figmaToken: 'plugin',
      figmaFileKey: page.figmaFileKey || 'plugin',
      figmaNodeId: page.figmaNodeId || rootNodeId || 'plugin',
      dataDirPath: this.config.dataDirPath,
      figmaResponseConverterClass: converterClass as unknown as typeof FigmaResponseConverter,
    });

    try {
      // Save the raw JSON as figma-response.json so the rest of the pipeline
      // can treat it just like a freshly-fetched REST response.
      const figmaResponseFilePath = path.join(
        this.config.dataDirPath,
        page.figmaFileKey || 'plugin',
        sanitizedFileName(page.figmaNodeId || rootNodeId || 'plugin'),
        'figma-response.json',
      );
      createDirSync(path.dirname(figmaResponseFilePath));
      writeJsonFileSync(figmaResponseFilePath, figmaResponse);

      // Drive the manager with the pre-built response
      // We reuse the manager's converter pipeline by calling it directly.
      const converter = new converterClass(stubClient);

      const domxDocuments = await converter.convert(
        figmaResponse as Parameters<typeof converter.convert>[0],
        { debug: false },
      );

      if (domxDocuments.length === 0) {
        throw new Error('No documents produced from the provided JSON.');
      }

      const pageInstance = new WebsolutCore.Page(domxDocuments[0], {
        dataDirPath: path.join(
          this.config.dataDirPath,
          page.figmaFileKey || 'plugin',
        ),
      });

      pageInstance.save();
      pageInstance.loadData(page.contentVariantName);

      // Patch the manager so the rest of the service methods work
      (websolutManager as { page: typeof pageInstance }).page = pageInstance;

      const title = pageInstance.document.metadata.title || '';

      if (page.figmaNodeName !== title) {
        page.figmaNodeName = title;

        if (page.path.includes('\0')) {
          page.path = await this.pagesService.generateUniquePathFor(
            sanitizedRoute(title),
            page.projectId,
            page.id,
          );
        }

        await this.pagesService.dbSave(page);
      }

      await this.downloadPagesAssetsAsync(page, project);
      await this.pagesExportPreviewService.export(page, project);
    } catch (error: unknown) {
      const errorStackTrace = errorHasStack(error) ? error.stack : undefined;

      await this.jobStatusesService.setAsFinished(jobStatus, {
        errorCode: 500,
        errorMessage:
          error instanceof Error ? error.message : 'Unexpected Error',
        errorStackTrace,
      });
    }

    if (
      (project?.outDirPath ?? '') !== '' &&
      (project?.assetsOutDir ?? '') !== '' &&
      fs.existsSync(project?.templatesDirPath || '')
    ) {
      await this.devExport(page, project);
    }

    await this.pagesService.refreshJobStatuses(page);

    return page;
  }

  async downloadPagesAssetsAsync(page: PageEntity, project: ProjectEntity) {
    await this.asyncJobManager.startJob(
      `PageSyncJson#${page.id}`,
      async () => {
        await this.pagesExportPreviewService.downloadPagesAssets(page, project);

        const jobStatus = await this.jobStatusesService.upsert(
          page.id,
          'pages',
          'synchronize',
        );
        await this.jobStatusesService.setAsFinished(jobStatus);
      },
    );
  }

  async devExport(page: PageEntity, project: ProjectEntity) {
    await this.asyncJobManager.startJob(
      `PageDevExportJson#${page.id}`,
      async (abortSignal) => {
        if (abortSignal.aborted) return;

        const outDirPath = project.outDirPath || '-missing-out-dir-';
        const templatesDirPath =
          project.templatesDirPath || '-missing-templates-dir-';

        const jobStatus = await this.jobStatusesService.upsert(
          page.id,
          'pages',
          'dev-export',
        );
        await this.jobStatusesService.setAsStarted(jobStatus);

        try {
          const websolutManager = new WebsolutCore.Manager({
            figmaToken: 'plugin',
            figmaFileKey: page.figmaFileKey || 'plugin',
            figmaNodeId: page.figmaNodeId,
            dataDirPath: this.config.dataDirPath,
          });

          websolutManager.loadData(page.contentVariantName);
          createDirSync(outDirPath);
          await websolutManager.waitForDownloadAssets(300000);

          websolutManager.export({
            outDirPath: path.join(outDirPath, page.path),
            templatesDirPath,
            assetsOutDir: project.assetsOutDir
              ? path.join(project.assetsOutDir, page.path)
              : undefined,
            assetsPrefixPath: project.assetsPrefixPath
              ? path.join(project.assetsPrefixPath, page.path)
              : undefined,
          });

          await this.jobStatusesService.setAsFinished(jobStatus);
        } catch (error: unknown) {
          const errorStackTrace = errorHasStack(error) ? error.stack : undefined;

          await this.jobStatusesService.setAsFinished(jobStatus, {
            errorCode: 500,
            errorMessage:
              error instanceof Error ? error.message : 'Unexpected Error',
            errorStackTrace,
          });
        }
      },
    );
  }
}
