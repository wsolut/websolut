import * as path from 'path';
import * as WebsolutCore from '@wsolut/websolut-core';

const figmaFiles = {
  home: '-replace-with-a-real-figma-file-url-',
};

async function main() {
  const figmaFileName = process.argv[2] || 'home';

  if (!figmaFileName || !figmaFiles[figmaFileName]) {
    console.error(`Please provide a name. Available files: ${Object.keys(figmaFiles).join(', ')}`);
    process.exit(1);
  }

  const figmaToken = process.env.FIGMA_TOKEN;
  if (!figmaToken) {
    console.error('Please provide a valid FIGMA_TOKEN environment variable.');
    process.exit(1);
  }

  const figmaUrl = new URL(figmaFiles[figmaFileName]);
  const figmaFileKey = figmaUrl.pathname.split('/')[2];
  const figmaNodeId = figmaUrl.searchParams.get('node-id');

  const manager = new WebsolutCore.Manager({
    figmaToken,
    dataDirPath: path.resolve('./tmp/data'),
    figmaFileKey,
    figmaNodeId,
  });

  await manager.synchronize();
  await manager.downloadPagesAssets();

  manager.export({
    outDirPath: path.resolve('./public', figmaFileName === 'home' ? '' : figmaFileName),
    templatesDirPath: path.join(path.dirname(new URL(import.meta.url).pathname), 'templates'),
    assetsOutDir: path.resolve('./public/assets'),
  });
}

main().catch(console.error);
