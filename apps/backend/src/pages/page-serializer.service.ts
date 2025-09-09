import { Injectable } from '@nestjs/common';
import { JobStatusResponse, JobStatusSerializerService } from '../job-statuses';
import { PageEntity } from './page.entity';
import { ApiProperty } from '@nestjs/swagger';

export class PageContentResponse {
  [id: string]: {
    text: string;
  };
}

export class PageResponse {
  @ApiProperty({ description: 'Id of the Page', example: 1 })
  id!: number;

  @ApiProperty({
    description: 'Id of the Project that the Page belongs to',
    example: 1,
  })
  projectId!: number;

  @ApiProperty({
    description: 'URL path of the Page.',
  })
  path!: string;

  @ApiProperty({
    description: 'Indicator that there are committed changes.',
  })
  hasCommittedChanges!: boolean;

  @ApiProperty({
    description: 'Indicator that this Page is the home page.',
  })
  homePage!: boolean;

  @ApiProperty({
    description: 'Figma Token to use during Figma API requests',
  })
  figmaToken: string;

  @ApiProperty({
    description: 'Figma File Key to which this Page was created from.',
  })
  figmaFileKey!: string;

  @ApiProperty({
    description: 'Figma Node ID to which this Page was created from.',
  })
  figmaNodeId!: string;

  @ApiProperty({
    description: 'List of job statuses for the Page.',
    isArray: true,
  })
  jobStatuses!: JobStatusResponse[];

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
}

@Injectable()
export class PageSerializerService {
  constructor(
    private readonly jobStatusSerializerService: JobStatusSerializerService,
  ) {}

  serialize(page: PageEntity): PageResponse {
    return {
      figmaFileKey: page.figmaFileKey || '',
      figmaNodeId: page.figmaNodeId || '',
      figmaToken: page.figmaToken || '',
      hasCommittedChanges: page.hasCommittedChanges,
      homePage: page.homePage,
      id: page.id,
      path: page.path || '',
      projectId: page.projectId,
      updatedAt: page.updatedAt ? page.updatedAt.toISOString() : null,
      createdAt: page.createdAt ? page.createdAt.toISOString() : null,
      jobStatuses: page.jobStatuses.map((j) =>
        this.jobStatusSerializerService.serialize(j),
      ),
    };
  }
}
