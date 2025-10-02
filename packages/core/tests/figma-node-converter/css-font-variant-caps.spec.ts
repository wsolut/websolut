import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssFontVariantCaps', () => {
  it("returns 'small-caps' for SMALL_CAPS", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.text,
      style: { textCase: 'SMALL_CAPS' },
    });
    expect(instance.cssFontVariantCaps()).toBe('small-caps');
  });

  it("returns 'all-small-caps' for SMALL_CAPS_FORCED", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.text,
      style: { textCase: 'SMALL_CAPS_FORCED' },
    });
    expect(instance.cssFontVariantCaps()).toBe('all-small-caps');
  });

  it('returns undefined otherwise', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.text,
      style: {},
    });
    expect(instance.cssFontVariantCaps()).toBeUndefined();
  });
});
