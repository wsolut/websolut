import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe("when 'style.fontWeight' is 666", () => {
    it("#font_weight should be '666'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { fontWeight: 666 },
      });
      expect(instance.cssFontWeight()).toBe('666');
    });
  });
});
