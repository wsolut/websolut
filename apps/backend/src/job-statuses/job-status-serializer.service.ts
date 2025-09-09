import { Injectable } from '@nestjs/common';
import { JobStatusEntity } from './job-status.entity';
import { ApiProperty } from '@nestjs/swagger';

export class JobStatusResponse {
  @ApiProperty({ description: 'Id of the JobStatus', example: 1 })
  id!: number;

  @ApiProperty({ description: 'Name of the JobStatus', example: 'In Progress' })
  name: string = '';

  @ApiProperty({ description: 'Id of the resource', example: 1 })
  resourceId: number = 0;

  @ApiProperty({ description: 'Type of the resource', example: 'Page' })
  resourceType: string = '';

  @ApiProperty({
    description: 'Start time of the JobStatus',
    example: '2023-01-01T00:00:00Z',
  })
  startedAt: string | null = null;

  @ApiProperty({
    description: 'Finish time of the JobStatus',
    example: '2023-01-01T00:00:00Z',
  })
  finishedAt: string | null = null;

  @ApiProperty({
    description: 'Data associated with the JobStatus',
    example: {},
  })
  data: object | null = null;

  @ApiProperty({
    description: 'Error code associated with the JobStatus',
    example: 0,
  })
  errorCode: number = 0;

  @ApiProperty({
    description: 'Error message associated with the JobStatus',
    example: 'An error occurred',
  })
  errorMessage: string | null = null;

  errorStackTrace: string | null = null;
}

@Injectable()
export class JobStatusSerializerService {
  constructor() {}

  serialize(jobStatus: JobStatusEntity): JobStatusResponse {
    return {
      id: jobStatus.id,
      name: jobStatus.name,
      resourceId: jobStatus.resourceId,
      resourceType: jobStatus.resourceType,
      startedAt: jobStatus.startedAt ? jobStatus.startedAt.toISOString() : null,
      finishedAt: jobStatus.finishedAt
        ? jobStatus.finishedAt.toISOString()
        : null,
      data: jobStatus.data,
      errorCode: jobStatus.errorCode,
      errorMessage: jobStatus.errorMessage,
      errorStackTrace: jobStatus.errorStackTrace,
    };
  }
}
