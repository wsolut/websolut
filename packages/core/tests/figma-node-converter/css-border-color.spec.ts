import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#cssBorderColor', () => {
  it('should return color rgba value when strokes has SOLID', () => {
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
    expect(instance.cssBorderColor()).toBe('rgba(0, 0, 0, 1)');
  });

  it('should be blank when strokes does not have SOLID', () => {
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
    });
    expect(instance.cssBorderColor()).toBe(undefined);
  });

  it('should be blank when the top-most visible stroke is non-SOLID even if a SOLID exists below', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 1, g: 0, b: 0, a: 1 },
        },
        {
          blendMode: 'NORMAL',
          type: 'GRADIENT_LINEAR',
          gradientHandlePositions: [
            { x: 0.0, y: 0.5 },
            { x: 1.0, y: 0.5 },
            { x: 0.0, y: 1.0 },
          ],
          gradientStops: [
            { position: 0, color: { r: 0, g: 0, b: 0, a: 1 } },
            { position: 1, color: { r: 1, g: 1, b: 1, a: 1 } },
          ],
        },
      ],
    });
    expect(instance.cssBorderColor()).toBe(undefined);
  });

  it('should return color when the top-most visible stroke is SOLID', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'GRADIENT_LINEAR',
          gradientHandlePositions: [
            { x: 0.0, y: 0.5 },
            { x: 1.0, y: 0.5 },
            { x: 0.0, y: 1.0 },
          ],
          gradientStops: [
            { position: 0, color: { r: 0, g: 0, b: 0, a: 1 } },
            { position: 1, color: { r: 1, g: 1, b: 1, a: 1 } },
          ],
        },
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 0, g: 0, b: 1, a: 1 },
        },
      ],
    });
    expect(instance.cssBorderColor()).toBe('rgba(0, 0, 255, 1)');
  });

  it('should be blank when strokeAlign is INSIDE', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokeAlign: 'INSIDE',
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 1, g: 0, b: 0, a: 1 },
        },
      ],
      strokeWeight: 4,
    });
    expect(instance.cssBorderColor()).toBe(undefined);
  });

  it('should be blank when strokeAlign is OUTSIDE', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokeAlign: 'OUTSIDE',
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 0, g: 0, b: 1, a: 1 },
        },
      ],
      strokeWeight: 2,
    });
    expect(instance.cssBorderColor()).toBe(undefined);
  });

  it('should retain color when strokeAlign is CENTER', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokeAlign: 'CENTER',
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 0, g: 1, b: 0, a: 1 },
        },
      ],
    });
    expect(instance.cssBorderColor()).toBe('rgba(0, 255, 0, 1)');
  });
});
