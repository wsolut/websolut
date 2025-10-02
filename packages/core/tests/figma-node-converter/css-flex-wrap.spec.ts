import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#cssFlexWrap', () => {
  it('should be wrap when layoutWrap is WRAP', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutWrap: 'WRAP',
    });
    expect(instance.cssFlexWrap()).toBe('wrap');
  });

  it('should be nowrap when layoutWrap is NO_WRAP', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutWrap: 'NO_WRAP',
    });
    expect(instance.cssFlexWrap()).toBe('nowrap');
  });
});
