import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssFontFamily', () => {
  it("should be ''666', Arial, sans-serif' when 'style.fontFamily' is '666'", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.text,
      style: { fontFamily: '666' },
    });
    expect(instance.cssFontFamily()).toBe("'666', Arial, sans-serif");
  });
});
