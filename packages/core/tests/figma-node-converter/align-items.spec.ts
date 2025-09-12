import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('grid shorthand guard', () => {
    it('returns undefined when layoutMode is GRID (use place-items)', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutMode: 'GRID',
        counterAxisAlignItems: 'CENTER',
      });
      expect(instance.cssAlignItems()).toBeUndefined();
    });
  });

  describe("when 'counterAxisAlignItems' is 'MIN'", () => {
    it("#align_items should be 'flex-start'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        counterAxisAlignItems: 'MIN',
      });
      expect(instance.cssAlignItems()).toBe('flex-start');
    });
  });

  describe("when 'counterAxisAlignItems' is 'MAX'", () => {
    it("#align_items should be 'flex-end'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        counterAxisAlignItems: 'MAX',
      });
      expect(instance.cssAlignItems()).toBe('flex-end');
    });
  });

  describe("when 'counterAxisAlignItems' is 'CENTER'", () => {
    it("#align_items should be 'center'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        counterAxisAlignItems: 'CENTER',
      });
      expect(instance.cssAlignItems()).toBe('center');
    });
  });

  describe("when 'counterAxisAlignItems' is 'BASELINE'", () => {
    it("#align_items should be 'baseline'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        counterAxisAlignItems: 'BASELINE',
      });
      expect(instance.cssAlignItems()).toBe('baseline');
    });

    it('returns undefined for GRID layout (use place-items baseline)', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutMode: 'GRID',
        counterAxisAlignItems: 'BASELINE',
      });
      expect(instance.cssAlignItems()).toBeUndefined();
    });
  });
});
