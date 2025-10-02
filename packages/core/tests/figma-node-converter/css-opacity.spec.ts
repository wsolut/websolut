import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssOpacity', () => {
  it("should be 0.5 when #opacity is '0.5'", () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      opacity: 0.546666,
    });
    expect(instance.cssOpacity()).toBe('0.55');
  });

  it('should be undefined when #opacity is not present', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
    });
    expect(instance.cssOpacity()).toBe(undefined);
  });
});
