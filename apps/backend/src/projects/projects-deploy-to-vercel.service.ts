import { Inject, Injectable } from '@nestjs/common';
import { Config } from '../config';
import { ProjectsService } from './projects.service';
import { BaseService } from '../services';
import { ProjectsExportStaticHtmlService } from './projects-export-static-html.service';
import { I18nService } from 'nestjs-i18n';
import { ProjectDeployDto } from './projects.dto';
import z from 'zod';
import * as path from 'path';
import { ProjectEntity } from './project.entity';
import { errorHasStack, deployToVercelViaApi } from '../utils';
import { JobStatusesService } from '../job-statuses';
import { NetworkUnavailableError, VercelInvalidTokenError } from '../entities';

@Injectable()
export class ProjectsDeployToVercelService extends BaseService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly projectsService: ProjectsService,
    private readonly jobStatusesService: JobStatusesService,
    private readonly projectsExportStaticHtmlService: ProjectsExportStaticHtmlService,
    protected readonly i18nService: I18nService,
  ) {
    super(i18nService);
  }

  async deploy(id: number, input: ProjectDeployDto): Promise<ProjectEntity> {
    const project = await this.projectsService.fetchOne({ where: { id } });

    const { data } = this.validateSchemaOrFail<ProjectDeployDto>(
      z.object({
        token: z
          .string()
          .trim()
          .min(1, { message: this.langService.t('.VALIDATIONS.BLANK') }),
        projectName: z
          .string()
          .trim()
          .min(1, { message: this.langService.t('.VALIDATIONS.BLANK') }),
      }),
      input,
    );

    const outDirPath = path.join(
      this.config.deployDirPath,
      project.pathForInternalExport,
      'vercel',
      data.projectName,
    );

    await this.projectsExportStaticHtmlService.export(project, outDirPath);

    const jobStatus = await this.jobStatusesService.upsert(
      project.id,
      'projects',
      'deploy-to-vercel',
    );
    await this.jobStatusesService.setAsStarted(jobStatus, {
      data: { token: data.token, name: data.projectName },
    });

    try {
      const vercelDeploymentUrl = await deployToVercelViaApi(
        data.token,
        data.projectName,
        outDirPath,
      );

      await this.jobStatusesService.setAsFinished(jobStatus, {
        data: { url: vercelDeploymentUrl },
      });
    } catch (error: unknown) {
      if (error instanceof NetworkUnavailableError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 503,
          errorMessage: 'Network unavailable. Please try again later.',
        });
      } else if (error instanceof VercelInvalidTokenError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 403,
          errorMessage: 'Vercel Token is invalid',
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

    await this.projectsService.refreshJobStatuses(project);

    return project;
  }
}
