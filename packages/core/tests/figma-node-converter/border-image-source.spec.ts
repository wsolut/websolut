import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssBorderImageSource', () => {
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

    it('returns a linear-gradient(...) when CENTER alignment with uniform weight', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        strokeAlign: 'CENTER',
        strokeWeight: 4,
        strokes: [gradientStroke],
      });

      expect(instance.cssBorderImageSource()).toMatch(/^linear-gradient\(/);
    });

    it('returns undefined when dashes are present', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        strokeAlign: 'CENTER',
        strokeWeight: 4,
        strokeDashes: [2, 2],
        strokes: [gradientStroke],
      });

      expect(instance.cssBorderImageSource()).toBeUndefined();
    });

    it('returns undefined for single-stop gradient strokes', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        strokeAlign: 'CENTER',
        strokeWeight: 4,
        strokes: [
          {
            ...gradientStroke,
            gradientStops: [{ color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 }],
          },
        ],
      });

      expect(instance.cssBorderImageSource()).toBeUndefined();
    });
  });
});
