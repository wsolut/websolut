import chalk from 'chalk';
import * as WebsolutCore from '@wsolut/websolut-core';
import { join } from 'path';
import { copyDirSync, createConfigFile, createDirSync } from './utils';

export type Config = {
  assetsOutDir: string;
  assetsPrefixPath: string;
  figmaToken: string;
  outDir: string;
  templateName: string;
};

export type ConvertOptions = {
  configDir: string;
  assetsOutDir?: string;
  assetsPrefixPath?: string;
  figmaToken?: string;
  figmaUrl: string;
  fileName: string;
  outDir?: string;
  templateName?: string;
};

export type WebsolutOptions = {
  assetsOutDir: string;
  assetsPrefixPath: string;
  dataDirPath: string;
  figmaFileKey: string;
  figmaNodeId: string;
  figmaToken: string;
  fileName: string;
  outDirPath: string;
  templateName: string;
  templatesDirPath: string;
};

export const TEMPLATES_DIR_NAME = 'templates';
export const DEFAULT_TEMPLATE_NAME = 'static-html';
export const TEMPLATE_NAMES = ['static-html', 'static-html-debug'];
export const DEFAULT_CONFIG_DIR_NAME = '.websolut';
export const DEFAULT_CONFIG_FILE_NAME = 'config.js';
export const DEFAULT_CONFIG: Config = {
  assetsOutDir: 'public',
  assetsPrefixPath: '/assets/',
  figmaToken: process.env.FIGMA_TOKEN,
  outDir: 'src',
  templateName: DEFAULT_TEMPLATE_NAME,
};

export class CLI {
  config: Config;

  constructor(config?: Config) {
    this.config = { ...DEFAULT_CONFIG };

    Object.keys(DEFAULT_CONFIG).forEach((key) => {
      if (config?.[key] !== undefined) {
        this.config[key as keyof Config] = config[key as keyof Config];
      }
    });

    this.setupGracefulShutdown();
  }

  async convert(options: ConvertOptions) {
    const websolutOptions = this.validateWebsolutOptions(options);
    const configPath = join(
      options.configDir,
      websolutOptions.figmaFileKey,
      websolutOptions.figmaNodeId,
      DEFAULT_CONFIG_FILE_NAME,
    );

    const manager = new WebsolutCore.Manager(websolutOptions);

    this.createTemplates(options.configDir, websolutOptions);
    createConfigFile(configPath, websolutOptions);

    try {
      await manager.synchronize({ force: true });

      manager.export(websolutOptions);
    } catch (error) {
      showError(
        `❌ Failed to add Figma file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const cleanup = () => {
      console.log(chalk.yellow('\n🛑 Shutting down Websolut CLI...'));
      // await this.stopApiServer();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGUSR1', cleanup);
    process.on('SIGUSR2', cleanup);
  }

  private validateWebsolutOptions(options: ConvertOptions): WebsolutOptions {
    const errors: string[] = [];

    const figmaUrl = new URL(options.figmaUrl);
    const figmaFileKey = figmaUrl.pathname.split('/')[2];
    const figmaNodeId = figmaUrl.searchParams.get('node-id') || '-node-id-';

    const websolutOptions: WebsolutOptions = {
      assetsOutDir: options.assetsOutDir || this.config.assetsOutDir,
      assetsPrefixPath:
        options.assetsPrefixPath || this.config.assetsPrefixPath,
      dataDirPath: options.configDir,
      figmaFileKey,
      figmaNodeId,
      figmaToken: options.figmaToken || this.config.figmaToken,
      fileName: options.fileName,
      outDirPath: options.outDir || this.config.outDir,
      templateName: options.templateName || this.config.templateName,
      templatesDirPath: join(
        options.configDir,
        figmaFileKey,
        figmaNodeId,
        TEMPLATES_DIR_NAME,
      ),
    };

    if ((websolutOptions.figmaFileKey ?? '') === '') {
      errors.push('figma-url is invalid, missing file key');
    }

    if ((websolutOptions.figmaNodeId ?? '') === '') {
      errors.push('figma-url is invalid, missing node id');
    }

    if (errors.length > 0) {
      showError('✖ Invalid options provided:');
      errors.forEach((error) => showError(`  • ${error}`));
      process.exit(1);
    }

    return websolutOptions;
  }

  private createTemplates(configDir: string, options: WebsolutOptions): void {
    const templatesSrc = join(
      configDir,
      TEMPLATES_DIR_NAME,
      options.templateName,
    );

    createDirSync(options.templatesDirPath);
    copyDirSync(templatesSrc, options.templatesDirPath);
  }
}

function showError(message) {
  console.error(chalk.red.bold(`Error: ${message}`));
}
