import { Inject, Injectable } from '@nestjs/common';
import { Config } from '../config';
import { ProjectsService } from './projects.service';
import { ProjectsExportStaticHtmlService } from './projects-export-static-html.service';
import { ProjectDeployDto } from './projects.dto';
import * as path from 'path';
import { ProjectEntity } from './project.entity';
import { JobStatusesService } from '../job-statuses';
import { BaseService } from '../services';
import { I18nService } from 'nestjs-i18n';
import z from 'zod';
import {
  readdirSync,
  statSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
} from 'fs';
import * as os from 'os';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { errorHasStack } from '../utils';
import {
  NetworkUnavailableError,
  WordpressInvalidBaseURLError,
  WordpressInvalidTokenError,
} from '../entities';

// Allowed file types for WordPress
const ALLOWED_EXTENSIONS = [
  '.html',
  '.htm',
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.txt',
  '.svg',
];

// Recursively get all allowed files
function getAllFiles(
  dir: string,
  baseDir: string = dir,
  fileList: string[] = [],
): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      getAllFiles(fullPath, baseDir, fileList);
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

// Copy all allowed files to a temp directory, preserving folder structure
function copyToTempDir(sourceDir: string): string {
  const tmpDir = path.join(os.tmpdir(), `.wp-temp-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  const allFiles = getAllFiles(sourceDir);

  for (const filePath of allFiles) {
    const relativePath = path.relative(sourceDir, filePath); // preserve folder structure
    const destPath = path.join(tmpDir, relativePath);
    mkdirSync(path.dirname(destPath), { recursive: true });
    copyFileSync(filePath, destPath);
  }

  return tmpDir;
}

// Create ZIP preserving folder structure
function createZip(dir: string, zipPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip();
      const allFiles = getAllFiles(dir);

      for (const filePath of allFiles) {
        const relativePath = path.relative(dir, filePath);
        zip.addLocalFile(filePath, path.dirname(relativePath));
      }

      zip.writeZip(zipPath);
      resolve();
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Unknown zip error'));
    }
  });
}

@Injectable()
export class ProjectsDeployToWordpressService extends BaseService {
  get i18nNamespace(): string {
    return 'projects';
  }

  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly projectsExportStaticHtmlService: ProjectsExportStaticHtmlService,
    protected readonly i18nService: I18nService,
    private readonly projectsService: ProjectsService,
    private readonly jobStatusesService: JobStatusesService,
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
        baseUrl: z
          .string()
          .trim()
          .url({ message: this.langService.t('.VALIDATIONS.INVALID') })
          .min(1, { message: this.langService.t('.VALIDATIONS.BLANK') }),
      }),
      input,
    );

    const outDirPath = path.join(
      this.config.deployDirPath,
      project.pathForInternalExport,
      'wordpress',
    );

    const jobStatus = await this.jobStatusesService.upsert(
      project.id,
      'projects',
      'deploy-to-wordpress',
    );

    await this.jobStatusesService.setAsStarted(jobStatus, {
      data: {
        token: data.token,
        baseUrl: data.baseUrl,
      },
    });

    try {
      // check preflight here in deply to throw error
      await this.preflightCheck(data.baseUrl, data.token);

      // Export HTML + assets
      await this.projectsExportStaticHtmlService.export(project, outDirPath);

      // Copy all allowed files to temp folder, preserving folder structure
      const tempDir = copyToTempDir(outDirPath);

      // Create ZIP
      const zipPath = path.join(os.tmpdir(), `wp-landing-${Date.now()}.zip`);
      await createZip(tempDir, zipPath);

      const zipData = readFileSync(zipPath);
      const zipBase64 = zipData.toString('base64');

      // Upload ZIP to WordPress
      const landingUrl = await this.updateLanding(
        data.baseUrl,
        data.token,
        zipBase64,
      );

      await this.jobStatusesService.setAsFinished(jobStatus, {
        data: { url: landingUrl },
      });
    } catch (error) {
      if (error instanceof NetworkUnavailableError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 503,
          errorMessage: 'Network unavailable. Please try again later.',
        });
      } else if (error instanceof WordpressInvalidBaseURLError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 404,
          errorMessage: 'WordPress Base URL is invalid',
        });
      } else if (error instanceof WordpressInvalidTokenError) {
        await this.jobStatusesService.setAsFinished(jobStatus, {
          errorCode: 403,
          errorMessage: 'WordPress Token is invalid',
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

  private async preflightCheck(
    baseUrl: string,
    token: string,
  ): Promise<boolean> {
    try {
      const response = await axios.get(baseUrl + '/verify-token', {
        params: { token },
      });
      return response.status === 200;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (
          ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT'].includes(
            error.code ?? '',
          )
        ) {
          throw new NetworkUnavailableError();
        }

        if (error.response?.status === 404) {
          throw new WordpressInvalidBaseURLError();
        }

        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new WordpressInvalidTokenError();
        }
      }
      throw error;
    }
  }

  private async updateLanding(
    wpUrl: string,
    token: string,
    zipBase64: string,
  ): Promise<string> {
    const baseUrl = wpUrl.replace(/\/+$/, '');
    const response = await axios.post<UpdateLandingResponse>(
      `${baseUrl}/update-landing`,
      { zip_base64: zipBase64 },
      { params: { token }, headers: { 'Content-Type': 'application/json' } },
    );

    return response.data.landing_url;
  }
}

interface UpdateLandingResponse {
  landing_url: string;
}
