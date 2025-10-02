import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssFontSize', () => {
  it("should be '66.6px' when 'style.fontSize' is 66.6", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.text,
      style: { fontSize: 66.6 },
    });
    expect(instance.cssFontSize()).toBe('66.6px');
  });
});
