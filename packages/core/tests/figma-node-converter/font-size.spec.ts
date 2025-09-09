import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe("when 'style.fontSize' is 66.6", () => {
    it("#font_size should be '66.6px'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { fontSize: 66.6 },
      });
      expect(instance.cssFontSize()).toBe('66.6px');
    });
  });
});
