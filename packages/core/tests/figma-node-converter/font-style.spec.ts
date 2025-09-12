import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#cssFontStyle', () => {
    describe('when fontPostScriptName contains Italic', () => {
      it("returns 'italic'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.text,
          style: {
            fontFamily: 'Open Sans',
            fontPostScriptName: 'OpenSans-Italic',
            fontSize: 16,
            fontWeight: 400,
          },
        });
        expect(instance.cssFontStyle()).toBe('italic');
      });
    });

    describe('when fontPostScriptName is not Italic', () => {
      it('returns undefined', () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.text,
          style: {
            fontFamily: 'Open Sans',
            fontPostScriptName: 'OpenSans-Regular',
            fontSize: 16,
            fontWeight: 400,
          },
        });
        expect(instance.cssFontStyle()).toBeUndefined();
      });
    });
  });
});
