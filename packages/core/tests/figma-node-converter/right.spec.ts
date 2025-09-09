import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssRight', () => {
    it('should return 462px when position is fixed, constraints horizontal is RIGHT and relativeTransform is [[1, ~0, 462], [~0, 1, 609]]', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        isFixed: true,
        constraints: {
          vertical: 'TOP',
          horizontal: 'RIGHT',
        },
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      });
      expect(instance.cssRight()).toBe('462px');
    });

    it('should return 0px when position is fixed, constraints horizontal is RIGHT relativeTransform is [[1, 0, 462], [~0, 1, 609]]', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        isFixed: true,
        constraints: {
          vertical: 'TOP',
          horizontal: 'RIGHT',
        },
        relativeTransform: [
          [1.0, 0.0, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      });
      expect(instance.cssRight()).toBe('0px');
    });

    it('should be undefined when position is absolute and relativeTransform is set', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutPositioning: 'ABSOLUTE',
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      });
      expect(instance.cssRight()).toBe(undefined);
    });

    it('should return the left value when constrains horizontal is LEFT_RIGHT', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutPositioning: 'ABSOLUTE',
        constraints: {
          vertical: 'TOP',
          horizontal: 'LEFT_RIGHT',
        },
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      });
      expect(instance.cssRight()).toBe('462px');
    });

    it('should be blank when position is blank and relativeTransform is set', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      });
      expect(instance.cssRight()).toBeFalsy();
    });
  });
});
