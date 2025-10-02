import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssFlex', () => {
  it.skip("should be '1' when 'layoutGrow' is 1", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutGrow: 1,
    });
    expect(instance.cssFlex()).toBe(1);
  });

  it.skip("should be '1' when 'layoutSizingHorizontal' is 'FILL' and width and height are not present", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutSizingHorizontal: 'FILL',
    });
    expect(instance.cssFlex()).toBe(1);
  });

  it.skip("should be blank when 'layoutSizingHorizontal' is 'FILL' and width and height are present", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutSizingHorizontal: 'FILL',
      size: { x: 500.666, y: 666.666 },
    });
    expect(instance.cssFlex()).toBeUndefined();
  });

  it.skip("should be '1' when 'layoutSizingVertical' is 'FILL' and width and height are not present", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutSizingVertical: 'FILL',
    });
    expect(instance.cssFlex()).toBe(1);
  });

  it.skip("should be blank when 'layoutSizingVertical' is 'FILL' and width and height are present", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutSizingVertical: 'FILL',
      size: { x: 500.666, y: 666.666 },
    });
    expect(instance.cssFlex()).toBeUndefined();
  });

  describe("when 'layoutSizingHorizontal' is 'FILL'", () => {
    it.skip('should be 1 when size, min_width, and min_height are not present', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutSizingHorizontal: 'FILL',
      });
      expect(instance.cssFlex()).toBe(1);
    });

    it.skip('should be blank when size is present and min_width and min_height are not present', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutSizingHorizontal: 'FILL',
        size: { x: 500.666, y: 666.666 },
      });
      expect(instance.cssFlex()).toBeUndefined();
    });

    it.skip('should be blank when size is NOT present and min_width is present and min_height is not', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutSizingHorizontal: 'FILL',
        minWidth: 666,
      });
      expect(instance.cssFlex()).toBeUndefined();
    });

    it.skip('should be blank when size is NOT present and min_width is not present and min_height is', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutSizingHorizontal: 'FILL',
        minHeight: 666,
      });
      expect(instance.cssFlex()).toBeUndefined();
    });
  });
});

describe("when 'layoutSizingVertical' is 'FILL'", () => {
  it.skip('should be 1 when size, min_width, and min_height are not present', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutSizingVertical: 'FILL',
    });
    expect(instance.cssFlex()).toBe(1);
  });

  it.skip('should be blank when size is present and min_width and min_height are not present', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutSizingVertical: 'FILL',
      size: { x: 500.666, y: 666.666 },
    });
    expect(instance.cssFlex()).toBeUndefined();
  });

  it.skip('should be blank when size is NOT present and min_width is present and min_height is not', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutSizingVertical: 'FILL',
      minWidth: 666,
    });
    expect(instance.cssFlex()).toBeUndefined();
  });

  it.skip('should be blank when size is NOT present and min_width is not present and min_height is', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutSizingVertical: 'FILL',
      minHeight: 666,
    });
    expect(instance.cssFlex()).toBeUndefined();
  });
});
