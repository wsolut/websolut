import { Inject, Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';
import * as path from 'path';
import { Config } from '../config';
import { sanitizedFileName } from '../utils';
import { ProjectsService } from './projects.service';
import { InjectRepository } from '@nestjs/typeorm';
import { PageEntity } from '../pages/page.entity';
import { PagesExportWordpressService } from '../pages/pages-export-wordpress.service';
import { Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { DownloadableFileDetails } from '../entities';

@Injectable()
export class ProjectsExportWordpressService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly projectsService: ProjectsService,
    @InjectRepository(PageEntity)
    private pagesRepository: Repository<PageEntity>,
    private readonly pagesExportWordpressService: PagesExportWordpressService,
  ) {}

  async exportAndZip(id: number): Promise<DownloadableFileDetails> {
    const project = await this.projectsService.fetchOne({ where: { id } });

    const projectDirPath = path.join(
      this.config.exportDirPath,
      project.pathForInternalExport,
      'wordpress',
    );

    await this.export(project, projectDirPath);

    const safeProjectName = sanitizedFileName(project.name);
    const fileName = `${new Date().toISOString().slice(0, 10)}-${safeProjectName}-wordpress.zip`;
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
        'wordpress',
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

        await this.pagesExportWordpressService.export(
          page,
          page.project,
          pageDirPath,
        );
      }),
    );
  }
}
