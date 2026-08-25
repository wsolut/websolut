# Websolut Exporter — Figma Plugin

The **Websolut Exporter** is a Figma plugin that lets you export any Frame or
Component directly as a JSON file and drop it into the Websolut desktop app —
without needing a Figma personal access token or hitting any REST API limits.

---

## Why this exists

Figma's REST API introduced stricter rate limits that made the original
token-based workflow unreliable for large files. The Figma Plugin API has no
such limits when run inside Figma itself, so the plugin exports the same data
that the REST API used to return, including all image fills and SVG vector
assets embedded as base64 data-URIs.

---

## How it works

```
┌──────────────────────────────┐
│  Figma Desktop / Web          │
│                               │
│  1. Select a Frame            │
│  2. Run Websolut Exporter     │
│  3. Click "Export JSON"       │
│                               │
│  → Downloads websolut-*.json  │
└──────────────┬───────────────┘
               │  .json file
               ▼
┌──────────────────────────────┐
│  Websolut Desktop App         │
│                               │
│  Open a page → click Import   │
│  Drop the .json file          │
│                               │
│  → Same DOMX → HTML/CSS       │
│    pipeline as before         │
└──────────────────────────────┘
```

The exported JSON is structurally identical to the `GET /v1/files/{key}/nodes`
REST response, so **zero changes are needed** in `websolut-core`.  
Image fills and SVG vectors are embedded as `data:` URIs so no secondary CDN
download step is required.

---

## Installing the plugin (development)

> The plugin is not yet published to the Figma Community. Use the steps below
> to load it from source.

### 1. Build

```bash
cd packages/figma-plugin
npm install
npm run build
```

This produces `dist/plugin.js` and `dist/ui.html`.

### 2. Load in Figma

1. Open Figma Desktop.
2. Go to **Plugins → Development → Import plugin from manifest…**
3. Select `packages/figma-plugin/manifest.json`.

### 3. Run

1. In any Figma file, select a top-level **Frame** or **Component**.
2. Open the plugin via **Plugins → Development → Websolut Exporter**.
3. Click **Export JSON** — the file downloads automatically.

---

## Using the exported file in Websolut

1. Open the Websolut desktop app and navigate to a project's page list.
2. On any page row, click the **Import** button (📄 icon).
3. Drag and drop (or browse for) the `.json` file you just downloaded from
   Figma.
4. Click **Import** — the same synchronization pipeline runs as if you had
   clicked "Sync" with a live Figma token.

---

## What is exported

| Data | How |
|---|---|
| Full node tree (layout, fills, effects, text, constraints…) | `JSON.parse(JSON.stringify(node))` via Plugin API |
| Image fills (`imageRef` paints) | `figma.getImageByHash(ref).getBytesAsync()` → base64 |
| Vector / SVG nodes (`VECTOR`, `STAR`, `POLYGON`, `LINE`, `BOOLEAN_OPERATION`) | `node.exportAsync({ format: 'SVG' })` → base64 |

---

## Compatibility

The output JSON is compatible with `@wsolut/websolut-core` `v0.9.3-alpha` and
later. The file contains a `_source: "figma-plugin"` field at the root so the
backend can distinguish plugin exports from REST API responses.

---

## Contributing

See the main [CONTRIBUTING](../README.md#contributing) section. Plugin-specific
changes live in `packages/figma-plugin/`.
