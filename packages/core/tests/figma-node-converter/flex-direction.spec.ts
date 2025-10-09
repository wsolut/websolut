import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#flexDirection', () => {
    it('should be row when layoutMode is HORIZONTAL', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutMode: 'HORIZONTAL',
      });
      expect(instance.cssFlexDirection()).toBe('row');
    });
    it('should be column when layoutMode is VERTICAL', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutMode: 'VERTICAL',
      });
      expect(instance.cssFlexDirection()).toBe('column');
    });
    it('should be blank when layoutMode is NONE', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutMode: 'NONE',
      });
      expect(instance.cssFlexDirection()).toBe(undefined);
    });
  });
});
