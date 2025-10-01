import * as fs from 'fs';
import * as path from 'path';
import ejs from 'ejs';
import beautify from 'js-beautify';
import {
  DOMX_DOCUMENT_EXTENSION,
  DOWNLOADED_ASSETS_FILE_NAME,
  ASSETS_DIR_NAME,
  DATA_ASSETS_DIR_NAME,
  DOMX_NODES_STATUS_EXTENSION,
  DOMX_NODES_FILE_NAMES,
  VARIANTS_DIR_NAME,
} from './constants';
import {
  createDirSync,
  copyFileSync,
  readFileSync,
  readJsonFileSync,
  safeMergeData,
  sanitizedFileName,
  writeFileSync,
  writeJsonFileSync,
} from './utils';
import { DomxDocument, DomxNodeAsset } from './domx';
import { PageAssetsDownloader, downloadAsset } from './page-assets-downloader';

export type PageOptions = {
  dataDirPath: string;
};

export class Page {
  document: DomxDocument;
  dataDirPath: string;

  constructor(document: DomxDocument, options: PageOptions) {
    this.document = document;
    this.dataDirPath = path.join(
      options.dataDirPath,
      sanitizedFileName(document.metadata.figmaNodeId),
    );
  }

  static buildDocument(data: DomxDocument): DomxDocument {
    return new DomxDocument(data);
  }

  loadData(variant?: string): void {
    DOMX_NODES_FILE_NAMES.forEach((fileName) => {
      this.loadNodesData(path.join(this.dataDirPath, fileName));
    });

    if (variant) {
      DOMX_NODES_FILE_NAMES.forEach((fileName) => {
        this.loadNodesData(
          path.join(this.dataDirPath, VARIANTS_DIR_NAME, variant, fileName),
        );
      });
    }
  }

  save(): void {
    writeJsonFileSync(
      path.join(this.dataDirPath, DOMX_DOCUMENT_EXTENSION),
      this.document,
    );
  }

  deleteData(): void {
    if (fs.existsSync(this.dataDirPath)) {
      fs.rmSync(this.dataDirPath, { recursive: true, force: true });
    }
  }

  async saveNodeImage(imageURL: string): Promise<void> {
    const outDir = this.dataDirPath;
    const asset: DomxNodeAsset = { url: imageURL, fileName: '' };

    await downloadAsset(asset, outDir, new AbortController().signal);
  }

  export(options: {
    outDirPath: string;
    templatesDirPath: string | undefined;
    assetsOutDir?: string;
    assetsPrefixPath?: string;
  }) {
    const outDirPath = options.outDirPath;
    const templatesDirPath = options.templatesDirPath;
    let assetsOutDir = options.assetsOutDir || path.join('./', ASSETS_DIR_NAME);

    if (!path.isAbsolute(assetsOutDir)) {
      assetsOutDir = path.join(outDirPath, assetsOutDir);
    }

    Object.values(this.document.nodes).forEach((domxNode) => {
      Object.values(domxNode.assets || {}).forEach((domxNodeAsset) => {
        this.exportAsset(
          domxNodeAsset,
          outDirPath,
          assetsOutDir,
          options.assetsPrefixPath,
        );
      });
    });

    if (fs.existsSync(templatesDirPath)) {
      this.generateFiles(outDirPath, templatesDirPath);
    } else {
      this.generateDocumentJson(outDirPath);
    }
  }

  get downloadAssetsPending(): boolean {
    return this.downloadAssetsStatus() === 'pending';
  }

  get downloadAssetsDone(): boolean {
    return this.downloadAssetsStatus() !== 'pending';
  }

  async downloadAssets() {
    const downloader = new PageAssetsDownloader(this);

    await downloader.download();
  }

  protected loadNodesData(filePath: string): void {
    const jsonData = readJsonFileSync(filePath);

    if (!jsonData) return;

    safeMergeData(this.document.nodes, jsonData as Record<string, unknown>);
  }

  protected exportAsset(
    domxNodeAsset: DomxNodeAsset,
    outDirPath: string,
    assetsOutDir: string,
    assetsPrefixPath: string | undefined,
  ): void {
    if (!domxNodeAsset.fileName) return;

    const sourcePath = path.posix.join(
      this.dataDirPath,
      DATA_ASSETS_DIR_NAME,
      domxNodeAsset.fileName,
    );

    const destinationPath = path.posix.join(
      assetsOutDir,
      domxNodeAsset.fileName,
    );

    createDirSync(path.dirname(destinationPath));
    copyFileSync(sourcePath, destinationPath);

    let filePath = '';

    if (assetsPrefixPath) {
      filePath = path.posix.join(assetsPrefixPath, domxNodeAsset.fileName);
    } else {
      filePath = path.relative(outDirPath, destinationPath).replace(/\\/g, '/');
    }

    if (!filePath.startsWith('/') && !filePath.startsWith('.')) {
      filePath = `./${filePath}`;
    }

    domxNodeAsset.filePath = filePath;
  }

  protected generateFiles(outDirPath: string, templatesDirPath: string) {
    const data = {
      document: this.document,
      beautifyHtml: beautify.html,
      beautifyCss: beautify.css,
      beautifyJs: beautify.js,
      render: ejs.render,
    };
    const options = { views: [templatesDirPath] };

    const templateFiles = fs
      .readdirSync(templatesDirPath)
      .filter(
        (fileName) => !fileName.startsWith('_') && fileName.endsWith('.ejs'),
      )
      .sort((a, b) => a.localeCompare(b));

    templateFiles.forEach((fileName) => {
      const templateContent = readFileSync(
        path.join(templatesDirPath, fileName),
      );
      const renderedContent = ejs.render(templateContent, data, options);

      const outputFilePath = path.join(
        outDirPath,
        fileName.replace('.ejs', ''),
      );

      createDirSync(path.dirname(outputFilePath));
      writeFileSync(outputFilePath, renderedContent);
    });
  }

  protected generateDocumentJson(outDirPath: string) {
    const outputFilePath = path.join(outDirPath, DOMX_DOCUMENT_EXTENSION);
    const content = JSON.stringify(this.document, null, 2);

    createDirSync(path.dirname(outputFilePath));
    writeFileSync(outputFilePath, content);
  }

  protected downloadAssetsStatus(): string | undefined {
    const status = readJsonFileSync(
      path.join(
        this.dataDirPath,
        `${DOWNLOADED_ASSETS_FILE_NAME}.${DOMX_NODES_STATUS_EXTENSION}`,
      ),
    ) as { status: string } | undefined;

    if (!status) {
      return undefined;
    }

    return status.status;
  }
}
