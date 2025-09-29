import { Inject, Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Repository } from 'typeorm';

import { Config } from '../config';
import { sanitizedFileName } from '../utils';
import { ProjectsService } from './projects.service';
import { InjectRepository } from '@nestjs/typeorm';
import { PageEntity } from '../pages/page.entity';
import { PagesExportStaticHtmlService } from '../pages/pages-export-static-html.service';
import { ProjectEntity } from './project.entity';
import { DownloadableFileDetails } from '../entities';

@Injectable()
export class ProjectsExportStaticHtmlForVercelService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly projectsService: ProjectsService,
    @InjectRepository(PageEntity)
    private readonly pagesRepository: Repository<PageEntity>,
    private readonly pagesExportStaticHtmlService: PagesExportStaticHtmlService,
  ) {}

  async exportAndZip(id: number): Promise<DownloadableFileDetails> {
    const project = await this.projectsService.fetchOne({ where: { id } });

    const projectDirPath = path.join(
      this.config.exportDirPath,
      project.pathForInternalExport,
      'static-html',
    );

    await this.export(project, projectDirPath);

    const safeProjectName = sanitizedFileName(project.name);
    const fileName = `${new Date().toISOString().slice(0, 10)}-${safeProjectName}-static-html.zip`;
    const filePath = path.join(
      this.config.exportDirPath,
      project.pathForInternalExport,
      fileName,
    );
    const contentType = 'application/zip';

    const zip = new AdmZip();
    zip.addLocalFolder(projectDirPath);
    zip.writeZip(filePath);

    return { fileName, contentType, filePath };
  }

  async export(project: ProjectEntity, outDirPath: string): Promise<void> {
    const pages = await this.pagesRepository.find({
      where: { project: { id: project.id } },
      relations: ['project'],
    });

    await fs.mkdir(outDirPath, { recursive: true });
    const rootAssetsDir = path.join(outDirPath, 'assets');
    await fs.mkdir(rootAssetsDir, { recursive: true });

    await Promise.all(
      pages.map(async (page) => {
        const pageDirPath = path.join(outDirPath, page.path);
        await fs.mkdir(pageDirPath, { recursive: true });

        await this.pagesExportStaticHtmlService.export(
          page,
          page.project,
          pageDirPath,
        );

        const pageIndexFile = path.join(pageDirPath, 'index.html');
        let html = await fs.readFile(pageIndexFile, { encoding: 'utf8' });

        const cssFileName = this.getCssFileName(page.path);
        const rootCssPath = path.join(outDirPath, cssFileName);

        const pageCssFiles = await this.findCssFiles(pageDirPath);
        let combinedCss = '';

        for (const cssFile of pageCssFiles) {
          try {
            const cssContent = await fs.readFile(cssFile, 'utf8');
            combinedCss += '\n' + cssContent + '\n';
            await fs.unlink(cssFile);
          } catch (error: unknown) {
            console.warn(
              `Could not process CSS file ${cssFile}:`,
              error instanceof Error ? error.message : String(error),
            );
          }
        }

        if (combinedCss.trim()) {
          await fs.writeFile(rootCssPath, combinedCss, { encoding: 'utf8' });
        }

        await this.moveAssetsToRoot(pageDirPath, rootAssetsDir);

        html = this.updateHtmlReferences(html, cssFileName, page.path);

        await fs.writeFile(pageIndexFile, html, { encoding: 'utf8' });
      }),
    );
  }

  private getCssFileName(pagePath: string): string {
    if (!pagePath || pagePath === '/' || pagePath === 'index') {
      return 'styles.css';
    }

    const cleanPath = pagePath
      .replace(/^\/+|\/+$/g, '')
      .replace(/\//g, '-')
      .replace(/[^a-zA-Z0-9\-_]/g, '');

    return `styles-${cleanPath}.css`;
  }

  private updateHtmlReferences(
    html: string,
    cssFileName: string,
    pagePath: string,
  ): string {
    const isRootPage = !pagePath || pagePath === '/' || pagePath === 'index';
    const cssHref = isRootPage ? `./${cssFileName}` : `../${cssFileName}`;
    const assetsPrefix = isRootPage ? './assets/' : '../assets/';

    return html
      .replace(/href="[^"]*\.css[^"]*"/g, `href="${cssHref}"`)
      .replace(/src="\.\/assets\/([^"]+)"/g, `src="${assetsPrefix}$1"`)
      .replace(/src="assets\/([^"]+)"/g, `src="${assetsPrefix}$1"`)
      .replace(/src="\.\.\/assets\/([^"]+)"/g, `src="${assetsPrefix}$1"`);
  }

  private async findCssFiles(dirPath: string): Promise<string[]> {
    const cssFiles: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const subDirCssFiles = await this.findCssFiles(fullPath);
          cssFiles.push(...subDirCssFiles);
        } else if (entry.isFile() && entry.name.endsWith('.css')) {
          cssFiles.push(fullPath);
        }
      }
    } catch (error: unknown) {
      console.warn(
        `Could not read directory ${dirPath}:`,
        error instanceof Error ? error.message : String(error),
      );
    }

    return cssFiles;
  }

  private async moveAssetsToRoot(
    pageDirPath: string,
    rootAssetsDir: string,
  ): Promise<void> {
    const pageAssetsDir = path.join(pageDirPath, 'assets');

    try {
      const assetEntries = await fs.readdir(pageAssetsDir, {
        withFileTypes: true,
      });

      for (const entry of assetEntries) {
        const sourcePath = path.join(pageAssetsDir, entry.name);
        const targetPath = path.join(rootAssetsDir, entry.name);

        if (entry.isFile()) {
          try {
            await fs.rename(sourcePath, targetPath);
          } catch {
            try {
              await fs.copyFile(sourcePath, targetPath);
              await fs.unlink(sourcePath);
            } catch (copyError: unknown) {
              console.warn(
                `Could not move asset ${entry.name}:`,
                copyError instanceof Error
                  ? copyError.message
                  : String(copyError),
              );
            }
          }
        }
      }

      try {
        await fs.rmdir(pageAssetsDir);
      } catch {
        // Expected if directory not empty
      }
    } catch {
      // Expected if assets directory doesn't exist
    }
  }
}
