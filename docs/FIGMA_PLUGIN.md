# Websolut Exporter — Figma Plugin & JSON Import

The **Websolut Exporter** is a Figma plugin that lets you export any Frame or
Component directly as a JSON file and drop it into the Websolut desktop app —
without needing a Figma personal access token or hitting any REST API limits.

You can also drop in any JSON file that was previously downloaded from the
Figma REST API (e.g. via `GET /v1/files/{key}/nodes`) — the import path
accepts any compatible Figma file JSON, regardless of how it was obtained.

---

## Why this exists

Figma's REST API introduced stricter rate limits that made the original
token-based workflow unreliable for large files. The Figma Plugin API has no
such limits when run inside Figma itself, so the plugin exports the same data
that the REST API used to return, including all image fills and SVG vector
assets embedded as base64 data-URIs.

Additionally, if you already have a full Figma file JSON saved from a previous
REST API call, you can re-use it at any time without touching the API again.

---

## How it works

```
Option A — Figma Plugin (recommended, no token needed)
┌──────────────────────────────┐
│  Figma Desktop               │
│  1. Select a Frame           │
│  2. Run Websolut Exporter    │
│  3. Click "Export JSON"      │
│  → Downloads websolut-*.json │
└──────────────┬───────────────┘
               │
               ▼
Option B — Figma REST API (if token still works)
┌──────────────────────────────────────────────────────────────┐
│  curl "https://api.figma.com/v1/files/{KEY}/nodes?ids={ID}"  │
│       -H "X-Figma-Token: YOUR_TOKEN" -o export.json         │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
Option C — Full file JSON (any source)
┌──────────────────────────────────────────────────────────────┐
│  Any JSON previously saved from the Figma REST API works.    │
│  GET /v1/files/{key}  or  GET /v1/files/{key}/nodes          │
└──────────────┬───────────────────────────────────────────────┘
               │  .json file (any of the above)
               ▼
┌──────────────────────────────┐
│  Websolut Desktop App        │
│  Open a page → click Import  │
│  Drop the .json file         │
│  → DOMX → HTML/CSS pipeline  │
└──────────────────────────────┘
```

The imported JSON is structurally identical to the `GET /v1/files/{key}/nodes`
REST response, so **zero changes are needed** in `websolut-core`.
When using the plugin, image fills and SVG vectors are embedded as `data:` URIs
so no secondary CDN download step is needed.

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

## Using the REST API directly (alternative)

If you have a Figma personal access token, you can download the JSON without
the plugin using `curl` or any HTTP client:

```bash
# Replace FILE_KEY and NODE_ID with values from your Figma URL
# Figma URL: figma.com/design/FILE_KEY/...?node-id=NODE_ID
curl "https://api.figma.com/v1/files/FILE_KEY/nodes?ids=NODE_ID&geometry=paths" \
  -H "X-Figma-Token: YOUR_TOKEN" \
  -o websolut-export.json
```

> **Note:** Use `api.figma.com` (the REST API), not `www.figma.com` (the web app).
> The node ID in the URL uses `-` (e.g. `5-12`) but the API requires `:` (e.g. `5:12`).

---

## Importing the JSON file in Websolut

1. Open the Websolut desktop app and navigate to a project's page list.
2. Create a page if you haven't already (a placeholder Figma URL is fine).
3. On the page row, click the **Import** button.
4. Drag and drop (or browse for) your `.json` file.
5. Click **Import** — the full conversion pipeline runs automatically:
   DOMX is generated, assets are saved, and a preview HTML is exported.
6. Click **Preview** to open the result in your browser.

---

## What is exported (plugin)

| Data | How |
|---|---|
| Full node tree (layout, fills, effects, text, constraints…) | `JSON.parse(JSON.stringify(node))` via Plugin API |
| Image fills (`imageRef` paints) | `figma.getImageByHash(ref).getBytesAsync()` → base64 |
| Vector / SVG nodes (`VECTOR`, `STAR`, `POLYGON`, `LINE`, `BOOLEAN_OPERATION`) | `node.exportAsync({ format: 'SVG' })` → base64 |

When using the REST API path, image fill CDN URLs are preserved as-is and
downloaded by the asset downloader step.

---

## Compatibility

The output JSON is compatible with `@wsolut/websolut-core` `v0.9.3-alpha` and
later. Plugin-exported files contain a `_source: "figma-plugin"` field at the
root so the backend can distinguish them from REST API responses if needed.

---

## Contributing

See the main [CONTRIBUTING](../README.md#contributing) section. Plugin-specific
changes live in `packages/figma-plugin/`.
