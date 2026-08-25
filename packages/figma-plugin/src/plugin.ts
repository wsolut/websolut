/**
 * Websolut Exporter — Figma Plugin (main thread)
 *
 * Serializes the currently-selected top-level frame into a JSON file that is
 * structurally identical to the response that Figma's REST endpoint
 * `GET /v1/files/{key}/nodes` would have returned.  The resulting JSON can be
 * dropped directly into the Websolut desktop app and processed by
 * `FigmaResponseConverter.convert()` without any changes to the core pipeline.
 *
 * Image fills and vector nodes are exported as base64 data-URIs so the
 * desktop app never needs to make a second round-trip to Figma CDN.
 */

figma.showUI(__html__, { width: 360, height: 480, themeColors: true });

// ─── message routing ──────────────────────────────────────────────────────────

figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === 'export') {
    await handleExport();
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

// Also refresh the selection status whenever it changes
figma.on('selectionchange', () => {
  sendSelectionStatus();
});

sendSelectionStatus();

// ─── selection helpers ────────────────────────────────────────────────────────

function sendSelectionStatus() {
  const frame = getSelectedFrame();
  figma.ui.postMessage({
    type: 'selectionStatus',
    frameName: frame ? frame.name : null,
  });
}

function getSelectedFrame(): FrameNode | ComponentNode | null {
  const sel = figma.currentPage.selection;
  if (sel.length !== 1) return null;
  const node = sel[0];
  if (node.type === 'FRAME' || node.type === 'COMPONENT') return node as FrameNode | ComponentNode;
  return null;
}

// ─── main export handler ──────────────────────────────────────────────────────

async function handleExport() {
  const frame = getSelectedFrame();

  if (!frame) {
    figma.ui.postMessage({ type: 'error', message: 'Please select a single Frame or Component.' });
    return;
  }

  figma.ui.postMessage({ type: 'progress', message: 'Serializing nodes…' });

  try {
    const serializedNode = await serializeNode(frame);

    // Collect all image refs inside this frame so we can export them
    figma.ui.postMessage({ type: 'progress', message: 'Exporting image fills…' });
    await exportImageFills(serializedNode);

    figma.ui.postMessage({ type: 'progress', message: 'Exporting vector nodes…' });
    await exportVectorAssets(frame, serializedNode);

    // Build the GetFileNodesResponse-compatible wrapper
    const nodeId = frame.id; // e.g. "123:456"

    const response: WsolutFileNodesResponse = {
      name: figma.root.name,
      lastModified: new Date().toISOString(),
      thumbnailUrl: '',
      version: '0',
      role: 'viewer',
      nodes: {
        [nodeId]: {
          document: serializedNode,
          components: {},
          componentSets: {},
          schemaVersion: 0,
          styles: {},
        },
      },
      // Non-standard field so the backend knows this came from the plugin
      _source: 'figma-plugin',
    };

    const json = JSON.stringify(response, null, 2);
    const fileName = `websolut-${sanitizeFileName(frame.name)}.json`;

    figma.ui.postMessage({ type: 'done', json, fileName });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    figma.ui.postMessage({ type: 'error', message: `Export failed: ${message}` });
  }
}

// ─── node serializer ──────────────────────────────────────────────────────────

async function serializeNode(node: SceneNode): Promise<SerializedNode> {
  // Start with a shallow copy of all enumerable own properties.
  // The Figma Plugin API returns proxy objects; JSON.parse(JSON.stringify()) gives
  // us a plain object we can freely mutate.
  const plain: SerializedNode = JSON.parse(
    JSON.stringify(node, (_key, value) => {
      // Drop circular refs and very large data we handle separately
      if (value && typeof value === 'object' && value.type === 'IMAGE') return value;
      return value;
    }),
  );

  // Recurse into children
  if ('children' in node) {
    const children: SerializedNode[] = [];
    for (const child of (node as ChildrenMixin).children) {
      children.push(await serializeNode(child));
    }
    plain.children = children;
  }

  return plain;
}

// ─── image fill exporter ──────────────────────────────────────────────────────
// Walks the serialized tree, finds every `imageRef` in a paint's imageRef field,
// and attaches it to a top-level `_imageFills` map as base64 data-URIs.
// The desktop app's asset downloader already handles data: URIs after our
// small tweak to PageAssetsDownloader.

async function exportImageFills(root: SerializedNode): Promise<void> {
  const refs = collectImageRefs(root);

  if (refs.size === 0) return;

  // Build a reverse-lookup: imageRef → figma Image object
  for (const ref of refs) {
    try {
      const image = figma.getImageByHash(ref);
      if (!image) continue;

      const bytes = await image.getBytesAsync();
      const base64 = uint8ArrayToBase64(bytes);
      const mimeType = guessMimeType(bytes);
      const dataUri = `data:${mimeType};base64,${base64}`;

      // Store on the root node's _imageFills map so the backend can pick it up
      if (!root._imageFills) root._imageFills = {};
      root._imageFills[ref] = dataUri;
    } catch {
      // Non-fatal: the ref might not be available (e.g. external library)
    }
  }
}

function collectImageRefs(node: SerializedNode, refs: Set<string> = new Set()): Set<string> {
  const fills = (node as { fills?: { type: string; imageRef?: string }[] }).fills || [];
  for (const fill of fills) {
    if (fill.type === 'IMAGE' && fill.imageRef) {
      refs.add(fill.imageRef);
    }
  }

  for (const child of node.children || []) {
    collectImageRefs(child, refs);
  }

  return refs;
}

// ─── vector / SVG exporter ────────────────────────────────────────────────────
// For VECTOR, STAR, POLYGON, ELLIPSE (when treated as vector) nodes we export
// an SVG and attach it alongside the node id in a top-level `_svgAssets` map.

const VECTOR_TYPES = new Set(['VECTOR', 'STAR', 'POLYGON', 'LINE', 'BOOLEAN_OPERATION']);

async function exportVectorAssets(
  root: FrameNode | ComponentNode,
  serializedRoot: SerializedNode,
): Promise<void> {
  const vectorNodes = collectVectorNodes(root);

  for (const vNode of vectorNodes) {
    try {
      const svgBytes = await vNode.exportAsync({ format: 'SVG' });
      const svgString = new TextDecoder().decode(svgBytes);
      const base64 = btoa(unescape(encodeURIComponent(svgString)));
      const dataUri = `data:image/svg+xml;base64,${base64}`;

      if (!serializedRoot._svgAssets) serializedRoot._svgAssets = {};
      serializedRoot._svgAssets[vNode.id] = dataUri;
    } catch {
      // Non-fatal
    }
  }
}

function collectVectorNodes(
  node: SceneNode,
  result: SceneNode[] = [],
): SceneNode[] {
  if (VECTOR_TYPES.has(node.type)) {
    result.push(node);
  }

  if ('children' in node) {
    for (const child of (node as ChildrenMixin).children) {
      collectVectorNodes(child, result);
    }
  }

  return result;
}

// ─── utilities ────────────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function guessMimeType(bytes: Uint8Array): string {
  // Magic bytes detection
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif';
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return 'image/webp';
  return 'image/png';
}

// ─── types ────────────────────────────────────────────────────────────────────

interface SerializedNode {
  id: string;
  name: string;
  type: string;
  children?: SerializedNode[];
  _imageFills?: Record<string, string>;
  _svgAssets?: Record<string, string>;
  [key: string]: unknown;
}

interface WsolutFileNodesResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  role: string;
  nodes: {
    [nodeId: string]: {
      document: SerializedNode;
      components: object;
      componentSets: object;
      schemaVersion: number;
      styles: object;
    };
  };
  _source: string;
}

type PluginMessage =
  | { type: 'export' }
  | { type: 'cancel' };
