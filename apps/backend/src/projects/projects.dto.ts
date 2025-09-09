import { ApiProperty } from '@nestjs/swagger';
import { ProjectEntity } from './project.entity';

export class ProjectInputDto {
  @ApiProperty({
    description: 'Name of the Project',
    example: 'My Project',
    required: true,
  })
  name?: string;

  @ApiProperty({
    description: 'Description of the Project',
    example: 'This is a sample project.',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Vercel Token for deployment',
  })
  vercelToken?: string | null;

  @ApiProperty({
    description: 'Tags of the Project',
    example: ['figma', 'design', 'ui'],
    isArray: true,
    required: false,
  })
  tags?: string[];

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
}

export type ProjectsPaginated = {
  results: ProjectEntity[];
  total: number;
  pages: number;
};

export class ProjectDeployDto {
  @ApiProperty({
    description: 'Token to authenticate during deployment',
    required: true,
  })
  token!: string;

  @ApiProperty({
    description: 'Name of the Project that is going to be deployed',
  })
  projectName: string;

  @ApiProperty({
    description: 'Base URL of the Project that is going to be deployed',
  })
  baseUrl: string;
}
