import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#justifyContent', () => {
    it("should be 'flex-start' when 'primaryAxisAlignItems' is 'MIN'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        primaryAxisAlignItems: 'MIN',
      });
      expect(instance.cssJustifyContent()).toBe('flex-start');
    });

    it("should be 'flex-end' when 'primaryAxisAlignItems' is 'MAX'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        primaryAxisAlignItems: 'MAX',
      });
      expect(instance.cssJustifyContent()).toBe('flex-end');
    });

    it("should be 'center' when 'primaryAxisAlignItems' is 'CENTER'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        primaryAxisAlignItems: 'CENTER',
      });
      expect(instance.cssJustifyContent()).toBe('center');
    });

    it("should be 'space-between' when 'primaryAxisAlignItems' is 'SPACE_BETWEEN' and children.length !== 1", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        primaryAxisAlignItems: 'SPACE_BETWEEN',
      });
      expect(instance.cssJustifyContent()).toBe('space-between');
    });

    it("should be 'center' when 'primaryAxisAlignItems' is 'SPACE_BETWEEN' and children.length === 1", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        primaryAxisAlignItems: 'SPACE_BETWEEN',
        children: [FigmaExamples.text],
      });
      expect(instance.cssJustifyContent()).toBe('center');
    });
  });
});
