import { Inject, Injectable } from '@nestjs/common';
import { PageEntity } from './page.entity';
import { Config } from '../config';
import * as path from 'path';
import { PageDeployDto } from './pages.dto';
import { BaseService } from '../services';
import { I18nService } from 'nestjs-i18n';
import { PagesExportStaticHtmlService } from './pages-export-static-html.service';
import z from 'zod';
import {
  readdirSync,
  statSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
} from 'fs';
import * as os from 'os';
import axios, { AxiosError } from 'axios';
import { PagesService } from './pages.service';
import AdmZip from 'adm-zip';

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
      } else {
        console.warn(`⚠️ Skipping disallowed file: ${fullPath}`);
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
export class PagesDeployToWordpressService extends BaseService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly pagesExportStaticHtmlService: PagesExportStaticHtmlService,
    protected readonly i18nService: I18nService,
    private readonly pagesService: PagesService,
  ) {
    super(i18nService);
  }

  async deploy(id: number, input: PageDeployDto): Promise<PageEntity> {
    const page = await this.pagesService.fetchOne({
      where: { id },
      relations: ['project'],
    });

    this.validateSchemaOrFail<PageDeployDto>(
      z.object({
        token: z
          .string()
          .trim()
          .min(1, { message: this.langService.t('.VALIDATIONS.BLANK') }),
        baseUrl: z
          .string()
          .trim()
          .min(1, { message: this.langService.t('.VALIDATIONS.BLANK') }),
      }),
      input,
    );

    const outDirPath = path.join(
      this.config.deployDirPath,
      page.pathForInternalExport,
      'wordpress',
    );

    // Export HTML + assets
    await this.pagesExportStaticHtmlService.export(
      page,
      page.project,
      outDirPath,
    );

    const { token, baseUrl } = input;
    console.log('Deploying to WordPress:', baseUrl);

    // Copy all allowed files to temp folder, preserving folder structure
    const tempDir = copyToTempDir(outDirPath);
    console.log('Files copied to temp dir:', readdirSync(tempDir));

    // Create ZIP
    const zipPath = path.join(os.tmpdir(), `wp-landing-${Date.now()}.zip`);
    await createZip(tempDir, zipPath);
    console.log('Created ZIP:', zipPath);

    const zipData = readFileSync(zipPath);
    const zipBase64 = zipData.toString('base64');

    // Verify token
    await this.verifyToken(baseUrl, token);

    // Upload ZIP to WordPress
    await this.updateLanding(baseUrl, token, zipBase64);

    console.log('🎉 Wordpress landing page updated successfully!');
    return page;
  }

  private async verifyToken(wpUrl: string, token: string) {
    try {
      const baseUrl = wpUrl.replace(/\/+$/, '');
      const response = await axios.get(baseUrl + '/verify-token', {
        params: { token },
      });
      console.log('✅ Token verified:', response.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        const data = err.response.data as { message?: string };
        const message =
          typeof data?.message === 'string'
            ? data.message
            : JSON.stringify(data);
        console.error('❌ Token verification failed:', data);
        throw new Error(message || 'Axios error');
      } else if (err instanceof Error) {
        console.error('❌ Token verification failed:', err.message);
        throw err;
      } else {
        console.error('❌ Token verification failed:', err);
        throw new Error('Unknown error');
      }
    }
  }

  private async updateLanding(wpUrl: string, token: string, zipBase64: string) {
    try {
      const baseUrl = wpUrl.replace(/\/+$/, '');
      const response = await axios.post(
        `${baseUrl}/update-landing`,
        { zip_base64: zipBase64 },
        { params: { token }, headers: { 'Content-Type': 'application/json' } },
      );
      console.log('✅ Landing update response:', response.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        const data = err.response.data as { message?: string };
        const message =
          typeof data?.message === 'string'
            ? data.message
            : JSON.stringify(data);
        console.error('Axios error:', data);
        throw new Error(message || 'Axios error');
      } else if (err instanceof Error) {
        console.error('Error:', err.message);
        throw err;
      } else {
        console.error('Unknown error:', err);
        throw new Error('Unknown error');
      }
    }
  }
}
