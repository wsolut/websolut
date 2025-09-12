import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#overflow', () => {
    describe("when 'clipsContent' is true", () => {
      it("#overflow should be 'auto'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          clipsContent: true,
        });
        expect(instance.cssOverflow()).toBe('auto');
      });
    });

    describe("when 'scrollBehavior' is SCROLLS", () => {
      it.skip("#overflow should be 'auto'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          scrollBehavior: 'SCROLLS',
        });
        expect(instance.cssOverflow()).toBe('auto');
      });
    });
  });
});
