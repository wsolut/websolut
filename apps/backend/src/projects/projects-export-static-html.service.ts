import { Inject, Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';
import * as path from 'path';
import { Config } from '../config';
import { sanitizedFileName } from '../utils';
import { ProjectsService } from './projects.service';
import { InjectRepository } from '@nestjs/typeorm';
import { PageEntity } from '../pages/page.entity';
import { PagesExportStaticHtmlService } from '../pages/pages-export-static-html.service';
import { Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { DownloadableFileDetails } from '../entities';

@Injectable()
export class ProjectsExportStaticHtmlService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly projectsService: ProjectsService,
    @InjectRepository(PageEntity)
    private pagesRepository: Repository<PageEntity>,
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
    zip.addLocalFolder(
      path.join(
        this.config.exportDirPath,
        project.pathForInternalExport,
        'static-html',
      ),
    );
    zip.writeZip(filePath);

    return { fileName, contentType, filePath };
  }

  async export(project: ProjectEntity, outDirPath: string): Promise<void> {
    const pages = await this.pagesRepository.find({
      where: { project: { id: project.id } },
      relations: ['project'],
    });

    await Promise.all(
      pages.map(async (page) => {
        const pageDirPath = path.join(outDirPath, page.path);

        await this.pagesExportStaticHtmlService.export(
          page,
          page.project,
          pageDirPath,
        );
      }),
    );
  }
}
