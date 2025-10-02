import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssColumnGap()', () => {
  describe('when gridColumnGap is defined', () => {
    it('should return gridColumnGap', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        gridColumnGap: 12,
      });

      expect(instance.cssColumnGap()).toBe('12px');
    });
  });

  describe('when gridColumnGap is not defined', () => {
    it('should return undefined', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
      });

      expect(instance.cssColumnGap()).toBeUndefined();
    });
  });
});
