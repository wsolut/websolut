import { existsSync } from 'fs';
import { isAbsolute, join } from 'path';
import * as FigmaTypes from '@figma/rest-api-spec';
import {
  exportFormatOptions,
  FigmaClient,
  readJsonFileSync,
  sanitizedFileName,
  writeJsonFileSync,
} from './utils';
import { DOMX_DOCUMENT_EXTENSION, FIGMA_RESPONSE_FILE_NAME } from './constants';
import { FigmaResponseConverter } from './figma-response-converter';
import { Page } from './page';
import * as path from 'path';
import { DomxDocument } from './domx';
import * as fs from 'fs';
import {
  FigmaClientNoResponseError,
  NoPageError,
  NoTemplateFoundError,
} from './errors';

export type ManagerOptions = {
  dataDirPath: string;
  figmaFileKey: string;
  figmaNodeId: string;
  figmaToken: string;
  figmaResponseConverterClass?: typeof FigmaResponseConverter;
  pageClass?: typeof Page;
};

export class Manager {
  dataDirPath: string;
  client: FigmaClient;
  figmaResponse?: FigmaTypes.GetFileNodesResponse;
  figmaFileKey: string;
  figmaNodeId: string;
  page?: Page;

  private figmaResponseConverter: FigmaResponseConverter;
  pageClass: typeof Page;

  constructor(options: ManagerOptions) {
    this.figmaFileKey = options.figmaFileKey;
    this.figmaNodeId = options.figmaNodeId;

    this.client = new FigmaClient(this.figmaFileKey, {
      figmaToken: options.figmaToken,
    });

    this.dataDirPath = isAbsolute(options.dataDirPath)
      ? options.dataDirPath
      : join(process.cwd(), options.dataDirPath);
    this.dataDirPath = join(this.dataDirPath, this.figmaFileKey);

    this.figmaResponseConverter = new (options.figmaResponseConverterClass ||
      FigmaResponseConverter)(this.client);

    this.pageClass = options.pageClass || Page;
  }

  async synchronize(options?: {
    force?: boolean;
    variant?: string;
    debug?: boolean;
  }): Promise<void> {
    this.loadData(options?.variant);

    const freshFigmaResponse = await this.fetchData(options?.force === true);

    if (!freshFigmaResponse) return;

    this.figmaResponse = freshFigmaResponse;

    // Converts "this.figmaResponse" into Page instances
    const domxDocuments = await this.figmaResponseConverter.convert(
      this.figmaResponse,
      { debug: options?.debug },
    );

    this.page = new this.pageClass(domxDocuments[0], {
      dataDirPath: this.dataDirPath,
    });

    // Save "this.figmaResponse" onto `${this.dataDirPath}/figma-response.json`
    writeJsonFileSync(
      join(
        this.dataDirPath,
        sanitizedFileName(this.figmaNodeId),
        FIGMA_RESPONSE_FILE_NAME,
      ),
      this.figmaResponse,
    );

    // Saves "this.page" onto `${this.dataDirPath}` as `document.json` files
    this.page.save();

    this.page.loadData(options?.variant);
  }

  loadData(variant?: string): void {
    // Populates "this.figmaResponse" with data from `${this.dataDirPath}/figma-file.json`
    const pageDataDir = join(
      this.dataDirPath,
      sanitizedFileName(this.figmaNodeId),
    );
    const figmaFilePath = join(pageDataDir, FIGMA_RESPONSE_FILE_NAME);

    const jsonData = readJsonFileSync(figmaFilePath);
    if (jsonData) {
      this.figmaResponse = jsonData as FigmaTypes.GetFileNodesResponse;
    }

    // Populates "this.page" with data from `${this.dataDirPath}/**/document.json` files
    if (existsSync(this.dataDirPath)) {
      const jsonData = readJsonFileSync(
        path.join(pageDataDir, DOMX_DOCUMENT_EXTENSION),
      );

      if (jsonData) {
        const document = this.pageClass.buildDocument(jsonData as DomxDocument);

        this.page = new this.pageClass(document, {
          dataDirPath: this.dataDirPath,
        });
      }
    }

    this.page?.loadData(variant);
  }

  // Saves "this.pages" onto `${this.outDirPath}` as `document.json` files and all its assets
  export(options: {
    outDirPath: string;
    templatesDirPath: string;
    assetsOutDir?: string;
    assetsPrefixPath?: string;
  }) {
    if (!this.page) {
      throw new NoPageError(
        `No Page to export. Please run #synchronize or #loadData to build one.`,
      );
    }

    if (
      !fs.existsSync(options.templatesDirPath) ||
      !fs.statSync(options.templatesDirPath).isDirectory()
    ) {
      throw new NoTemplateFoundError(
        `templatesDirPath "${options.templatesDirPath}" is not a directory`,
      );
    }

    const ejsFiles = fs
      .readdirSync(options.templatesDirPath)
      .filter((file) => file.endsWith('.ejs'));

    if (ejsFiles.length === 0) {
      throw new NoTemplateFoundError(
        `No .ejs files found in templatesDirPath "${options.templatesDirPath}"`,
      );
    }

    this.page?.export(options);
  }

  deleteData(): void {
    this.page?.deleteData();

    this.page = undefined;

    if (fs.existsSync(this.dataDirPath)) {
      const files = fs.readdirSync(this.dataDirPath);

      if (files.length === 0) {
        fs.rmdirSync(this.dataDirPath);
      }
    }
  }

  async downloadPagesAssets(): Promise<void> {
    await this.page?.downloadAssets();
  }

  async waitForDownloadAssets(timeOut: number): Promise<boolean> {
    const poolTimeout = 250;

    if (!this.page) return false;

    return new Promise((resolve) => {
      const poolInterval = setInterval(() => {
        if (this.page.downloadAssetsDone) {
          clearInterval(poolInterval);

          resolve(true);
        }
      }, poolTimeout);

      setTimeout(() => {
        clearInterval(poolInterval);

        resolve(false);
      }, timeOut);
    });
  }

  protected async fetchData(
    force: boolean,
  ): Promise<FigmaTypes.GetFileNodesResponse> {
    // Gets the latest Figma Nodes from Figma API
    const freshFigmaResponse = await this.client.fileNodes({
      ids: [this.figmaNodeId],
      geometry: 'paths',
    });

    const nodeId = this.figmaNodeId.replace('-', ':');
    if (!freshFigmaResponse.nodes[nodeId]) {
      throw new FigmaClientNoResponseError();
    }

    const lastFigmaFileLastModifiedTime = !this.figmaResponse
      ? 0
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        new Date((this.figmaResponse as any).lastModified).getTime();

    // Doesn't do anything if the fetched Figma file is the same as the last one
    // unless the "force" option is set to true
    if (
      force ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      new Date((freshFigmaResponse as any).lastModified).getTime() >
        lastFigmaFileLastModifiedTime
    ) {
      return freshFigmaResponse;
    }

    return undefined;
  }

  async getNodeImage(
    nodeId?: string,
    exportFormat?: exportFormatOptions,
    imageScale?: number,
  ): Promise<void> {
    const targetNodeId = nodeId ?? this.figmaNodeId;
    const format = exportFormat ?? 'jpg';
    const scale = imageScale ?? 1;

    const imagesResponse = await this.client.fileImages({
      ids: [targetNodeId],
      format,
      scale,
    });

    const nodeKey = Object.keys(imagesResponse.images)[0];
    const imageUrl = imagesResponse.images?.[nodeKey];

    if (!imageUrl) {
      throw new Error(`No image URL returned for node ${targetNodeId}`);
    }

    await this.page.saveNodeImage(imageUrl);
  }
}
