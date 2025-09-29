import {
  FindOneOptions,
  FindOptionsRelations,
  FindOptionsWhere,
  Not,
  Repository,
} from 'typeorm';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InvalidArgumentError, NotFoundError } from '../entities';
import { BaseService } from '../services';
import { I18nService } from 'nestjs-i18n';
import { ApiProperty } from '@nestjs/swagger';
import { PageEntity, PAGES_DIR_NAME } from './page.entity';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../config';
import z from 'zod';
import { ProjectEntity } from '../projects/project.entity';
import { PagesGateway } from './pages.gateway';
import * as WebsolutCore from '@wsolut/websolut-core';
import { JobStatusesService } from '../job-statuses';
import { sanitizedRoute, sanitizedFileName } from '../utils';

const MAX_UNIQUE_PATH_ATTEMPTS = 100;

const PATH_MAX_LENGTH = 200;

export class PageFetchInputDto implements FindOptionsWhere<PageEntity> {
  @ApiProperty({
    description: 'Name of the Page',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Figma Node Id of the Page',
    required: false,
  })
  figmaNodeId?: string;
}

export class PageCreateInputDto {
  @ApiProperty({
    description: 'Full URL of the page (e.g. https://figma.com/... )',
  })
  figmaUrl!: string;

  @ApiProperty({ description: 'Router path for the page, e.g. "/contact-us"' })
  path!: string;

  @ApiProperty({ description: 'Figma personal access token' })
  figmaToken!: string;

  @ApiProperty({
    description: 'Unique Project ID',
  })
  projectId!: number;

  @ApiProperty({
    description: 'Output directory path for the Page.',
    required: false,
  })
  outDirPath: string | null;

  @ApiProperty({
    description: 'Templates directory path for the Page.',
    required: false,
  })
  templatesDirPath: string | null;

  @ApiProperty({
    description: 'Assets output directory path for the Page.',
    required: false,
  })
  assetsOutDir: string | null;

  @ApiProperty({
    description: 'Assets prefix path for the Page.',
    required: false,
  })
  assetsPrefixPath: string | null;

  @ApiProperty({ description: 'Indicates if this should be the home page' })
  homePage: boolean;
}

export class PageUpdateInputDto {
  @ApiProperty({ description: 'Router path for the page, e.g. "/contact-us"' })
  path!: string;

  @ApiProperty({
    description: 'Unique Project ID',
  })
  projectId!: number;

  @ApiProperty({ description: 'Indicates if this should be the home page' })
  homePage: boolean;
}

export type PagesPaginated = {
  results: PageEntity[];
  total: number;
  pages: number;
};

@Injectable()
export class PagesService extends BaseService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    @InjectRepository(PageEntity)
    private pagesRepository: Repository<PageEntity>,
    @InjectRepository(ProjectEntity)
    private projectsRepository: Repository<ProjectEntity>,
    protected readonly i18nService: I18nService,
    @Inject(forwardRef(() => PagesGateway))
    private readonly pagesGateway: PagesGateway,
    private readonly jobStatusesService: JobStatusesService,
  ) {
    super(i18nService);
  }

  async fetchAll(
    where: FindOptionsWhere<PageEntity>,
    relations?: FindOptionsRelations<PageEntity>,
  ): Promise<PagesPaginated> {
    if (where.projectId) {
      where.project = {
        id: where.projectId,
      } as FindOptionsWhere<ProjectEntity>;

      delete where.projectId;
    }

    const [results, count] = await this.pagesRepository.findAndCount({
      relations,
      where,
      order: {
        createdAt: 'DESC',
      },
    });

    const jobStatuses = await this.jobStatusesService.fetchAll(
      'pages',
      results.map((p) => p.id),
    );

    results.forEach((page) => {
      page.jobStatuses = jobStatuses.filter((j) => j.resourceId === page.id);
    });

    return {
      results,
      total: count,
      pages: 1, // Assuming pagination is not implemented yet
    };
  }

  async fetchOne(options: FindOneOptions<PageEntity>): Promise<PageEntity> {
    const page = await this.pagesRepository.findOne(options);

    if (!page) {
      throw new NotFoundError(this.langService.t('.ERRORS.NOT_FOUND'));
    }

    await this.refreshJobStatuses(page);

    return page;
  }

  async create(data: PageCreateInputDto): Promise<PageEntity> {
    let sanitizedPath = sanitizedFileName(data.path);

    if (!data.homePage && (data.path ?? '') === '') {
      sanitizedPath = await this.generateUniquePathFor(
        sanitizedPath,
        data.projectId,
      );
    }

    data.path = sanitizedPath;

    const parsedData = await this.createValidateOrFail(data);

    if (parsedData.homePage) {
      parsedData.lastKnownRoute = sanitizedPath;
    }

    const page = new PageEntity({
      ...parsedData,
      project: { id: data.projectId } as ProjectEntity,
    });

    await this.dbSave(page);

    return page;
  }

  async update(id: number, data: PageUpdateInputDto): Promise<PageEntity> {
    let sanitizedPath = sanitizedFileName(data.path);

    if (!data.homePage && (data.path ?? '') === '') {
      sanitizedPath = await this.generateUniquePathFor(
        sanitizedPath,
        data.projectId,
        id,
      );
    }

    data.path = sanitizedPath;

    const page = await this.fetchOne({ where: { id } });

    const parsedData = await this.updateValidateOrFail(data, id);

    Object.assign(page, parsedData);

    await this.dbSave(page);

    return page;
  }

  async destroy(id: number): Promise<boolean> {
    const page = await this.fetchOne({ where: { id } });

    // await this.pagesDeleteService.delete(page);
    const websolutManager = new WebsolutCore.Manager({
      figmaToken: page.figmaToken || '-error-',
      figmaFileKey: page.figmaFileKey,
      figmaNodeId: page.figmaNodeId,
      dataDirPath: this.config.dataDirPath,
    });

    websolutManager.loadData(page.contentVariantName);
    if (
      !(await this.pagesRepository.exists({
        where: {
          id: Not(page.id),
          figmaFileKey: page.figmaFileKey,
          figmaNodeId: page.figmaNodeId,
        },
      }))
    ) {
      websolutManager.deleteData();
    }

    this.deleteVariantDir(page);
    this.deleteExportDir(page);
    this.deleteDeployDir(page);
    this.deletePreviewDirs(page);

    await this.dbDelete(page);

    return true;
  }

  async refreshJobStatuses(page: PageEntity) {
    page.jobStatuses = await this.jobStatusesService.fetchAll('pages', page.id);
  }

  async dbSave(page: PageEntity): Promise<boolean> {
    const isUpdate = page.id !== undefined && page.id !== null;

    if (page.homePage) {
      const query: FindOptionsWhere<PageEntity> = {
        homePage: true,
        project: { id: page.projectId },
      };
      if (page.id) query.id = Not(page.id);

      const existingPages = await this.pagesRepository.find({ where: query });

      for (const existingPage of existingPages) {
        existingPage.path = await this.generateUniquePathFor(
          existingPage.lastKnownRoute ||
            sanitizedRoute(existingPage.figmaNodeName),
          existingPage.projectId,
          existingPage.id,
        );
        existingPage.homePage = false;

        await this.pagesRepository.save(existingPage);
        await this.refreshJobStatuses(existingPage);
        this.pagesGateway.publishUpdate(existingPage);
      }

      page.lastKnownRoute = page.path || sanitizedRoute(page.figmaNodeName);
      page.path = '';
    } else if (page.path === '') {
      page.path = await this.generateUniquePathFor(
        sanitizedRoute(page.figmaNodeName),
        page.projectId,
      );
    }

    await this.pagesRepository.save(page);

    await this.refreshJobStatuses(page);

    if (isUpdate) {
      this.pagesGateway.publishUpdate(page);
    } else {
      this.pagesGateway.publishCreate(page);
    }

    return true;
  }

  async dbDelete(page: PageEntity): Promise<boolean> {
    const oldPage = new PageEntity({ ...page });

    await this.pagesRepository.remove(page);

    this.pagesGateway.publishDelete(oldPage);

    return new Promise((resolve) => resolve(true));
  }

  async generateUniquePathFor(
    uniquePath: string,
    projectId: number,
    pageId?: number,
  ): Promise<string> {
    let index = await this.pagesRepository.count({
      where: {
        project: { id: projectId },
      },
    });

    while (true) {
      const isUnique = await this.checkPathUniqueness(
        uniquePath,
        projectId,
        pageId,
      );

      if (isUnique) {
        break;
      }

      index++;
      uniquePath = `page${index}\0`;

      if (index === MAX_UNIQUE_PATH_ATTEMPTS) {
        throw new Error(
          'Unable to generate a unique path after maximum attempts',
        );
      }
    }

    return uniquePath;
  }

  private async createValidateOrFail(
    data: PageCreateInputDto,
  ): Promise<PageEntity> {
    const validationSchema = z.object({
      path: z
        .string()
        .trim()
        .max(PATH_MAX_LENGTH, {
          message: this.langService.t('.VALIDATIONS.MAX_LENGTH', {
            length: PATH_MAX_LENGTH,
          }),
        }),
      homePage: z.boolean(),
      figmaUrl: z
        .string()
        .trim()
        .min(1, { message: this.langService.t('.VALIDATIONS.REQUIRED') })
        .url({ message: this.langService.t('.VALIDATIONS.INVALID') })
        .refine(
          (urlString) => {
            try {
              const url = new URL(urlString);

              return (url.searchParams.get('node-id') ?? '') !== '';
            } catch {
              return false;
            }
          },
          {
            message: this.langService.t('.VALIDATIONS.NODE_ID_REQUIRED'),
          },
        ),
      projectId: z.number().int().positive({}),
      figmaToken: z
        .string()
        .min(1, { message: this.langService.t('.VALIDATIONS.REQUIRED') }),
    });

    const parsedData = await this.validateOrFail(data, validationSchema);

    const figmaUrl = new URL(parsedData.figmaUrl);

    parsedData.figmaNodeId = figmaUrl.searchParams.get('node-id') || '';
    parsedData.figmaFileKey = parsedData.figmaUrl.split('/')[4] || '';

    return parsedData;
  }

  private async updateValidateOrFail(
    data: PageUpdateInputDto,
    pageId: number,
  ): Promise<PageEntity> {
    const validationSchema = z.object({
      path: z
        .string()
        .trim()
        .max(PATH_MAX_LENGTH, {
          message: this.langService.t('.VALIDATIONS.MAX_LENGTH', {
            length: PATH_MAX_LENGTH,
          }),
        }),
      homePage: z.boolean(),
      projectId: z.number().int().positive({}),
      figmaToken: z.string(),
    });

    return this.validateOrFail(data, validationSchema, pageId);
  }

  private async checkPathUniqueness(
    path: string,
    projectId: number,
    pageId?: number,
  ): Promise<boolean> {
    const query: FindOptionsWhere<PageEntity> = {
      path,
      project: { id: projectId },
    };

    if (pageId) {
      query.id = Not(pageId);
    }

    return !(await this.pagesRepository.exists({ where: query }));
  }

  private async validateOrFail(
    data: PageCreateInputDto | PageUpdateInputDto,
    validationSchema: z.ZodObject<z.ZodRawShape>,
    pageId?: number,
  ): Promise<PageEntity> {
    const project: ProjectEntity | null =
      await this.projectsRepository.findOneBy({
        id: data.projectId,
      });

    const result = this.validateSchema(validationSchema, data);
    const parsedData = result.data as PageEntity;

    if (!(await this.checkPathUniqueness(data.path, data.projectId, pageId))) {
      result.errors['path'] ||= [];
      result.errors['path'].push(this.langService.t('.VALIDATIONS.TAKEN'));
    }

    if (
      !data.homePage &&
      (await this.noOtherHomePage(data.projectId, pageId))
    ) {
      result.errors['homePage'] ||= [];
      result.errors['homePage'].push(
        this.langService.t('.VALIDATIONS.MUST_HAVE_ONE_HOME_PAGE'),
      );
    }

    if (!project) {
      result.errors['projectId'] ||= [];
      result.errors['projectId'].push(
        this.langService.t('.VALIDATIONS.PROJECT_NOT_FOUND'),
      );
    }

    if (Object.keys(result.errors).length) {
      throw new InvalidArgumentError(
        this.langService.t('.ERRORS.INVALID_ARGUMENT'),
        result.errors,
      );
    }

    return parsedData;
  }

  protected async noOtherHomePage(projectId: number, pageId?: number) {
    const query: FindOptionsWhere<PageEntity> = {
      homePage: true,
      project: { id: projectId },
    };

    if (pageId) {
      query.id = Not(pageId);
    }

    return !(await this.pagesRepository.exists({ where: query }));
  }

  protected deleteVariantDir(page: PageEntity): void {
    this.deleteDirectory(
      path.join(
        this.config.dataDirPath,
        page.figmaFileKey,
        page.figmaNodeId,
        WebsolutCore.VARIANTS_DIR_NAME,
        page.contentVariantName,
      ),
    );
  }
  protected deleteExportDir(page: PageEntity): void {
    this.deleteDirectory(
      path.join(this.config.exportDirPath, page.pathForInternalExport),
    );

    this.deleteDirectory(path.join(this.config.exportDirPath, PAGES_DIR_NAME));
  }

  protected deleteDeployDir(page: PageEntity): void {
    this.deleteDirectory(
      path.join(this.config.deployDirPath, page.pathForInternalExport),
    );

    this.deleteDirectory(path.join(this.config.deployDirPath, PAGES_DIR_NAME));
  }

  protected deletePreviewDirs(page: PageEntity): void {
    this.deleteDirectory(
      path.join(this.config.previewDirPath, page.pathForInternalExport),
    );
    this.deleteDirectory(path.join(this.config.previewDirPath, PAGES_DIR_NAME));
  }

  protected deleteDirectory(dirPath: string) {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }
}
