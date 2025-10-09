import * as csstype from 'csstype';

export class DomxNodes {
  [id: string]: Partial<DomxNode>;

  constructor(attrs?: { [id: string]: Partial<DomxNode> }) {
    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        this[key] = attrs[key];
      });
    }
  }
}

export type DomxDocumentMetadata = {
  title: string;
  figmaFile: {
    name: string;
    lastModified: string;
    key: string;
  };
  figmaNodeId: string;
};

export class DomxDocument {
  metadata: DomxDocumentMetadata;
  headId: string;
  bodyId: string;
  nodes: DomxNodes;

  constructor(attrs: {
    metadata: DomxDocumentMetadata;
    headId: string;
    bodyId: string;
    nodes: DomxNodes;
  }) {
    this.metadata = attrs.metadata;
    this.headId = attrs.headId;
    this.bodyId = attrs.bodyId;
    this.nodes = attrs.nodes;
  }
}

export type DomxNodeMetadataFigmaNode = {
  id: string;
  type: string;
  name: string;
  visible?: boolean;
};

export type DomxNodeAsset = {
  fileName?: string;
  filePath?: string;
  format?: string;
  height?: number;
  url?: string;
  width?: number;
};

export type DomxNodeAssets = {
  [id: string]: DomxNodeAsset;
};

export enum DomxNodeType {
  ELEMENT = 'ELEMENT',
  COMPONENT = 'COMPONENT',
}

export type DomxNodeAttributes = {
  [key: string]: any;
};

export type DomxNodeMetadata = {
  figmaNode?: DomxNodeMetadataFigmaNode;
};

export type DomxNodeStyle = csstype.PropertiesHyphen & {
  [P in csstype.SimplePseudos]?: csstype.PropertiesHyphen;
};

export class DomxNode {
  id: string;
  name: string;
  type: DomxNodeType;
  attributes: DomxNodeAttributes;
  text?: string;
  assets?: DomxNodeAssets;
  metadata: DomxNodeMetadata;
  style: DomxNodeStyle;
  childrenIds: string[];

  constructor(attrs: {
    id: string;
    name: string;
    type?: DomxNodeType;
    attributes?: DomxNodeAttributes;
    text?: string;
    assets?: DomxNodeAssets;
    metadata?: DomxNodeMetadata;
    style?: DomxNodeStyle;
    childrenIds: string[];
  }) {
    this.id = attrs.id;
    this.name = attrs.name;
    this.type = attrs.type || DomxNodeType.ELEMENT;
    this.attributes = attrs.attributes || {};
    this.text = attrs.text;
    this.assets = attrs.assets;
    this.metadata = attrs.metadata || {};
    this.style = attrs.style || {};
    this.childrenIds = attrs.childrenIds || [];
  }
}
