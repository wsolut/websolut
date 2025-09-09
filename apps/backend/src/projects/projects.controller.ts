import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import {
  ApiController,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
} from '../decorators';
import { ApiTags, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { ProjectInputDto, ProjectsService } from './projects.service';
import { HttpResponseDto, DownloadableFileDetails } from '../entities';
import { ProjectEntity } from './project.entity';
import { createReadStream } from 'fs';
import { ProjectsExportStaticHtmlService } from './projects-export-static-html.service';
import {
  ProjectResponse,
  ProjectSerializerService,
} from './project-serializer.service';
import { ProjectsDeployToVercelService } from './projects-deploy-to-vercel.service';
import { HttpRecordResponseDto, HttpRecordsResponseDto } from '../entities';
import { ProjectDeployDto } from './projects.dto';
import { ProjectsExportWordpressService } from './projects-export-wordpress.service';
import { ProjectsDeployToWordpressService } from './projects-deploy-to-wordpress.service';

export class HttpProjectResponse extends HttpRecordResponseDto<ProjectResponse> {
  @ApiProperty({
    description: 'Project details',
    type: ProjectResponse,
  })
  declare data: ProjectResponse;
}

export class HttpProjectsResponse extends HttpRecordsResponseDto<ProjectResponse> {
  @ApiProperty({
    description: 'List of Projects',
    type: [ProjectResponse],
  })
  declare data: ProjectResponse[];
}

@ApiTags('Projects')
@Controller('api/projects')
@ApiController()
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectSerializerService: ProjectSerializerService,
    private readonly projectsExportStaticHtmlService: ProjectsExportStaticHtmlService,
    private readonly projectsDeployToVercelService: ProjectsDeployToVercelService,
    private readonly projectsExportWordpressService: ProjectsExportWordpressService,
    private readonly ProjectsDeployToWordpressService: ProjectsDeployToWordpressService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: HttpProjectsResponse,
  })
  async fetchAll(
    @Query() query: FindOptionsWhere<ProjectEntity>,
  ): Promise<HttpProjectsResponse> {
    const { results, total, pages } =
      await this.projectsService.fetchAll(query);

    return {
      code: 200,
      data: results.map((project) =>
        this.projectSerializerService.serialize(project),
      ),
      meta: { total, pages },
    };
  }

  @Get(':id')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: HttpProjectResponse,
  })
  @ApiNotFoundResponse()
  async fetchOne(@Param('id') id: number): Promise<HttpProjectResponse> {
    const project = await this.projectsService.fetchOne({ where: { id } });

    return {
      code: 200,
      data: this.projectSerializerService.serialize(project),
    };
  }

  @Post()
  @HttpCode(201)
  @ApiResponse({
    status: 201,
    description: 'Success',
    type: HttpProjectResponse,
  })
  @ApiUnprocessableEntityResponse()
  async create(@Body() data: ProjectInputDto): Promise<HttpProjectResponse> {
    const project = await this.projectsService.create(data);

    return {
      code: 201,
      data: this.projectSerializerService.serialize(project),
    };
  }

  @Put(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Success' })
  @ApiNotFoundResponse()
  @ApiUnprocessableEntityResponse()
  async update(
    @Param('id') id: number,
    @Body() data: ProjectInputDto,
  ): Promise<HttpResponseDto> {
    await this.projectsService.update(id, data);

    return { code: 204 };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Success' })
  @ApiNotFoundResponse()
  async destroy(@Param('id') id: number): Promise<HttpResponseDto> {
    await this.projectsService.destroy(id);

    return { code: 204 };
  }

  @Get(':id/export/:strategy')
  @HttpCode(200)
  @ApiNotFoundResponse()
  async export(
    @Param('id') id: number,
    @Param('strategy') strategy: string,
  ): Promise<StreamableFile> {
    let fileDetails: DownloadableFileDetails | undefined = undefined;

    if (strategy === 'static-html') {
      fileDetails = await this.projectsExportStaticHtmlService.exportAndZip(id);
    } else if (strategy === 'wordpress') {
      fileDetails = await this.projectsExportWordpressService.exportAndZip(id);
    }
    if (fileDetails) {
      const file = createReadStream(fileDetails.filePath);

      return new StreamableFile(file, {
        type: fileDetails.contentType,
        disposition: `attachment; filename="${fileDetails.fileName}"`,
        // If you want to define the Content-Length value to another value instead of file's length:
        // length: 123,
      });
    } else {
      throw new Error(`Unsupported strategy: ${strategy}`);
    }
  }

  @Post(':id/deploy/:strategy')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Exports the project to Static HTML and deploys it to vercel',
    type: HttpProjectResponse,
  })
  @ApiUnprocessableEntityResponse()
  @ApiNotFoundResponse()
  async deploy(
    @Param('id') id: number,
    @Param('strategy') strategy: string,
    @Body() data: ProjectDeployDto,
  ): Promise<HttpProjectResponse> {
    if (strategy === 'vercel') {
      const project = await this.projectsDeployToVercelService.deploy(id, data);

      return {
        code: 200,
        data: this.projectSerializerService.serialize(project),
      };
    } else if (strategy === 'wordpress') {
      const project = await this.ProjectsDeployToWordpressService.deploy(
        id,
        data,
      );

      return {
        code: 200,
        data: this.projectSerializerService.serialize(project),
      };
    } else {
      throw new Error(`Unsupported strategy: ${strategy}`);
    }
  }
}
