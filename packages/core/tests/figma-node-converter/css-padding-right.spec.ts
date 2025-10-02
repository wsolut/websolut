import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#cssPaddingRight', () => {
  it('should be 666px when paddingRight is 666', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      paddingRight: 666,
    });
    expect(instance.cssPaddingRight()).toBe('666px');
  });
});
