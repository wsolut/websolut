import { Injectable } from '@nestjs/common';
import { JobStatusResponse, JobStatusSerializerService } from '../job-statuses';
import { ProjectEntity } from './project.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ProjectResponse {
  @ApiProperty({ description: 'Id of the Project', example: 1 })
  id!: number;

  @ApiProperty({
    description: 'Name of the Project',
    example: 'My Project',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the Project',
    example: 'This is a sample project.',
  })
  description: string;

  @ApiProperty({
    description: 'Figma Token to use during Figma API requests',
  })
  figmaToken: string | null;

  @ApiProperty({
    description: 'Tags of the Project',
    example: ['figma', 'design', 'ui'],
    isArray: true,
  })
  tags: string[];

  @ApiProperty({
    description: 'Output directory path for the Page.',
  })
  outDirPath: string;

  @ApiProperty({
    description: 'Templates directory path for the Page.',
  })
  templatesDirPath: string;

  @ApiProperty({
    description: 'Assets output directory path for the Page.',
  })
  assetsOutDir: string;

  @ApiProperty({
    description: 'Assets prefix path for the Page.',
  })
  assetsPrefixPath: string;

  @ApiProperty({
    description: 'Date when Page was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: string | null = null;

  @ApiProperty({
    description: 'Date when Page was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: string | null = null;

  @ApiProperty({
    description: 'List of job statuses for the Page.',
    isArray: true,
  })
  jobStatuses!: JobStatusResponse[];
}

@Injectable()
export class ProjectSerializerService {
  constructor(
    private readonly jobStatusSerializerService: JobStatusSerializerService,
  ) {}

  serialize(project: ProjectEntity): ProjectResponse {
    return {
      id: project.id,
      outDirPath: project.outDirPath || '',
      templatesDirPath: project.templatesDirPath || '',
      assetsOutDir: project.assetsOutDir || '',
      assetsPrefixPath: project.assetsPrefixPath || '',
      name: project.name,
      description: project.description,
      figmaToken: project.figmaToken,
      tags: project.tags,
      createdAt: project.createdAt ? project.createdAt.toISOString() : null,
      updatedAt: project.updatedAt ? project.updatedAt.toISOString() : null,
      jobStatuses: project.jobStatuses.map((j) =>
        this.jobStatusSerializerService.serialize(j),
      ),
    };
  }
}
