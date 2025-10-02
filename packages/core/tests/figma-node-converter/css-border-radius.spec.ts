import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#cssBorderRadius', () => {
  it('should be blank when cornerRadius is missing', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
    });
    expect(instance.cssBorderRadius()).toBe(undefined);
  });

  it("should return 'cornerRadius' value in px when present", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      cornerRadius: 10,
    });
    expect(instance.cssBorderRadius()).toBe('10px');
  });

  it('should return 4 elements in px format when rectangleCornerRadii is present', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      rectangleCornerRadii: [1, 2, 3, 4],
    });
    expect(instance.cssBorderRadius()).toBe('1px 2px 3px 4px');
  });

  it('should be correct when cornerRadius is present', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      cornerRadius: 8,
    });
    expect(instance.cssBorderRadius()).toBe('8px');
  });
});
