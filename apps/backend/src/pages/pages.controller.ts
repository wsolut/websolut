import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiController } from '../decorators';
import {
  ApiTags,
  ApiResponse,
  ApiQuery,
  ApiNotFoundResponse,
  ApiProperty,
  ApiUnprocessableEntityResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import {
  PageFetchInputDto,
  PageCreateInputDto,
  PageUpdateInputDto,
  PagesService,
} from './pages.service';
import {
  DownloadableFileDetails,
  HttpRecordResponseDto,
  HttpRecordsResponseDto,
  HttpResponseDto,
} from '../entities';
import { PageEntity } from './page.entity';
import { FindOptionsWhere } from 'typeorm';
import { createReadStream } from 'fs';
import {
  PageUpdateContentInputDto,
  PagesPreviewContentService,
} from './pages-preview-content.service';
import { PagesSynchronizeService } from './pages-synchronize.service';
import { PagesExportStaticHtmlService } from './pages-export-static-html.service';
import { PagesExportWordpressService } from './pages-export-wordpress.service';
import { Config } from '../config';
import {
  PageResponse,
  PageContentResponse,
  PageSerializerService,
} from './page-serializer.service';
import { ProjectsService } from '../projects';

export class HttpPageContentResponse extends HttpRecordResponseDto<PageContentResponse> {
  @ApiProperty({
    description: 'Page content data details',
    type: PageContentResponse,
  })
  declare data: PageContentResponse;
}

export class HttpPageResponse extends HttpRecordResponseDto<PageResponse> {
  @ApiProperty({
    description: 'Page details',
    type: PageResponse,
  })
  declare data: PageResponse;
}

export class HttpPagesResponseDto extends HttpRecordsResponseDto<PageResponse> {
  @ApiProperty({
    description: 'List of Pages',
    type: [PageResponse],
  })
  declare data: PageResponse[];
}

@ApiTags('Pages')
@Controller('api/pages')
@ApiController()
export class PagesController {
  constructor(
    @Inject('CONFIG') readonly config: Config,
    private readonly pagesService: PagesService,
    private readonly projectsService: ProjectsService,
    private readonly pageSerializerService: PageSerializerService,
    private readonly pagesPreviewContentService: PagesPreviewContentService,
    private readonly pagesSynchronizeService: PagesSynchronizeService,
    private readonly pagesExportStaticHtmlService: PagesExportStaticHtmlService,
    private readonly pagesExportWordpressService: PagesExportWordpressService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: HttpPagesResponseDto,
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Params to filter Pages',
    type: PageFetchInputDto,
  })
  async fetchAll(
    @Query() query: FindOptionsWhere<PageEntity>,
  ): Promise<HttpPagesResponseDto> {
    const { results, total, pages } = await this.pagesService.fetchAll(query);

    return {
      code: 200,
      data: results.map((page) => this.pageSerializerService.serialize(page)),
      meta: { total, pages },
    };
  }

  @Get(':id')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: HttpPageResponse,
  })
  @ApiNotFoundResponse()
  async fetchOne(@Param('id') id: number): Promise<HttpPageResponse> {
    const page = await this.pagesService.fetchOne({ where: { id } });

    return { code: 200, data: this.pageSerializerService.serialize(page) };
  }

  @Post()
  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'Page successfully created',
    type: HttpPageResponse,
  })
  async create(@Body() data: PageCreateInputDto): Promise<HttpPageResponse> {
    const page = await this.pagesService.create(data);

    const project = await this.projectsService.fetchOne({
      where: { id: data.projectId },
    });

    if (project && (project.figmaToken ?? '') === '') {
      project.figmaToken = page.figmaToken;

      await this.projectsService.dbSave(project);
    }

    return { code: 201, data: this.pageSerializerService.serialize(page) };
  }

  @Put(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Success' })
  @ApiNotFoundResponse()
  @ApiUnprocessableEntityResponse()
  async update(
    @Param('id') id: number,
    @Body() data: PageUpdateInputDto,
  ): Promise<HttpResponseDto> {
    await this.pagesService.update(id, data);

    return { code: 204 };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Success' })
  @ApiNotFoundResponse()
  async destroy(@Param('id') id: number): Promise<HttpResponseDto> {
    await this.pagesService.destroy(id);

    return { code: 204 };
  }

  @Get(':id/content')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: HttpPageContentResponse,
  })
  @ApiNotFoundResponse()
  async content(@Param('id') id: number): Promise<HttpPageContentResponse> {
    const contentData = await this.pagesPreviewContentService.fetchContent(id);

    return { code: 200, data: contentData };
  }

  @Patch(':id/content')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: HttpPageResponse,
  })
  @ApiNotFoundResponse()
  async updateContent(
    @Param('id') id: number,
    @Body() input: PageUpdateContentInputDto,
  ): Promise<HttpPageResponse> {
    const page = await this.pagesPreviewContentService.updateContent(id, input);

    return { code: 200, data: this.pageSerializerService.serialize(page) };
  }

  @Delete(':id/content')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: HttpPageResponse,
  })
  @ApiNotFoundResponse()
  async revertContent(@Param('id') id: number): Promise<HttpPageResponse> {
    const page = await this.pagesPreviewContentService.revertContent(id);

    return { code: 200, data: this.pageSerializerService.serialize(page) };
  }

  @Patch(':id/synchronize')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Starts synchronization with Figma in the background',
    type: HttpPageResponse,
  })
  @ApiNotFoundResponse()
  async synchronize(@Param('id') id: number): Promise<HttpPageResponse> {
    const page = await this.pagesSynchronizeService.synchronize(id);

    return { code: 200, data: this.pageSerializerService.serialize(page) };
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
      fileDetails = await this.pagesExportStaticHtmlService.exportAndZip(id);
    } else if (strategy === 'wordpress') {
      fileDetails = await this.pagesExportWordpressService.exportAndZip(id);
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
}
