import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JobStatusEntity } from './job-status.entity';
import { JobStatusesGateway } from './job-statuses.gateway';

@Injectable()
export class JobStatusesService {
  constructor(
    @InjectRepository(JobStatusEntity)
    private jobStatusesRepository: Repository<JobStatusEntity>,
    private jobStatusesGateway: JobStatusesGateway,
  ) {}

  async fetchAll(
    resourceType: string,
    resourceId: number | number[],
  ): Promise<JobStatusEntity[]> {
    const query: FindOptionsWhere<JobStatusEntity> = { resourceType };

    if (Array.isArray(resourceId)) {
      query.resourceId = In(resourceId);
    } else {
      query.resourceId = resourceId;
    }

    const results = await this.jobStatusesRepository.find({
      where: query,
    });

    return results;
  }

  async fetchOne(
    resourceId: number,
    resourceType: string,
    name: string,
  ): Promise<JobStatusEntity | null> {
    const result = await this.jobStatusesRepository.findOne({
      where: {
        name,
        resourceId,
        resourceType,
      },
    });

    return result;
  }

  async setAsStarted(
    jobStatus: JobStatusEntity,
    input?: Partial<JobStatusEntity>,
  ): Promise<JobStatusEntity> {
    const data = { ...jobStatus.data, ...(input?.data || {}) };

    Object.assign(jobStatus, {
      startedAt: new Date(),
      finishedAt: null,
      errorCode: 0,
      errorMessage: '',
      errorStackTrace: '',
      ...(input || {}),
      data,
    });

    await this.dbSave(jobStatus);

    return jobStatus;
  }

  async setAsFinished(
    jobStatus: JobStatusEntity,
    input?: Partial<JobStatusEntity>,
  ): Promise<JobStatusEntity> {
    const data = { ...jobStatus.data, ...(input?.data || {}) };

    Object.assign(jobStatus, {
      finishedAt: new Date(),
      ...(input || {}),
      data,
    });

    await this.dbSave(jobStatus);

    return jobStatus;
  }

  async upsert(
    resourceId: number,
    resourceType: string,
    name: string,
    input?: Partial<JobStatusEntity>,
  ): Promise<JobStatusEntity> {
    let jobStatus = await this.fetchOne(resourceId, resourceType, name);

    const data = { ...(jobStatus?.data || {}), ...(input?.data || {}) };

    jobStatus ||= this.jobStatusesRepository.create({
      resourceId,
      resourceType,
      name,
    });

    if (input) Object.assign(jobStatus, { ...input, data });

    await this.dbSave(jobStatus);

    return jobStatus;
  }

  async dbSave(jobStatus: JobStatusEntity): Promise<boolean> {
    const isUpdate = jobStatus.id !== undefined && jobStatus.id !== null;

    await this.jobStatusesRepository.save(jobStatus);

    if (isUpdate) {
      this.jobStatusesGateway.publishUpdate(jobStatus);
    } else {
      this.jobStatusesGateway.publishCreate(jobStatus);
    }

    return true;
  }

  async dbDelete(jobStatus: JobStatusEntity): Promise<boolean> {
    const oldJobStatus = new JobStatusEntity({ ...jobStatus });

    await this.jobStatusesRepository.remove(jobStatus);

    this.jobStatusesGateway.publishDelete(oldJobStatus);

    return new Promise((resolve) => resolve(true));
  }
}
