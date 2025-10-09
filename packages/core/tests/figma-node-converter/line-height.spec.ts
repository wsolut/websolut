import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe("when 'style.lineHeightPx' is 66.6", () => {
    it("#line_height should be '66.6px'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { lineHeightPx: 66.6 },
      });
      expect(instance.cssLineHeight()).toBe('66.6px');
    });
  });
});
