import * as FigmaTypes from '@figma/rest-api-spec';
import { FigmaClient } from './utils';
import { FigmaNodeConverter } from './figma-node-converter';
import { DomxDocument, DomxNode, DomxNodes } from './domx';

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
    options?: { debug?: boolean },
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
          options,
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
    options?: { debug?: boolean },
  ) {
    const nodes = new DomxNodes();
    const headNode = this.buildDomxDocumentHead();
    const fontFamilies = new Set<string>();

    nodes[headNode.id] = headNode;

    allFigmaNodeConverters.forEach((figmaNodeConverter) => {
      const domxNode = figmaNodeConverter.domxNode;
      const nodeStyle = figmaNodeConverter.nodeStyle;

      if (domxNode) {
        nodes[domxNode.id] = { ...domxNode };

        if (options?.debug) {
          const figmaNode = { ...figmaNodeConverter.node, children: [] };

          nodes[domxNode.id].metadata.figmaNode = figmaNode;
        }

        // Collect font families
        if (
          (nodeStyle.fontFamily ?? '') !== '' &&
          !fontFamilies.has(nodeStyle.fontFamily)
        ) {
          fontFamilies.add(nodeStyle.fontFamily);

          const headChildNode = this.buildDomxNodeWithGoogleFont(
            nodeStyle,
            `font-link-${fontFamilies.size + Date.now()}`,
          );

          nodes[headChildNode.id] = headChildNode;
          headNode.childrenIds.push(headChildNode.id);
        }
      }
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
      headId: headNode.id,
      bodyId,
      nodes,
    });
  }

  protected buildDomxDocumentHead() {
    return new DomxNode({
      id: `head-${+Date.now()}`,
      name: 'HEAD',
      childrenIds: [],
    });
  }

  protected buildDomxNodeWithGoogleFont(
    nodeStyle: FigmaTypes.TypeStyle,
    id: string,
  ) {
    const escapedFontFamily = encodeURIComponent(nodeStyle.fontFamily);

    let href = `https://fonts.googleapis.com/css2?family=${escapedFontFamily}:wght@${nodeStyle.fontWeight}&display=swap`;
    // let href = `https://fonts.googleapis.com/css2?family=${escapedFontFamily}:ital,wght@0,100..900;1,100..900&display=swap`;

    if (nodeStyle.fontFamily === 'Baloo 2') {
      href = `https://fonts.googleapis.com/css2?family=${escapedFontFamily}:wght@400..800&display=swap`;
    }

    return new DomxNode({
      id,
      name: 'LINK',
      attributes: { rel: 'stylesheet', href },
      childrenIds: [],
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
    nodeConverters.push(nodeConverter);

    const assets = nodeConverter.domxNode?.assets || {};

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
