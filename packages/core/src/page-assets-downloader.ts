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

/**
 * Saves a base64 data-URI asset directly to disk (no network request).
 * Used when assets are embedded by the Figma plugin exporter.
 */
export async function saveDataUriAsset(
  asset: DomxNodeAsset,
  outDir: string,
): Promise<void> {
  const dataUri = asset.url || '';

  // data:[<mediatype>][;base64],<data>
  const match = dataUri.match(/^data:([^;,]+)(?:;[^,]*)?(?:;base64)?,(.+)$/s);
  if (!match) return;

  const mimeType = match[1];
  const base64Data = match[2];

  const ext = mimeType.split('/')[1]?.split('+')[0] || 'bin';
  // Derive a stable filename from a short hash of the data URI
  const hash = simpleHash(base64Data).toString(16).slice(0, 8);
  const fileName = `asset-${hash}.${ext}`;
  const filePath = join(outDir, fileName);

  createDirSync(outDir);

  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);

  try {
    const imageInfo = imageSize(new Uint8Array(buffer));
    asset.width = imageInfo.width;
    asset.height = imageInfo.height;
  } catch {
    asset.width = 0;
    asset.height = 0;
  }

  asset.fileName = fileName;
}

/** FNV-1a 32-bit hash — no dependency needed, just for stable filenames. */
function simpleHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < Math.min(str.length, 2048); i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
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
          if (!asset.url) return;

          const promise = (async () => {
            if (this.abortController.signal.aborted) throw new Error('Aborted');

            // data: URIs come from the Figma plugin export — save them directly
            // to disk without a network round-trip.
            if (asset.url.startsWith('data:')) {
              await saveDataUriAsset(asset, outDir);
            } else if (asset.url.startsWith('http')) {
              await downloadAsset(asset, outDir, this.abortController.signal);
            }
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
