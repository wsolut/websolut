import { Inject, Injectable } from '@nestjs/common';
import { Config } from '../config';
import { ProjectsService } from './projects.service';
import { BaseService } from '../services';
import { ProjectsExportStaticHtmlForVercelService } from './projects-export-static-html-for-vercel.service';
import { I18nService } from 'nestjs-i18n';
import { ProjectDeployDto } from './projects.dto';
import z from 'zod';
import * as path from 'path';
import { ProjectEntity } from './project.entity';
import { errorHasStack, deployToVercelViaApi } from '../utils';
import { JobStatusesService } from '../job-statuses';
import {
  InvalidArgumentError,
  NetworkUnavailableError,
  ServiceUnavailableError,
  VercelInvalidTokenError,
  VercelInvalidProjectNameError,
} from '../entities';

const NAME_MAX_LENGTH = 100;

@Injectable()
export class ProjectsDeployToVercelService extends BaseService {
  get i18nNamespace(): string {
    return 'projects';
  }

  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly projectsService: ProjectsService,
    private readonly jobStatusesService: JobStatusesService,
    private readonly projectsExportStaticHtmlForVercelService: ProjectsExportStaticHtmlForVercelService,
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
          .min(1, { message: this.langService.t('.VALIDATIONS.REQUIRED') }),
        projectName: z
          .string()
          .trim()
          .min(1, { message: this.langService.t('.VALIDATIONS.REQUIRED') })
          .max(NAME_MAX_LENGTH, {
            message: this.langService.t('.VALIDATIONS.MAX_LENGTH', {
              length: NAME_MAX_LENGTH,
            }),
          })
          .refine((val) => val === '' || /^(?!.*---)[a-z0-9._-]+$/.test(val), {
            message: this.langService.t('.VALIDATIONS.NAME.INVALID'),
          }),
      }),
      input,
    );

    const outDirPath = path.join(
      this.config.deployDirPath,
      project.pathForInternalExport,
      'vercel',
      data.projectName,
    );

    await this.projectsExportStaticHtmlForVercelService.export(
      project,
      outDirPath,
    );

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
        const errorMessage = this.langService.t('.ERRORS.NETWORK_UNAVAILABLE');

        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 503,
          errorMessage,
        });

        throw new ServiceUnavailableError(errorMessage);
      } else if (error instanceof VercelInvalidTokenError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 422,
          errorMessage: [
            this.langService.t('.ATTRIBUTES.VERCEL_TOKEN'),
            this.langService.t('.VALIDATIONS.INVALID'),
          ].join(' '),
        });

        throw new InvalidArgumentError(
          this.langService.t('.ERRORS.INVALID_ARGUMENT'),
          { token: [this.langService.t('.VALIDATIONS.INVALID')] },
        );
      } else if (error instanceof VercelInvalidProjectNameError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 422,
          errorMessage: [
            this.langService.t('.ATTRIBUTES.VERCEL_PROJECT_NAME'),
            this.langService.t('.VALIDATIONS.NAME.INVALID'),
          ].join(' '),
        });

        throw new InvalidArgumentError(
          this.langService.t('.ERRORS.INVALID_ARGUMENT'),
          { token: [this.langService.t('.VALIDATIONS.INVALID')] },
        );
      } else {
        const errorStackTrace = errorHasStack(error) ? error.stack : undefined;

        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 500,
          errorMessage: 'Unexpected Error',
          errorStackTrace,
        });

        throw error;
      }
    }

    await this.projectsService.refreshJobStatuses(project);

    return project;
  }
}
