import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssLineHeight', () => {
  it("should be '66.6px' when 'style.lineHeightPx' is 66.6", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.text,
      style: { lineHeightPx: 66.6 },
    });
    expect(instance.cssLineHeight()).toBe('66.6px');
  });
});
