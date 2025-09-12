import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssBackgroundImage', () => {
    it('should be undefined when GRADIENT_LINEAR entry only has one stop', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'GRADIENT_LINEAR',
            gradientHandlePositions: [
              { x: 0.0, y: 0.5 },
              { x: 1.0, y: 0.5 },
              { x: 0.0, y: 1.0 },
            ],
            gradientStops: [
              {
                color: {
                  r: 1.0,
                  g: 0.001220703125,
                  b: 0.001220703125,
                  a: 0.699999988079071,
                },
                position: 0.0,
              },
            ],
          },
        ],
      });
      expect(instance.cssBackgroundImage()).toBeUndefined();
    });

    it('should return url(imageRef) when fills contains an IMAGE entry with imageRef', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'IMAGE',
            scaleMode: 'FILL',
            imageRef: 'e9abc7d8f4214da74b07e487060b7246a0ab15ab',
          },
        ],
      });
      expect(instance.cssBackgroundImage()).toBe(
        `url(<%- i011.assets['e9abc7d8f4214da74b07e487060b7246a0ab15ab'].filePath || i011.assets['e9abc7d8f4214da74b07e487060b7246a0ab15ab'].url %>)`,
      );
    });

    it('should return a linear-gradient CSS string when fills has a GRADIENT_LINEAR entry with alpha multiplied by opacity', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            opacity: 0.5,
            blendMode: 'NORMAL',
            type: 'GRADIENT_LINEAR',
            gradientHandlePositions: [
              { x: 0.0, y: 0.5 },
              { x: 1.0, y: 0.5 },
              { x: 0.0, y: 1.0 },
            ],
            gradientStops: [
              {
                color: {
                  r: 1.0,
                  g: 0.001220703125,
                  b: 0.001220703125,
                  a: 0.699999988079071,
                },
                position: 0.0,
              },
              {
                color: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                position: 1.0,
              },
            ],
          },
        ],
      });
      expect(instance.cssBackgroundImage()).toBe(
        'linear-gradient(90deg, rgba(255, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.5) 100%)',
      );
    });

    it('should return url(imageRef), linear-gradient(...) when fills contains both IMAGE and GRADIENT_LINEAR', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'IMAGE',
            scaleMode: 'FILL',
            imageRef: 'e9abc7d8f4214da74b07e487060b7246a0ab15ab',
          },
          {
            opacity: 0.5,
            blendMode: 'NORMAL',
            type: 'GRADIENT_LINEAR',
            gradientHandlePositions: [
              { x: 0.0, y: 0.5 },
              { x: 1.0, y: 0.5 },
              { x: 0.0, y: 1.0 },
            ],
            gradientStops: [
              {
                color: {
                  r: 1.0,
                  g: 0.001220703125,
                  b: 0.001220703125,
                  a: 0.699999988079071,
                },
                position: 0.0,
              },
              {
                color: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                position: 1.0,
              },
            ],
          },
        ],
      });
      expect(instance.cssBackgroundImage()).toBe(
        `url(<%- i011.assets['e9abc7d8f4214da74b07e487060b7246a0ab15ab'].filePath || i011.assets['e9abc7d8f4214da74b07e487060b7246a0ab15ab'].url %>), linear-gradient(90deg, rgba(255, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.5) 100%)`,
      );
    });

    it('should be correct when fills contains an IMAGE entry', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'IMAGE',
            scaleMode: 'FILL',
            imageRef: 'img123',
          },
        ],
      });
      expect(instance.cssBackgroundImage()).toContain('url');
    });

    it('should return a comma-separated list when multiple GRADIENT_LINEAR entries are present', () => {
      const gradientPaint = {
        opacity: 0.5,
        blendMode: 'NORMAL' as const,
        type: 'GRADIENT_LINEAR' as const,
        gradientHandlePositions: [
          { x: 0.0, y: 0.5 },
          { x: 1.0, y: 0.5 },
          { x: 0.0, y: 1.0 },
        ],
        gradientStops: [
          {
            color: {
              r: 1.0,
              g: 0.001220703125,
              b: 0.001220703125,
              a: 0.699999988079071,
            },
            position: 0.0,
          },
          {
            color: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            position: 1.0,
          },
        ],
      };

      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [gradientPaint, gradientPaint],
      });

      expect(instance.cssBackgroundImage()).toBe(
        'linear-gradient(90deg, rgba(255, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.5) 100%), linear-gradient(90deg, rgba(255, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.5) 100%)',
      );
    });

    it('should return url(imageRef), followed by all linear-gradients when IMAGE and multiple GRADIENT_LINEAR entries are present', () => {
      const gradientPaint = {
        opacity: 0.5,
        blendMode: 'NORMAL' as const,
        type: 'GRADIENT_LINEAR' as const,
        gradientHandlePositions: [
          { x: 0.0, y: 0.5 },
          { x: 1.0, y: 0.5 },
          { x: 0.0, y: 1.0 },
        ],
        gradientStops: [
          {
            color: {
              r: 1.0,
              g: 0.001220703125,
              b: 0.001220703125,
              a: 0.699999988079071,
            },
            position: 0.0,
          },
          {
            color: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            position: 1.0,
          },
        ],
      };

      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'IMAGE',
            scaleMode: 'FILL',
            imageRef: 'e9abc7d8f4214da74b07e487060b7246a0ab15ab',
          },
          gradientPaint,
          gradientPaint,
        ],
      });

      expect(instance.cssBackgroundImage()).toBe(
        `url(<%- i011.assets['e9abc7d8f4214da74b07e487060b7246a0ab15ab'].filePath || i011.assets['e9abc7d8f4214da74b07e487060b7246a0ab15ab'].url %>), linear-gradient(90deg, rgba(255, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.5) 100%), linear-gradient(90deg, rgba(255, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.5) 100%)`,
      );
    });
  });
});
