import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssPaddingBottom', () => {
  it('should be 666px when paddingBottom is 666', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      paddingBottom: 666,
    });
    expect(instance.cssPaddingBottom()).toBe('666px');
  });
});
