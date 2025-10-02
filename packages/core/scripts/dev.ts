import * as path from 'path';
import * as WebsolutCore from '../src';

async function main() {
  let figmaFileURL = process.env.FIGMA_FILE_URL || '-missing-figma-file-url-';
  let debugMode = process.argv[3] === 'debug';

  if (process.argv[2] === 'debug') {
    debugMode = true;
  } else if ((process.argv[2] ?? '') !== '') {
    figmaFileURL = process.argv[2];
  }

  const figmaToken = process.env.FIGMA_TOKEN;
  if (!figmaToken) {
    console.error('Please provide a valid FIGMA_TOKEN environment variable.');
    process.exit(1);
  }

  const figmaUrl = new URL(figmaFileURL);
  const figmaFileKey = figmaUrl.pathname.split('/')[2];
  const figmaNodeId = figmaUrl.searchParams.get('node-id') || '-missing-node-id-';

  const manager = new WebsolutCore.Manager({
    figmaToken,
    dataDirPath: path.resolve('./tmp/data'),
    figmaFileKey,
    figmaNodeId,
  });

  await manager.synchronize({ force: true, debug: debugMode });
  await manager.downloadPagesAssets();
  await manager.getNodeImage();

  manager.export({
    outDirPath: path.resolve('./out'),
    templatesDirPath: path.join(path.dirname(new URL(import.meta.url).pathname), 'templates', debugMode ? 'debug' : 'dev'),
    assetsOutDir: path.resolve('./out/assets'),
  });
}

main().catch((error) => {
  console.error('Websolut failed', error.message || error);

  process.exit(1);
});
