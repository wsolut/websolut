import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#cssBorderImageSlice', () => {
  const gradientStroke = {
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
  };

  it('returns 1 when eligible for border-image', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokeAlign: 'CENTER',
      strokeWeight: 4,
      strokes: [gradientStroke],
    });

    expect(instance.cssBorderImageSlice()).toBe('1');
  });
});
