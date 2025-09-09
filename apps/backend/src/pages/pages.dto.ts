import { ApiProperty } from '@nestjs/swagger';

export class PageDeployDto {
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
