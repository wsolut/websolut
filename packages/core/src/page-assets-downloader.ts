import * as mime from 'mime-types';
import * as fs from 'fs';
import { imageSize } from 'image-size';
import { createDirSync, readJsonFileSync, writeJsonFileSync } from './utils';
import { URL } from 'url';
import { basename, join } from 'path';
import { Page } from './page';
import {
  DATA_ASSETS_DIR_NAME,
  DOMX_NODES_EXTENSION,
  DOMX_NODES_STATUS_EXTENSION,
  DOWNLOADED_ASSETS_FILE_NAME,
} from './constants';
import { DomxNodeAsset, DomxNodes } from './domx';

interface ImageMeta {
  url: string;
  fileName: string;
  etag: string | null;
  lastModified: string | null;
  width: number;
  height: number;
}

// Helper to download and save image
export async function downloadAsset(
  asset: DomxNodeAsset,
  outDir: string,
  signal: AbortSignal,
): Promise<void> {
  const url = asset.url || '';
  const urlFileName = basename(new URL(url).pathname);
  const metaFilePath = join(outDir, `${urlFileName}.json`);

  createDirSync(outDir);

  const headers: Record<string, string> = {};

  const meta = readJsonFileSync(metaFilePath) as ImageMeta | undefined;

  if (meta?.etag) headers['If-None-Match'] = meta.etag;
  if (meta?.lastModified) headers['If-Modified-Since'] = meta.lastModified;

  try {
    const response = await fetch(url, { headers, signal });
    const contentType = response.headers.get('content-type');

    if (!response.ok && response.status !== 304) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.status === 304) {
      const fileName = meta?.fileName || urlFileName;
      // console.log(`Cached image valid, skipped download: ${fileName}`);

      asset.width = meta?.width || 0;
      asset.height = meta?.height || 0;
      asset.fileName = fileName;

      return;
    }

    let fileName = urlFileName;

    if (!fileName.includes('.') && contentType) {
      const ext = mime.extension(contentType);
      if (ext) fileName = `${urlFileName}.${ext}`;
    }

    const filePath = join(outDir, fileName);

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

    const imageInfo = imageSize(new Uint8Array(arrayBuffer));

    const newMeta: ImageMeta = {
      url,
      fileName,
      etag: response.headers.get('etag') || null,
      lastModified: response.headers.get('last-modified') || null,
      width: imageInfo.width,
      height: imageInfo.height,
    };

    writeJsonFileSync(metaFilePath, newMeta);

    // console.log(`Downloaded image: ${fileName}`);

    asset.width = imageInfo.width;
    asset.height = imageInfo.height;
    asset.fileName = fileName;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Aborted');
    }

    throw err;
  }
}

export class PageAssetsDownloader {
  abortController: AbortController;
  page: Page;

  constructor(page: Page) {
    this.page = page;
    this.abortController = new AbortController();
  }

  async download(): Promise<void> {
    const downloadedAssets = this.buildDownloadedAssets(
      this.page.document.nodes,
    );
    const outDir = join(this.page.dataDirPath, DATA_ASSETS_DIR_NAME);

    writeJsonFileSync(
      join(
        this.page.dataDirPath,
        `${DOWNLOADED_ASSETS_FILE_NAME}.${DOMX_NODES_STATUS_EXTENSION}`,
      ),
      { status: 'pending' },
    );

    try {
      const assetPromises: Promise<void>[] = [];

      Object.values(downloadedAssets).forEach((node) => {
        Object.values(node.assets || {}).forEach((asset) => {
          if (!asset.url || !asset.url.startsWith('http')) return;

          const promise = (async () => {
            if (this.abortController.signal.aborted) throw new Error('Aborted');

            await downloadAsset(asset, outDir, this.abortController.signal);
          })();

          assetPromises.push(promise);
        });
      });

      await Promise.all(assetPromises);

      if (this.abortController.signal.aborted) throw new Error('Aborted');
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Aborted' || error.name === 'AbortError')
      ) {
        console.log(`Processing aborted`, error);
      } else {
        console.error(`Unknown error`, error);
      }
    }

    writeJsonFileSync(
      join(
        this.page.dataDirPath,
        `${DOWNLOADED_ASSETS_FILE_NAME}.${DOMX_NODES_STATUS_EXTENSION}`,
      ),
      { status: 'completed' },
    );

    writeJsonFileSync(
      join(
        this.page.dataDirPath,
        `${DOWNLOADED_ASSETS_FILE_NAME}.${DOMX_NODES_EXTENSION}`,
      ),
      downloadedAssets,
    );
  }

  protected buildDownloadedAssets(domxNodes: DomxNodes): DomxNodes {
    const assetsOnlyDomxNodes = new DomxNodes();

    for (const [id, node] of Object.entries(domxNodes)) {
      if (node.assets) {
        assetsOnlyDomxNodes[id] = { assets: node.assets };
      }
    }

    return assetsOnlyDomxNodes;
  }
}
