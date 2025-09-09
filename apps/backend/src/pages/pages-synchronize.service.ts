import { Inject, Injectable } from '@nestjs/common';
import { PageEntity } from './page.entity';
import { PagesExportPreviewService } from './pages-export-preview.service';
import { AsyncJobManagerService } from '../services';
import * as WebsolutCore from '@wsolut/websolut-core';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../config';
import { PagesService } from './pages.service';
import { createDirSync, errorHasStack, sanitizedRoute } from '../utils';
import { JobStatusesService } from '../job-statuses';
import { ProjectEntity } from '../projects';

@Injectable()
export class PagesSynchronizeService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly pagesExportPreviewService: PagesExportPreviewService,
    private readonly asyncJobManager: AsyncJobManagerService,
    private readonly pagesService: PagesService,
    private readonly jobStatusesService: JobStatusesService,
  ) {}

  async synchronize(id: number): Promise<PageEntity> {
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

    const websolutManager = new WebsolutCore.Manager({
      figmaToken: page.figmaToken || '-error-',
      figmaFileKey: page.figmaFileKey,
      figmaNodeId: page.figmaNodeId,
      dataDirPath: this.config.dataDirPath,
    });

    try {
      await websolutManager.synchronize();

      const title = websolutManager.page?.document.metadata.title || '';

      if (page.figmaNodeName !== title) {
        page.figmaNodeName = title;

        if (page.path.includes(`\0`)) {
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
      if (error instanceof WebsolutCore.FigmaClientInvalidTokenError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 403,
          errorMessage: 'Figma Token is invalid or missing',
        });
      } else if (error instanceof WebsolutCore.FigmaClientNoResponseError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 404,
          errorMessage: 'Figma file or node not found or deleted',
        });
      } else {
        const errorStackTrace = errorHasStack(error) ? error.stack : undefined;

        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 500,
          errorMessage: 'Unexpected Error',
          errorStackTrace,
        });
      }
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
    // Start the async job (cancel any existing job first)
    await this.asyncJobManager.startJob(
      `PageSync#${page.id}`,
      async (abortSignal) => {
        await this.performDownloadAssets(page, project, abortSignal);
      },
    );
  }

  async devExport(page: PageEntity, project: ProjectEntity) {
    // Start the async job (cancel any existing job first)
    await this.asyncJobManager.startJob(
      `PageDevExport#${page.id}`,
      async (abortSignal) => {
        await this.performDevExport(page, project, abortSignal);
      },
    );
  }

  protected async performDevExport(
    page: PageEntity,
    project: ProjectEntity,
    abortSignal: AbortSignal,
  ): Promise<void> {
    const outDirPath = project.outDirPath || '-missing-out-dir-';
    const templatesDirPath =
      project.templatesDirPath || '-missing-templates-dir-';

    if (abortSignal.aborted) throw new Error('DevExport was cancelled');

    const jobStatus = await this.jobStatusesService.upsert(
      page.id,
      'pages',
      'dev-export',
    );
    await this.jobStatusesService.setAsStarted(jobStatus);

    try {
      if (abortSignal.aborted) throw new Error('DevExport was cancelled');

      const websolutManager = new WebsolutCore.Manager({
        figmaToken: page.figmaToken || '-error-',
        figmaFileKey: page.figmaFileKey,
        figmaNodeId: page.figmaNodeId,
        dataDirPath: this.config.dataDirPath,
      });

      websolutManager.loadData(page.contentVariantName);

      createDirSync(outDirPath);

      const timeoutMs = 300000; // 5 minutes default
      await websolutManager.waitForDownloadAssets(timeoutMs);

      websolutManager.export({
        outDirPath: path.join(outDirPath, page.path),
        templatesDirPath: templatesDirPath,
        assetsOutDir: project.assetsOutDir
          ? path.join(project.assetsOutDir, page.path)
          : undefined,
        assetsPrefixPath: project.assetsPrefixPath
          ? path.join(project.assetsPrefixPath, page.path)
          : undefined,
      });

      if (abortSignal.aborted) throw new Error('DevExport was cancelled');

      await this.jobStatusesService.setAsFinished(jobStatus);
    } catch (error: unknown) {
      if (error instanceof WebsolutCore.FigmaClientInvalidTokenError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 403,
          errorMessage: 'Figma Token is invalid or missing',
        });
      } else if (error instanceof WebsolutCore.FigmaClientNoResponseError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 404,
          errorMessage: 'Figma file or node not found or deleted',
        });
      } else {
        const errorStackTrace = errorHasStack(error) ? error.stack : undefined;

        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 500,
          errorMessage: 'Unexpected Error',
          errorStackTrace,
        });
      }
    }
  }

  protected async performDownloadAssets(
    page: PageEntity,
    project: ProjectEntity,
    abortSignal: AbortSignal,
  ): Promise<void> {
    if (abortSignal.aborted) throw new Error('Sync was cancelled');

    if (abortSignal.aborted) throw new Error('Sync was cancelled');

    await this.pagesExportPreviewService.downloadPagesAssets(page, project);

    const jobStatus = await this.jobStatusesService.upsert(
      page.id,
      'pages',
      'synchronize',
    );
    await this.jobStatusesService.setAsFinished(jobStatus);

    if (abortSignal.aborted) throw new Error('Sync was cancelled');
  }
}
