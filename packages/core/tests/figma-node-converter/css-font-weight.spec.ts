import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssFontWeight', () => {
  it("#font_weight should be '666' when 'style.fontWeight' is 666", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.text,
      style: { fontWeight: 666 },
    });
    expect(instance.cssFontWeight()).toBe('666');
  });
});
