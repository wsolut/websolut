import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#cssBorderWidth', () => {
  it('should be correct when strokeWeight is present', () => {
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
      strokeWeight: 2,
    });
    expect(instance.cssBorderWidth()).toBe('2px');
  });

  it('should be blank when strokes has SOLID, strokeWeight is present and individualStrokeWeights is present', () => {
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
      strokeWeight: 2,
      individualStrokeWeights: {
        top: 1.0,
        right: 2.0,
        bottom: 3.0,
        left: 4.0,
      },
    });
    expect(instance.cssBorderWidth()).toBe(undefined);
  });

  it('should return the value of the first attribute of individualStrokeWeights in px when all values are the same', () => {
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
      strokeWeight: 2,
      individualStrokeWeights: {
        top: 3.0,
        right: 3.0,
        bottom: 3.0,
        left: 3.0,
      },
    });
    expect(instance.cssBorderWidth()).toBe('3px');
  });

  it('should be blank when strokes does not have SOLID and strokeWeight is present', () => {
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
      strokeWeight: 2,
    });
    expect(instance.cssBorderWidth()).toBe(undefined);
  });

  it('should be blank when strokeAlign is INSIDE', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokeAlign: 'INSIDE',
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
      strokeWeight: 4,
    });
    expect(instance.cssBorderWidth()).toBe(undefined);
  });

  it('should be blank when strokeAlign is OUTSIDE', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokeAlign: 'OUTSIDE',
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
      strokeWeight: 3,
    });
    expect(instance.cssBorderWidth()).toBe(undefined);
  });

  it('should retain width when strokeAlign is CENTER', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokeAlign: 'CENTER',
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
      strokeWeight: 7,
    });
    expect(instance.cssBorderWidth()).toBe('7px');
  });

  it('falls back to strokeWeight when using border-image (CENTER + gradient)', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokeAlign: 'CENTER',
      strokeWeight: 4,
      strokes: [
        {
          type: 'GRADIENT_LINEAR' as const,
          blendMode: 'NORMAL' as const,
          gradientHandlePositions: [
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 },
            { x: 0, y: 1 },
          ],
          gradientStops: [
            { color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
            { color: { r: 0, g: 0, b: 0, a: 1 }, position: 1 },
          ],
        },
      ],
    });
    expect(instance.cssBorderWidth()).toBe('4px');
  });
});
