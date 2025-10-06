import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssRowGap()', () => {
  describe('when gridRowGap is defined', () => {
    it('should return gridRowGap', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        gridRowGap: 6,
      });

      expect(instance.cssRowGap()).toBe('6px');
    });
  });

  describe('when gridRowGap is not defined', () => {
    it('should return undefined', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
      });

      expect(instance.cssRowGap()).toBeUndefined();
    });
  });
});
