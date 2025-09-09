import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#top', () => {
    it('should return 609px when position is fixed and relativeTransform is [[1, ~0, 462], [~0, 1, 609]]', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        isFixed: true,
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      });
      expect(instance.cssTop()).toBe('609px');
    });
    it('should return 0px when position is fixed and relativeTransform is [[1, ~0, 462], [~0, 0, 609]]', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        isFixed: true,
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 0.0, 609.0],
        ],
      });
      expect(instance.cssTop()).toBe('0px');
    });
    it('should return 609px when position is absolute and relativeTransform is set', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutPositioning: 'ABSOLUTE',
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      });
      expect(instance.cssTop()).toBe('609px');
    });
    it('should be blank when position is blank and relativeTransform is set', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      });
      expect(instance.cssTop()).toBeFalsy();
    });
  });
});
