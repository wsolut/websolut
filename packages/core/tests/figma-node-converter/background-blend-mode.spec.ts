import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssBackgroundBlendMode', () => {
    it('returns undefined when there are no image or valid gradient fills', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [],
      });
      expect(instance.cssBackgroundBlendMode()).toBeUndefined();
    });

    it('emits a single value for one IMAGE fill, defaulting to normal', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            type: 'IMAGE',
            blendMode: 'NORMAL',
            scaleMode: 'FILL',
            imageRef: 'img1',
          },
        ],
      });
      expect(instance.cssBackgroundBlendMode()).toBe('normal');
    });

    it('maps Figma blendMode to CSS for an IMAGE fill', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            type: 'IMAGE',
            blendMode: 'LINEAR_DODGE',
            scaleMode: 'FILL',
            imageRef: 'img1',
          },
        ],
      });
      expect(instance.cssBackgroundBlendMode()).toBe('linear-dodge');
    });

    it('orders values to mirror background-image: images first, then gradients that render', () => {
      const gradientPaint = {
        opacity: 0.5,
        blendMode: 'COLOR_DODGE' as const,
        type: 'GRADIENT_LINEAR' as const,
        gradientHandlePositions: [
          { x: 0.0, y: 0.5 },
          { x: 1.0, y: 0.5 },
          { x: 0.0, y: 1.0 },
        ],
        gradientStops: [
          {
            color: { r: 1, g: 0, b: 0, a: 1 },
            position: 0,
          },
          {
            color: { r: 0, g: 0, b: 0, a: 1 },
            position: 1,
          },
        ],
      };

      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            type: 'IMAGE',
            blendMode: 'SCREEN',
            scaleMode: 'FILL',
            imageRef: 'img1',
          },
          gradientPaint,
        ],
      });

      // Expect image layer first (screen), then gradient (color-dodge)
      expect(instance.cssBackgroundBlendMode()).toBe('screen, color-dodge');
    });

    it('skips gradients that would not render (e.g., only one stop), preserving order', () => {
      const gradientSingleStop = {
        blendMode: 'MULTIPLY' as const,
        type: 'GRADIENT_LINEAR' as const,
        gradientHandlePositions: [
          { x: 0.0, y: 0.5 },
          { x: 1.0, y: 0.5 },
          { x: 0.0, y: 1.0 },
        ],
        gradientStops: [
          {
            color: { r: 1, g: 0, b: 0, a: 1 },
            position: 0,
          },
        ],
      };

      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            type: 'IMAGE',
            blendMode: 'NORMAL',
            scaleMode: 'FILL',
            imageRef: 'img1',
          },
          gradientSingleStop,
        ],
      });

      // Only the image contributes a layer; gradient is ignored (no gradient CSS)
      expect(instance.cssBackgroundBlendMode()).toBe('normal');
    });

    it('emits a comma list for multiple layers, defaulting to normal where unspecified', () => {
      const gradientA = {
        opacity: 1,
        blendMode: 'LINEAR_BURN' as const,
        type: 'GRADIENT_LINEAR' as const,
        gradientHandlePositions: [
          { x: 0.0, y: 0.5 },
          { x: 1.0, y: 0.5 },
          { x: 0.0, y: 1.0 },
        ],
        gradientStops: [
          { color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
          { color: { r: 0, g: 0, b: 0, a: 1 }, position: 1 },
        ],
      };

      const gradientB = {
        opacity: 1,
        // Explicitly use NORMAL to show default mapping
        blendMode: 'NORMAL' as const,
        type: 'GRADIENT_LINEAR' as const,
        gradientHandlePositions: [
          { x: 0.0, y: 0.5 },
          { x: 1.0, y: 0.5 },
          { x: 0.0, y: 1.0 },
        ],
        gradientStops: [
          { color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
          { color: { r: 0, g: 0, b: 0, a: 1 }, position: 1 },
        ],
      };

      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            type: 'IMAGE',
            blendMode: 'NORMAL',
            scaleMode: 'FILL',
            imageRef: 'a',
          },
          {
            type: 'IMAGE',
            blendMode: 'OVERLAY',
            scaleMode: 'FILL',
            imageRef: 'b',
          },
          gradientA,
          gradientB,
        ],
      });

      expect(instance.cssBackgroundBlendMode()).toBe(
        'normal, overlay, linear-burn, normal',
      );
    });
  });
});
