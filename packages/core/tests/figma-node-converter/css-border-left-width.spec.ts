import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#cssBorderLeftWidth', () => {
  it('should be correct when strokes and individualStrokeWeights are present', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
      individualStrokeWeights: { top: 0, right: 0, bottom: 0, left: 4 },
    });
    expect(instance.cssBorderLeftWidth()).toBe('4px');
  });

  it('should be blank when strokes has SOLID but individualStrokeWeights is missing', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: {
            r: 0.0,
            g: 0.0,
            b: 0.0,
            a: 1.0,
          },
        },
      ],
    });
    expect(instance.cssBorderLeftWidth()).toBe(undefined);
  });

  it('should be blank when strokes does not have SOLID and individualStrokeWeights is present', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'IMAGE',
          scaleMode: 'FILL',
          imageRef: '',
        },
      ],
      individualStrokeWeights: {
        top: 1.0,
        right: 2.0,
        bottom: 3.0,
        left: 4.0,
      },
    });
    expect(instance.cssBorderLeftWidth()).toBe(undefined);
  });

  it('should be blank when strokes has SOLID and all individualStrokeWeights are equal', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: {
            r: 0.0,
            g: 0.0,
            b: 0.0,
            a: 1.0,
          },
        },
      ],
      individualStrokeWeights: {
        top: 1.0,
        right: 1.0,
        bottom: 1.0,
        left: 1.0,
      },
    });
    expect(instance.cssBorderLeftWidth()).toBe(undefined);
  });
});
