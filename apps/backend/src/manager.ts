import { NestFactory } from '@nestjs/core';
import { INestApplication, NestApplicationOptions } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModuleFactory } from './app.module';
import { LoggerService } from './services/logger.service';
import swaggerConfig from './config/swagger.config';
import { DataSource } from 'typeorm';
import {
  db,
  buildConfig,
  buildTypeOrmConfig,
  Config,
  scaffoldDirectories,
} from './config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PortAlreadyInUseError } from './entities';

export { PortAlreadyInUseError };

export type ManagerInput = {
  outDirPath: string;
  logToFileSystem?: boolean;
};

export class Manager {
  port?: number;
  config: Config;
  ormConfig: TypeOrmModuleOptions;
  running: boolean = false;
  logToFileSystem: boolean = false;
  app?: INestApplication;

  constructor(input: ManagerInput) {
    this.config = buildConfig(input.outDirPath);

    this.ormConfig = buildTypeOrmConfig({
      database: this.config.databaseFilePath,
      synchronize: false, // We want to control migrations manually
    });

    if (input.logToFileSystem) this.logToFileSystem = input.logToFileSystem;
  }

  get baseUrl(): string {
    if (!this.running) throw new Error('Server is not running');

    return `http://localhost:${this.port}`;
  }

  get url(): string {
    if (!this.running) throw new Error('Server is not running');

    return `${this.baseUrl}?view=standalone`;
  }

  async createServer(): Promise<INestApplication> {
    const options: NestApplicationOptions = {};

    if (this.logToFileSystem) {
      options.logger = new LoggerService(this.config.logsDirPath);
      options.bufferLogs = true; // Buffer logs until the logger is initialized
    }

    scaffoldDirectories(this.config);

    this.app = await NestFactory.create(
      AppModuleFactory({
        ormConfig: this.ormConfig,
        config: this.config,
      }),
      options,
    );

    this.app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    });

    const swaggerDocument = SwaggerModule.createDocument(
      this.app,
      swaggerConfig,
    );
    SwaggerModule.setup('docs/:version', this.app, swaggerDocument);

    return this.app;
  }

  async startServer(port: number): Promise<void> {
    this.app ||= await this.createServer();

    if (this.running) return;

    this.port = port;

    try {
      await this.app.listen(port);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('EADDRINUSE')) {
        throw new PortAlreadyInUseError(`port already in use :::${this.port}`);
      } else {
        throw error;
      }
    }

    await this.migrateDatabase();

    this.running = true;
  }

  async stopServer(): Promise<void> {
    if (!this.running) return;

    console.log('Stopping Backend Server...');

    if (this.app) {
      await this.app.close();
      this.app = undefined;
      this.port = undefined;
    }

    this.running = false;
  }

  protected async migrateDatabase(): Promise<void> {
    try {
      const dataSource = this.app?.get(DataSource);

      if (dataSource) {
        await dataSource.runMigrations();
        // await db.migrateDown(dataSource);
        await db.migrateUp(dataSource);

        await db.seed(dataSource.manager);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
}
