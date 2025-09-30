import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { I18nModule } from 'nestjs-i18n';
import { buildI18nConfig, Config } from './config';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { ServeStaticModule } from '@nestjs/serve-static';
import {
  ProjectsController,
  ProjectsDeployToVercelService,
  ProjectSerializerService,
  ProjectsExportStaticHtmlService,
  ProjectsExportStaticHtmlForVercelService,
  ProjectsGateway,
  ProjectsService,
  ProjectsExportWordpressService,
  ProjectsDeployToWordpressService,
} from './projects';
import {
  JobStatusesService,
  JobStatusesGateway,
  JobStatusSerializerService,
} from './job-statuses';
import {
  PagesController,
  PageSerializerService,
  PagesExportPreviewService,
  PagesExportStaticHtmlService,
  PagesExportWordpressService,
  PagesGateway,
  PagesPreviewContentService,
  PagesService,
  PagesSynchronizeService,
} from './pages';
import { AsyncJobManagerService } from './services';
import { RootController, SpaController } from './controllers';

const controllers = [
  ProjectsController,
  PagesController,
  SpaController,
  RootController,
];
const providers = [
  AsyncJobManagerService,
  JobStatusesGateway,
  JobStatusSerializerService,
  JobStatusesService,
  PageSerializerService,
  PagesExportPreviewService,
  PagesExportStaticHtmlService,
  PagesExportWordpressService,
  PagesGateway,
  PagesPreviewContentService,
  PagesService,
  PagesSynchronizeService,
  ProjectsDeployToVercelService,
  ProjectSerializerService,
  ProjectsExportStaticHtmlService,
  ProjectsExportStaticHtmlForVercelService,
  ProjectsGateway,
  ProjectsService,
  ProjectsExportWordpressService,
  ProjectsDeployToWordpressService,
] as Provider[];

class AppParentModule {}

export function AppModuleFactory(options: {
  ormConfig: TypeOrmModuleOptions;
  config: Config;
}): typeof AppParentModule {
  const { config, ormConfig } = options;

  @Module({
    imports: [
      I18nModule.forRoot(buildI18nConfig(config.i18nDirPath)),
      TypeOrmModule.forRoot(ormConfig),
      TypeOrmModule.forFeature(ormConfig.entities as EntityClassOrSchema[]),
      ServeStaticModule.forRoot({
        rootPath: config.publicDirPath,
        serveRoot: '/',
      }),
    ],
    controllers,
    providers: [...providers, { provide: 'CONFIG', useValue: config }],
  })
  class AppModule extends AppParentModule {}

  return AppModule;
}
