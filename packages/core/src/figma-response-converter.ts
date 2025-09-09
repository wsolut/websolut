import * as FigmaTypes from '@figma/rest-api-spec';
import { FigmaClient } from './utils';
import { FigmaNodeConverter } from './figma-node-converter';
import { DomxDocument, DomxNodes } from './domx';

export type AssetsQueueEntry = {
  id: string;
  nodeConverter: FigmaNodeConverter;
  format?: string;
};

export type NodeConvertersStore = {
  [domxNodeId: string]: FigmaNodeConverter[];
};

export class FigmaResponseConverter {
  protected assetsQueue: AssetsQueueEntry[] = [];
  protected imageRefQueue: AssetsQueueEntry[] = [];
  protected client: FigmaClient;

  constructor(client: FigmaClient) {
    this.client = client;
  }

  async convert(
    figmaResponse: FigmaTypes.GetFileNodesResponse,
  ): Promise<DomxDocument[]> {
    this.assetsQueue = [];
    this.imageRefQueue = [];

    const domxDocuments: DomxDocument[] = Object.keys(figmaResponse.nodes).map(
      (figmaNodeId) => {
        const allFigmaNodeConverters: FigmaNodeConverter[] = [];

        const figmaNodeConverter = this.processFigmaNode(
          figmaResponse.nodes[figmaNodeId].document,
          allFigmaNodeConverters,
        );

        return this.buildDomxDocument(
          figmaResponse,
          figmaNodeId,
          figmaNodeConverter.id,
          allFigmaNodeConverters,
        );
      },
    );

    await this.fetchAndUpdateAssetUrls(this.client);

    return domxDocuments;
  }

  protected buildDomxDocument(
    figmaResponse: FigmaTypes.GetFileNodesResponse,
    figmaNodeId: string,
    bodyId: string,
    allFigmaNodeConverters: FigmaNodeConverter[],
  ) {
    const nodes = new DomxNodes();

    allFigmaNodeConverters.forEach((figmaNodeConverter) => {
      const domxNode = figmaNodeConverter.domxNode;

      nodes[domxNode.id] = domxNode;
    });

    const title = nodes[bodyId]?.metadata.figmaNode.name || figmaResponse.name;

    return new DomxDocument({
      metadata: {
        title,
        figmaFile: {
          name: figmaResponse.name,
          lastModified: figmaResponse.lastModified,
          key: this.client.figmaFileKey,
        },
        figmaNodeId,
      },
      headId: '-null-',
      bodyId,
      nodes,
    });
  }

  protected buildFigmaNodeConverter(
    figmaNode: FigmaTypes.Node,
    parentConverter?: FigmaNodeConverter,
  ): FigmaNodeConverter {
    return FigmaNodeConverter.create(figmaNode, parentConverter);
  }

  protected processFigmaNode(
    figmaNode: FigmaTypes.Node,
    nodeConverters: FigmaNodeConverter[],
    parentConverter?: FigmaNodeConverter,
  ): FigmaNodeConverter {
    const nodeConverter = this.buildFigmaNodeConverter(
      figmaNode,
      parentConverter,
    );
    const assets = nodeConverter.domxNode.assets || {};

    nodeConverters.push(nodeConverter);

    Object.entries(assets).forEach(([assetId, asset]) => {
      if (asset.format === 'imageRef') {
        this.imageRefQueue.push({ id: assetId, nodeConverter });
      } else {
        this.assetsQueue.push({
          id: assetId,
          nodeConverter,
          format: asset.format,
        });
      }
    });

    const figmaNodeChildren =
      (figmaNode as FigmaTypes.FrameNode).children || [];

    figmaNodeChildren.forEach((figmaNodeChild) => {
      this.processFigmaNode(figmaNodeChild, nodeConverters, nodeConverter);
    });

    return nodeConverter;
  }

  protected async fetchAndUpdateAssetUrls(client: FigmaClient) {
    const imagesData = await client.fileImageFills();

    this.updateAssets(imagesData.meta.images || {}, this.imageRefQueue);

    const ids = this.assetsQueue.map((entry) => entry.id);
    const uniqueIds = Array.from(new Set(ids));

    if (uniqueIds.length > 0) {
      // Batching the requests to avoid breaching the URL max length
      const batches = this.batchIds(uniqueIds);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        const assetsData = await client.fileImages({
          ids: batch,
          format: 'svg',
        });

        this.updateAssets(assetsData.images || {}, this.assetsQueue);
      }
    }
  }

  protected batchIds(ids: string[]): string[][] {
    if (ids.length === 0) return [];

    // Estimate average ID length and calculate safe batch size
    const avgIdLength =
      ids.reduce((sum, id) => sum + id.length, 0) / ids.length;
    // Add some buffer for commas and other URL parameters (~500 chars)
    const maxUrlLength = 1500;
    const maxBatchSize = Math.floor(maxUrlLength / (avgIdLength + 1)); // +1 for comma

    // Ensure we have at least 1 ID per batch, but cap at reasonable limit
    const batchSize = Math.max(1, Math.min(maxBatchSize, 50));

    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      batches.push(ids.slice(i, i + batchSize));
    }

    return batches;
  }

  protected updateAssets(
    images: { [key: string]: string | null },
    queue: AssetsQueueEntry[],
  ) {
    Object.keys(images).forEach((id) => {
      const url = images[id];

      if (!url) return;

      queue
        .filter((entry) => entry.id === id)
        .forEach((entry) => {
          const assets = entry.nodeConverter.domxNode.assets;

          if (assets && assets[id]) {
            assets[id].url = url;
          }
        });
    });
  }
}
