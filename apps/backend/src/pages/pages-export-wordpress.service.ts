import { Inject, Injectable } from '@nestjs/common';
import { PageEntity } from './page.entity';
import { Config } from '../config';
import * as path from 'path';
import * as WebsolutCore from '@wsolut/websolut-core';
import { PagesService } from './pages.service';
import AdmZip from 'adm-zip';
import { createDirSync, projectTemplatesDirPath } from '../utils';
import { DownloadableFileDetails } from '../entities';
import { ProjectEntity } from '../projects';

@Injectable()
export class PagesExportWordpressService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly pagesService: PagesService,
  ) {}

  async exportAndZip(id: number): Promise<DownloadableFileDetails> {
    const page = await this.pagesService.fetchOne({
      where: { id },
      relations: ['project'],
    });

    const pageDirPath = path.join(
      this.config.exportDirPath,
      page.pathForInternalExport,
      'wordpress',
    );

    await this.export(page, page.project, pageDirPath);

    const fileName = `${page.project.name}${page.path ? `-${page.path}` : ''}-(wordpress).zip`;
    const filePath = path.join(
      this.config.exportDirPath,
      page.pathForInternalExport,
      fileName,
    );
    const contentType = 'application/zip';

    const zip = new AdmZip();
    zip.addLocalFolder(pageDirPath);
    zip.writeZip(filePath);

    return { fileName, contentType, filePath };
  }

  async export(
    page: PageEntity,
    project: ProjectEntity,
    outDirPath: string,
  ): Promise<void> {
    const websolutManager = new WebsolutCore.Manager({
      figmaToken: page.figmaToken || '-error-',
      figmaFileKey: page.figmaFileKey,
      figmaNodeId: page.figmaNodeId,
      dataDirPath: this.config.dataDirPath,
    });

    websolutManager.loadData(page.contentVariantName);

    const templatesDirPath = projectTemplatesDirPath(
      project,
      path.join(this.config.templatesDirPath, 'wordpress'),
    );

    createDirSync(templatesDirPath);

    const timeoutMs = 300000; // 5 minutes default
    await websolutManager.waitForDownloadAssets(timeoutMs);

    websolutManager.export({
      outDirPath,
      templatesDirPath,
    });
  }
}
