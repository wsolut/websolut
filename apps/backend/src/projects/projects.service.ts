import z from 'zod';
import {
  FindOneOptions,
  FindOptionsRelations,
  FindOptionsWhere,
  Not,
  Repository,
} from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InvalidArgumentError, NotFoundError } from '../entities';
import { BaseService } from '../services';
import { I18nService } from 'nestjs-i18n';
import { ProjectEntity } from './project.entity';
import { Config } from '../config';
import { ProjectInputDto, ProjectsPaginated } from './projects.dto';
import { ProjectsGateway } from './projects.gateway';
import { JobStatusesService } from '../job-statuses';

const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 500;

@Injectable()
export class ProjectsService extends BaseService {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    @InjectRepository(ProjectEntity)
    private projectsRepository: Repository<ProjectEntity>,
    protected readonly i18nService: I18nService,
    private readonly projectsGateway: ProjectsGateway,
    private readonly jobStatusesService: JobStatusesService,
  ) {
    super(i18nService);
  }

  // https://zod.dev/api
  protected _validationSchema?: z.ZodObject<z.ZodRawShape>;
  get validationSchema(): z.ZodObject<z.ZodRawShape> {
    this._validationSchema ||= z.object({
      name: z
        .string()
        .trim()
        .min(1, { message: this.langService.t('.VALIDATIONS.REQUIRED') })
        .max(NAME_MAX_LENGTH, {
          message: this.langService.t('.VALIDATIONS.MAX_LENGTH', {
            length: NAME_MAX_LENGTH,
          }),
        }),
      description: z
        .string()
        .trim()
        .max(DESCRIPTION_MAX_LENGTH, {
          message: this.langService.t('.VALIDATIONS.MAX_LENGTH', {
            length: DESCRIPTION_MAX_LENGTH,
          }),
        })
        .optional()
        .nullable(),
      tags: z.array(z.string()).optional().nullable(),
      outDirPath: z.string().trim().optional(),
      templatesDirPath: z.string().trim().optional(),
      assetsOutDir: z.string().trim().optional(),
      assetsPrefixPath: z.string().trim().optional(),
    });

    return this._validationSchema;
  }

  async fetchAll(
    where: FindOptionsWhere<ProjectEntity>,
    relations?: FindOptionsRelations<ProjectEntity>,
  ): Promise<ProjectsPaginated> {
    const [results, count] = await this.projectsRepository.findAndCount({
      where,
      relations,
    });

    const jobStatuses = await this.jobStatusesService.fetchAll(
      'projects',
      results.map((p) => p.id),
    );

    results.forEach((project) => {
      project.jobStatuses = jobStatuses.filter(
        (j) => j.resourceId === project.id,
      );
    });

    return {
      results,
      total: count,
      pages: 1, // Assuming pagination is not implemented yet
    };
  }

  async fetchOne(
    options: FindOneOptions<ProjectEntity>,
  ): Promise<ProjectEntity> {
    const project = await this.projectsRepository.findOne(options);

    if (!project) {
      throw new NotFoundError(this.langService.t('.ERRORS.NOT_FOUND'));
    }

    await this.refreshJobStatuses(project);

    return project;
  }

  async create(data: ProjectInputDto): Promise<ProjectEntity> {
    const parsedData = await this._validateOrFail(data, {
      name: data.name?.trim(),
    });

    const project = new ProjectEntity(parsedData);

    await this.dbSave(project);

    return project;
  }

  async update(id: number, data: ProjectInputDto): Promise<boolean> {
    const project = await this.fetchOne({ where: { id } });

    const parsedData = await this._validateOrFail(data, {
      name: data.name?.trim(),
      id: Not(id),
    });

    Object.assign(project, parsedData);

    await this.dbSave(project);

    return true;
  }

  async destroy(id: number): Promise<boolean> {
    const project = await this.fetchOne({ where: { id } });

    await this.dbDelete(project);

    return true;
  }

  async refreshJobStatuses(project: ProjectEntity) {
    project.jobStatuses = await this.jobStatusesService.fetchAll(
      'projects',
      project.id,
    );
  }

  async dbSave(project: ProjectEntity): Promise<boolean> {
    const isUpdate = project.id !== undefined && project.id !== null;

    await this.projectsRepository.save(project);

    await this.refreshJobStatuses(project);

    if (isUpdate) {
      this.projectsGateway.publishUpdate(project);
    } else {
      this.projectsGateway.publishCreate(project);
    }

    return true;
  }

  async dbDelete(page: ProjectEntity): Promise<boolean> {
    const oldProject = new ProjectEntity({ ...page });

    await this.projectsRepository.remove(page);

    this.projectsGateway.publishDelete(oldProject);

    return new Promise((resolve) => resolve(true));
  }

  async _validateOrFail(
    data: ProjectInputDto,
    where: FindOptionsWhere<ProjectEntity>,
  ): Promise<ProjectEntity> {
    const result = this.validateSchema(this.validationSchema, data);

    if (await this.projectsRepository.exists({ where })) {
      result.errors['name'] ||= [];
      result.errors['name'].push(this.langService.t('.VALIDATIONS.TAKEN'));
    }

    if (Object.keys(result.errors).length) {
      throw new InvalidArgumentError(
        this.langService.t('.ERRORS.INVALID_ARGUMENT'),
        result.errors,
      );
    }

    return result.data as ProjectEntity;
  }
}
export { ProjectInputDto };
