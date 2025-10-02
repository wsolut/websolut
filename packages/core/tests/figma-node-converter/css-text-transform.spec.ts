import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssTextTransform', () => {
  describe("when 'style.textCase' is 'UPPER'", () => {
    it("should be 'uppercase'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { textCase: 'UPPER' },
      });
      expect(instance.cssTextTransform()).toBe('uppercase');
    });
  });

  describe("when 'style.textCase' is 'LOWER'", () => {
    it("should be 'lowercase'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { textCase: 'LOWER' },
      });
      expect(instance.cssTextTransform()).toBe('lowercase');
    });
  });
  describe("when 'style.textCase' is 'TITLE'", () => {
    it("should be 'capitalize'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { textCase: 'TITLE' },
      });
      expect(instance.cssTextTransform()).toBe('capitalize');
    });
  });
  describe("when 'style.textCase' is 'SMALL_CAPS'", () => {
    it('should be undefined (handled by font-variant-caps)', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { textCase: 'SMALL_CAPS' },
      });
      expect(instance.cssTextTransform()).toBeUndefined();
    });
  });
  describe("when 'style.textCase' is 'SMALL_CAPS_FORCED'", () => {
    it('should be undefined (handled by font-variant-caps)', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { textCase: 'SMALL_CAPS_FORCED' },
      });
      expect(instance.cssTextTransform()).toBeUndefined();
    });
  });
});
