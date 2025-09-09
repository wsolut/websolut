import { existsSync, mkdirSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import nock from 'nock';
import { expect, it, describe, beforeAll } from 'vitest';
import * as FigmaResponseExamples from '../support/figma-response-examples';
import { copyDataExample } from '../support/utils';

import * as WebsolutCore from '../../src/index';
import { DOMX_DOCUMENT_EXTENSION } from '../../src/constants';
import { DomxDocument } from '../../src/domx';
import { readJsonFileSync, sanitizedFileName } from '../../src/utils';

const tmpTestsDir = resolve('./tmp/tests/manager-synchronize');

describe('Manager#synchronize', () => {
  beforeAll(() => {
    rmSync(tmpTestsDir, { recursive: true, force: true });
    mkdirSync(tmpTestsDir, { recursive: true });
  });

  it('must create a domx-document.json file per page', async () => {
    nock.disableNetConnect();

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*/)
      .reply(200, FigmaResponseExamples.fileNodes);

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*\/images/)
      .reply(200, FigmaResponseExamples.imageFills);

    const figmaFileKey = '666';
    const figmaNodeId = '0:1';
    const manager = new WebsolutCore.Manager({
      figmaToken: '777',
      figmaNodeId,
      figmaFileKey,
      dataDirPath: join(tmpTestsDir, 'data'),
    });

    await manager.synchronize();

    expect(manager.page).toBeDefined();

    const documentFilePath = join(
      manager.dataDirPath,
      sanitizedFileName(figmaNodeId),
      DOMX_DOCUMENT_EXTENSION,
    );

    expect(existsSync(documentFilePath)).toBe(true);
  });

  describe('when no data exists', () => {
    it('it updates pages with data from API', async () => {
      nock.disableNetConnect();

      nock(/api\.figma\.com/)
        .get(/v1\/files\/.*/)
        .reply(200, FigmaResponseExamples.fileNodes);

      nock(/api\.figma\.com/)
        .get(/v1\/files\/.*\/images/)
        .reply(200, FigmaResponseExamples.imageFills);

      const figmaFileKey = 'figma-file-no-data';
      const figmaNodeId = '0:1';
      const manager = new WebsolutCore.Manager({
        figmaToken: '777',
        figmaNodeId,
        figmaFileKey,
        dataDirPath: join(tmpTestsDir, 'data'),
      });

      await manager.synchronize();

      const inMemoryDomxDocument = manager.page.document;
      const inMemoryNodes = inMemoryDomxDocument.nodes;
      const inMemoryBody = inMemoryNodes[inMemoryDomxDocument.bodyId];
      const inMemoryTextNode = inMemoryNodes[inMemoryBody.childrenIds[1]];
      expect(inMemoryTextNode.text).toEqual('text from API');

      const inDiskDomxDocument = readJsonFileSync(
        join(
          manager.dataDirPath,
          sanitizedFileName(figmaNodeId),
          DOMX_DOCUMENT_EXTENSION,
        ),
      ) as DomxDocument;
      const inDiskNodes = inDiskDomxDocument.nodes;
      const inDiskBody = inDiskNodes[inDiskDomxDocument.bodyId];
      const inDiskTextNode = inDiskNodes[inDiskBody.childrenIds[1]];
      expect(inDiskTextNode.text).toEqual('text from API');
    });
  });

  it('when data is outdated, it populates pages from API', async () => {
    nock.disableNetConnect();

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*/)
      .reply(200, FigmaResponseExamples.fileNodes);

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*\/images/)
      .reply(200, FigmaResponseExamples.imageFills);

    const figmaFileKey = 'figma-file-outdated';
    const figmaNodeId = '0:1';
    const manager = new WebsolutCore.Manager({
      figmaToken: '777',
      figmaNodeId,
      figmaFileKey,
      dataDirPath: join(tmpTestsDir, 'data'),
    });

    copyDataExample(figmaFileKey, manager.dataDirPath);

    await manager.synchronize();

    const inMemoryDomxDocument = manager.page.document;
    const inMemoryNodes = inMemoryDomxDocument.nodes;
    const inMemoryBody = inMemoryNodes[inMemoryDomxDocument.bodyId];
    const inMemoryTextNode = inMemoryNodes[inMemoryBody.childrenIds[1]];
    expect(inMemoryTextNode.text).toEqual('text from API');

    const inDiskDomxDocument = readJsonFileSync(
      join(
        manager.dataDirPath,
        sanitizedFileName(figmaNodeId),
        DOMX_DOCUMENT_EXTENSION,
      ),
    ) as DomxDocument;
    const inDiskNodes = inDiskDomxDocument.nodes;
    const inDiskBody = inDiskNodes[inDiskDomxDocument.bodyId];
    const inDiskTextNode = inDiskNodes[inDiskBody.childrenIds[1]];
    expect(inDiskTextNode.text).toEqual('text from API');
  });

  it('when data is still fresh, it does not populate pages with API data', async () => {
    nock.disableNetConnect();

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*/)
      .reply(200, FigmaResponseExamples.fileNodes);

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*\/images/)
      .reply(200, FigmaResponseExamples.imageFills);

    const figmaFileKey = 'figma-file-fresh';
    const figmaNodeId = '0:1';
    const manager = new WebsolutCore.Manager({
      figmaToken: '777',
      figmaNodeId,
      figmaFileKey,
      dataDirPath: join(tmpTestsDir, 'data'),
    });

    copyDataExample(figmaFileKey, manager.dataDirPath);

    await manager.synchronize();

    const inMemoryDomxDocument = manager.page.document;
    const inMemoryNodes = inMemoryDomxDocument.nodes;
    const inMemoryBody = inMemoryNodes[inMemoryDomxDocument.bodyId];
    const inMemoryTextNode = inMemoryNodes[inMemoryBody.childrenIds[1]];
    expect(inMemoryTextNode.text).toEqual('text from file');

    const inDiskDomxDocument = readJsonFileSync(
      join(
        manager.dataDirPath,
        sanitizedFileName(figmaNodeId),
        DOMX_DOCUMENT_EXTENSION,
      ),
    ) as DomxDocument;
    const inDiskNodes = inDiskDomxDocument.nodes;
    const inDiskBody = inDiskNodes[inDiskDomxDocument.bodyId];
    const inDiskTextNode = inDiskNodes[inDiskBody.childrenIds[1]];
    expect(inDiskTextNode.text).toEqual('text from file');
  });

  it('when data is still fresh but force: true is used, it populates pages from API', async () => {
    nock.disableNetConnect();

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*/)
      .reply(200, FigmaResponseExamples.fileNodes);

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*\/images/)
      .reply(200, FigmaResponseExamples.imageFills);

    const figmaFileKey = 'figma-file-fresh-force';
    const figmaNodeId = '0:1';
    const manager = new WebsolutCore.Manager({
      figmaToken: '777',
      figmaNodeId,
      figmaFileKey,
      dataDirPath: join(tmpTestsDir, 'data'),
    });

    copyDataExample('figma-file-fresh', manager.dataDirPath);

    await manager.synchronize({ force: true });

    const inMemoryDomxDocument = manager.page.document;
    const inMemoryNodes = inMemoryDomxDocument.nodes;
    const inMemoryBody = inMemoryNodes[inMemoryDomxDocument.bodyId];
    const inMemoryTextNode = inMemoryNodes[inMemoryBody.childrenIds[1]];
    expect(inMemoryTextNode.text).toEqual('text from API');

    const inDiskDomxDocument = readJsonFileSync(
      join(
        manager.dataDirPath,
        sanitizedFileName(figmaNodeId),
        DOMX_DOCUMENT_EXTENSION,
      ),
    ) as DomxDocument;
    const inDiskNodes = inDiskDomxDocument.nodes;
    const inDiskBody = inDiskNodes[inDiskDomxDocument.bodyId];
    const inDiskTextNode = inDiskNodes[inDiskBody.childrenIds[1]];
    expect(inDiskTextNode.text).toEqual('text from API');
  });

  it('when data is outdated and downloaded-assets data is present, downloaded-assets data must overwrite data from API', async () => {
    nock.disableNetConnect();

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*/)
      .reply(200, FigmaResponseExamples.fileNodes);

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*\/images/)
      .reply(200, FigmaResponseExamples.imageFills);

    const figmaFileKey = 'figma-file-with-downloaded-assets-data';
    const figmaNodeId = '0:1';
    const manager = new WebsolutCore.Manager({
      figmaToken: '777',
      figmaNodeId,
      figmaFileKey,
      dataDirPath: join(tmpTestsDir, 'data'),
    });

    copyDataExample('figma-file-outdated', manager.dataDirPath);
    copyDataExample('downloaded-assets-data', manager.dataDirPath);

    await manager.synchronize();

    const inMemoryDomxDocument = manager.page.document;
    const inMemoryNodes = inMemoryDomxDocument.nodes;
    const inMemoryBody = inMemoryNodes[inMemoryDomxDocument.bodyId];
    const inMemoryTextNode = inMemoryNodes[inMemoryBody.childrenIds[1]];
    expect(inMemoryTextNode.name).toEqual('SPAN');
    expect(inMemoryTextNode.text).toEqual('text from downloaded-assets');

    const inDiskDomxDocument = readJsonFileSync(
      join(
        manager.dataDirPath,
        sanitizedFileName(figmaNodeId),
        DOMX_DOCUMENT_EXTENSION,
      ),
    ) as DomxDocument;
    const inDiskNodes = inDiskDomxDocument.nodes;
    const inDiskBody = inDiskNodes[inDiskDomxDocument.bodyId];
    const inDiskTextNode = inDiskNodes[inDiskBody.childrenIds[1]];
    expect(inDiskTextNode.name).toEqual('P');
    expect(inDiskTextNode.text).toEqual('text from API');
  });

  it('when data is outdated, downloaded-assets and user data is present, user data must overwrite data from API', async () => {
    nock.disableNetConnect();

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*/)
      .reply(200, FigmaResponseExamples.fileNodes);

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*\/images/)
      .reply(200, FigmaResponseExamples.imageFills);

    const figmaFileKey = 'figma-file-with-user-data';
    const figmaNodeId = '0:1';
    const manager = new WebsolutCore.Manager({
      figmaToken: '777',
      figmaNodeId,
      figmaFileKey,
      dataDirPath: join(tmpTestsDir, 'data'),
    });

    copyDataExample('figma-file-outdated', manager.dataDirPath);
    copyDataExample('downloaded-assets-data', manager.dataDirPath);
    copyDataExample('user-data', manager.dataDirPath);

    await manager.synchronize();

    const inMemoryDomxDocument = manager.page.document;
    const inMemoryNodes = inMemoryDomxDocument.nodes;
    const inMemoryBody = inMemoryNodes[inMemoryDomxDocument.bodyId];
    const inMemoryTextNode = inMemoryNodes[inMemoryBody.childrenIds[1]];
    expect(inMemoryTextNode.name).toEqual('SMALL');
    expect(inMemoryTextNode.text).toEqual('text from user');

    const inDiskDomxDocument = readJsonFileSync(
      join(
        manager.dataDirPath,
        sanitizedFileName(figmaNodeId),
        DOMX_DOCUMENT_EXTENSION,
      ),
    ) as DomxDocument;
    const inDiskNodes = inDiskDomxDocument.nodes;
    const inDiskBody = inDiskNodes[inDiskDomxDocument.bodyId];
    const inDiskTextNode = inDiskNodes[inDiskBody.childrenIds[1]];
    expect(inDiskTextNode.name).toEqual('P');
    expect(inDiskTextNode.text).toEqual('text from API');
  });

  it('when using a variant and downloaded-assets and user data are present, variant data must overwrite data', async () => {
    nock.disableNetConnect();

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*/)
      .reply(200, FigmaResponseExamples.fileNodes);

    nock(/api\.figma\.com/)
      .get(/v1\/files\/.*\/images/)
      .reply(200, FigmaResponseExamples.imageFills);

    const figmaFileKey = 'figma-file-with-japanese-variant';
    const figmaNodeId = '0:1';
    const manager = new WebsolutCore.Manager({
      figmaToken: '777',
      figmaNodeId,
      figmaFileKey,
      dataDirPath: join(tmpTestsDir, 'data'),
    });

    copyDataExample('figma-file-outdated', manager.dataDirPath);
    copyDataExample('downloaded-assets-data', manager.dataDirPath);
    copyDataExample('user-data', manager.dataDirPath);
    copyDataExample('japanese-variant', manager.dataDirPath);

    await manager.synchronize({ variant: 'japanese' });

    const inMemoryDomxDocument = manager.page.document;
    const inMemoryNodes = inMemoryDomxDocument.nodes;
    const inMemoryBody = inMemoryNodes[inMemoryDomxDocument.bodyId];
    const inMemoryTextNode = inMemoryNodes[inMemoryBody.childrenIds[1]];
    expect(inMemoryTextNode.name).toEqual('A');
    expect(inMemoryTextNode.text).toEqual('text from variant');
  });
});
