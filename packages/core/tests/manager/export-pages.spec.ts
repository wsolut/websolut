import * as fs from 'fs';
import { join, resolve } from 'path';
import { expect, it, describe, beforeAll } from 'vitest';

import * as WebsolutCore from '../../src/index';
import { copyDataExample } from '../support/utils';
import {
  ASSETS_DIR_NAME,
  NoPageError,
  NoTemplateFoundError,
  VARIANTS_DIR_NAME,
} from '../../src/index';
import { createDirSync, sanitizedFileName } from '../../src/utils';

const tmpTestsDir = resolve('./tmp/tests/manager-export-pages');

describe('Manager#export', () => {
  beforeAll(() => {
    fs.rmSync(tmpTestsDir, { recursive: true, force: true });
    createDirSync(tmpTestsDir);
  });

  describe('when data exists and is loaded and templatesDirPath does not lead to a real directory', () => {
    it('should throw a NoTemplateFoundError', () => {
      const figmaFileKey = 'figma-file-without-templates';
      const figmaNodeId = '0:1';
      const manager = new WebsolutCore.Manager({
        figmaToken: '777',
        figmaNodeId,
        figmaFileKey,
        dataDirPath: join(tmpTestsDir, 'data'),
      });

      copyDataExample('figma-file-fresh', manager.dataDirPath);
      copyDataExample('downloaded-assets-data', manager.dataDirPath);

      manager.loadData();

      try {
        manager.export({
          outDirPath: join(tmpTestsDir, 'out', figmaFileKey),
          templatesDirPath: 'fake directory',
        });

        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(NoTemplateFoundError);
      }
    });
  });

  describe('when data exists and is loaded and templatesDirPath does not contain ejs files', () => {
    it('should throw a NoTemplateFoundError', () => {
      const figmaFileKey = 'figma-file-without-templates';
      const figmaNodeId = '0:1';
      const manager = new WebsolutCore.Manager({
        figmaToken: '777',
        figmaNodeId,
        figmaFileKey,
        dataDirPath: join(tmpTestsDir, 'data'),
      });

      copyDataExample('figma-file-fresh', manager.dataDirPath);
      copyDataExample('downloaded-assets-data', manager.dataDirPath);

      manager.loadData();

      try {
        manager.export({
          outDirPath: join(tmpTestsDir, 'out', figmaFileKey),
          templatesDirPath: tmpTestsDir,
        });

        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(NoTemplateFoundError);
      }
    });
  });

  describe('when page is undefined', () => {
    it('should throw a NoPageError', () => {
      const figmaFileKey = 'figma-file-with-templates';
      const figmaNodeId = '0:1';
      const manager = new WebsolutCore.Manager({
        figmaToken: '777',
        figmaNodeId,
        figmaFileKey,
        dataDirPath: join(tmpTestsDir, 'data'),
      });

      try {
        manager.export({
          outDirPath: join(tmpTestsDir, 'out', figmaFileKey),
          templatesDirPath: tmpTestsDir,
        });

        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(NoPageError);
      }
    });
  });

  describe('when data exists and is loaded and templatesDirPath is defined', () => {
    it('should export pages as HTML and CSS to a given directory', () => {
      const figmaFileKey = 'figma-file-with-templates';
      const figmaNodeId = '0:1';
      const manager = new WebsolutCore.Manager({
        figmaToken: '777',
        figmaNodeId,
        figmaFileKey,
        dataDirPath: join(tmpTestsDir, 'data'),
      });

      copyDataExample('figma-file-fresh', manager.dataDirPath);
      copyDataExample('downloaded-assets-data', manager.dataDirPath);

      manager.loadData();

      manager.export({
        outDirPath: join(tmpTestsDir, 'out', figmaFileKey),
        templatesDirPath: resolve('./tests/support/static-html-template-files'),
      });

      expect(
        fs.readFileSync(
          join(tmpTestsDir, 'out', figmaFileKey, 'index.html'),
          'utf8',
        ),
      ).toEqual(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Figma Test Mock</title>
  <link media="all" rel="stylesheet" href="./styles.css"></link>
</head>
<body id="i01">
  <main id="main-container" class="card">
    <div id="i80864888067139280671625" class="rounded-image"></div>
    <p id="i0112">This is a text node</p>
  </main>
  <span id="i012">text from downloaded-assets</span>
</body>
</html>
`);

      expect(
        fs.readFileSync(
          join(tmpTestsDir, 'out', figmaFileKey, 'styles.css'),
          'utf8',
        ),
      ).toEqual(`*, *:before, *:after {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  box-sizing: border-box;
  -webkit-font-smoothing: subpixel-antialiased !important;
}
#main-container {
  justify-content: flex-start;
}
#i80864888067139280671625 {
  background-image: url(./assets/2f44802a1e60e100445f7065aeea100fe646b924.png);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 24px;
  height: 100%;
  overflow: auto;
  width: 100%;
}
`);
    });
  });

  describe('when data with variant is loaded and templatesDirPath is defined', () => {
    it('should export pages as HTML and CSS to a given directory with variant assets', () => {
      const figmaFileKey = 'figma-file-with-japanese-variant-and-variant';
      const figmaNodeId = '0:1';
      const manager = new WebsolutCore.Manager({
        figmaToken: '777',
        figmaNodeId,
        figmaFileKey,
        dataDirPath: join(tmpTestsDir, 'data'),
      });

      copyDataExample('figma-file-fresh', manager.dataDirPath);
      copyDataExample('downloaded-assets-data', manager.dataDirPath);
      copyDataExample('user-data', manager.dataDirPath);
      copyDataExample('japanese-variant', manager.dataDirPath);

      manager.loadData('japanese');

      manager.export({
        outDirPath: join(tmpTestsDir, 'out', figmaFileKey),
        templatesDirPath: resolve('./tests/support/static-html-template-files'),
      });

      const variantAssetFilePath = join(
        manager.dataDirPath,
        sanitizedFileName(figmaNodeId),
        ASSETS_DIR_NAME,
        VARIANTS_DIR_NAME,
        'japanese/2f44802a1e60e100445f7065aeea100fe646b924.png',
      );

      expect(fs.existsSync(variantAssetFilePath)).toBe(true);

      expect(
        fs.readFileSync(
          join(tmpTestsDir, 'out', figmaFileKey, 'styles.css'),
          'utf8',
        ),
      ).toEqual(`*, *:before, *:after {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  box-sizing: border-box;
  -webkit-font-smoothing: subpixel-antialiased !important;
}
#main-container {
  justify-content: flex-start;
}
#i80864888067139280671625 {
  background-image: url(./assets/variants/japanese/2f44802a1e60e100445f7065aeea100fe646b924.png);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 24px;
  height: 100%;
  overflow: auto;
  width: 100%;
}
`);
    });
  });
});
