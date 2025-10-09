import { expect, it, describe } from 'vitest';
import { FigmaResponseConverter } from '../../src/figma-response-converter';
import * as FigmaResponseExamples from '../support/figma-response-examples';
import { FigmaClient } from '../../src/utils/figma-client';
import nock from 'nock';

describe('FigmaResponseConverter#convert', () => {
  describe('when figma node is trying to be a placeholder of another', () => {
    it('should not convert', async () => {
      nock(/api\.figma\.com/)
        .get(/v1\/files\/.*\/images/)
        .reply(200, FigmaResponseExamples.imageFills);

      const figmaResponse = FigmaResponseExamples.inputWithPlaceholder;
      const instance = new FigmaResponseConverter(new FigmaClient('666', {}));

      const domxDocuments = await instance.convert(figmaResponse);

      const domxDocument = domxDocuments[0];
      expect(domxDocuments.length).toEqual(1);

      const domxBody = domxDocument.nodes[domxDocument.bodyId];
      expect(domxBody).not.toBeUndefined();

      const fieldSetEl = domxDocument.nodes[domxBody.childrenIds[0]];
      expect(fieldSetEl).not.toBeUndefined();

      const labelEl = domxDocument.nodes[fieldSetEl.childrenIds[0]];
      expect(labelEl).not.toBeUndefined();

      const inputEl = domxDocument.nodes[fieldSetEl.childrenIds[1]];
      expect(inputEl).not.toBeUndefined();
      expect(inputEl.childrenIds).toHaveLength(0);
      expect(inputEl.attributes.placeholder).toEqual('Singapore (SIN)');
    });
  });
});
