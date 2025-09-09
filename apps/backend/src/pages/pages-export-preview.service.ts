import { Inject, Injectable } from '@nestjs/common';
import { PageEntity, PAGES_DIR_NAME } from './page.entity';
import { Config } from '../config';
import * as path from 'path';
import * as WebsolutCore from '@wsolut/websolut-core';
import { ProjectEntity, PROJECTS_DIR_NAME } from '../projects';
import { PagesGateway } from './pages.gateway';
import { errorHasStack, projectTemplatesDirPath, readFileSync } from '../utils';
import { JobStatusesService } from '../job-statuses';

@Injectable()
export class PagesExportPreviewService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly pagesGateway: PagesGateway,
    private readonly jobStatusesService: JobStatusesService,
  ) {}

  async export(page: PageEntity, project: ProjectEntity) {
    const jobStatus = await this.jobStatusesService.upsert(
      page.id,
      'pages',
      'preview',
    );
    await this.jobStatusesService.setAsStarted(jobStatus);

    const outDirPath = path.join(
      this.config.previewDirPath,
      PROJECTS_DIR_NAME,
      page.projectId.toString(),
      page.pathForInternalExport,
    );
    const assetsOutDir = path.join(
      this.config.previewDirPath,
      PROJECTS_DIR_NAME,
      page.projectId.toString(),
      PAGES_DIR_NAME,
      'assets',
    );

    try {
      const websolutManager = new WebsolutCore.Manager({
        figmaToken: page.figmaToken || '-error-',
        figmaFileKey: page.figmaFileKey,
        figmaNodeId: page.figmaNodeId,
        dataDirPath: this.config.dataDirPath,
      });

      websolutManager.loadData(page.contentVariantName);

      const templatesDirPath = projectTemplatesDirPath(
        project,
        path.join(this.config.templatesDirPath, 'static-html'),
      );

      const timeoutMs = 300000; // 5 minutes default
      await websolutManager.waitForDownloadAssets(timeoutMs);

      websolutManager.export({
        outDirPath,
        templatesDirPath,
        assetsOutDir,
      });

      const content = readFileSync(path.join(outDirPath, 'index.html'));

      this.pagesGateway.publishPreviewUpdate(page, content);

      await this.jobStatusesService.setAsFinished(jobStatus);
    } catch (error: unknown) {
      if (error instanceof WebsolutCore.FigmaClientError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 403,
          errorMessage: 'Figma Token is invalid or missing',
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

  async downloadPagesAssets(page: PageEntity, project: ProjectEntity) {
    const jobStatus = await this.jobStatusesService.upsert(
      page.id,
      'pages',
      'download-assets',
    );
    await this.jobStatusesService.setAsStarted(jobStatus);

    try {
      const websolutManager = new WebsolutCore.Manager({
        figmaToken: page.figmaToken || '-error-',
        figmaFileKey: page.figmaFileKey,
        figmaNodeId: page.figmaNodeId,
        dataDirPath: this.config.dataDirPath,
      });

      websolutManager.loadData();

      await websolutManager.downloadPagesAssets();

      await this.export(page, project);

      await this.jobStatusesService.setAsFinished(jobStatus);
    } catch (error: unknown) {
      if (error instanceof WebsolutCore.FigmaClientError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 403,
          errorMessage: 'Figma Token is invalid or missing',
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
}
