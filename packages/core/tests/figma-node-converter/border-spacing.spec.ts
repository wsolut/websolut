import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssBorderSpacing', () => {
    it('should be blank when cornerSmoothing is missing', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
      });
      expect(instance.cssBorderSpacing()).toBe(undefined);
    });

    it("should return 'cornerSmoothing' value in px when present", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        cornerSmoothing: 10,
      });
      expect(instance.cssBorderSpacing()).toBe('10px');
    });
  });
});
