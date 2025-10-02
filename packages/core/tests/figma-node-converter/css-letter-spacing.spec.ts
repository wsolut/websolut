import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssLetterSpacing', () => {
  it("should be '66.6px' when 'style.letterSpacing' is 66.6", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.text,
      style: { letterSpacing: 66.6 },
    });
    expect(instance.cssLetterSpacing()).toBe('66.6px');
  });
});
