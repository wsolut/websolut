import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssBackgroundColor', () => {
    it('should be correct when fills contains a solid color', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            color: { r: 1, g: 0, b: 0, a: 1 },
          },
        ],
      });
      expect(instance.cssBackgroundColor()).toBe('rgba(255, 0, 0, 1)');
    });
  });

  describe('when data has backgroundColor attributes a background color entry and a SOLID fills entry', () => {
    it('#background_color have the SOLID fills color', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        backgroundColor: { r: 0.0, g: 0.0, b: 0.0, a: 0.1 },
        background: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.2 },
          },
        ],
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.3 },
          },
        ],
      });
      expect(instance.cssBackgroundColor()).toBe('rgba(0, 0, 0, 0.3)');
    });
  });

  describe('when data has background color entry and a SOLID fills entry', () => {
    it('#background_color have the SOLID fills color', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        background: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.2 },
          },
        ],
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.3 },
          },
        ],
      });
      expect(instance.cssBackgroundColor()).toBe('rgba(0, 0, 0, 0.3)');
    });
  });

  describe('when data has a GRADIENT_LINEAR entry with only one stop', () => {
    it('should the rgba color (multiplied by opacity) of that single stop', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'GRADIENT_LINEAR',
            opacity: 0.5,
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
      expect(instance.cssBackgroundColor()).toBe('rgba(255, 0, 0, 0.35)');
    });
  });

  describe('when fills has multiple entries', () => {
    it('uses the last visible SOLID color', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            color: { r: 1, g: 0, b: 0, a: 1 }, // red
          },
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            color: { r: 0, g: 1, b: 0, a: 0.5 }, // green 50%
          },
        ],
      });
      expect(instance.cssBackgroundColor()).toBe('rgba(0, 255, 0, 0.5)');
    });

    it('skips invisible paints when choosing color', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            color: { r: 1, g: 0, b: 0, a: 1 }, // red
          },
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            visible: false,
            color: { r: 0, g: 1, b: 0, a: 1 }, // green (invisible)
          },
        ],
      });
      expect(instance.cssBackgroundColor()).toBe('rgba(255, 0, 0, 1)');
    });

    it('ignores multi-stop gradients for backgroundColor (no solid fallback) and selects prior solid', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'GRADIENT_LINEAR',
            opacity: 0.5,
            gradientHandlePositions: [
              { x: 0.0, y: 0.5 },
              { x: 1.0, y: 0.5 },
              { x: 0.0, y: 1.0 },
            ],
            gradientStops: [
              {
                color: { r: 1, g: 0, b: 0, a: 0.5 }, // red 50%
                position: 0,
              },
            ],
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
              { color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
              { color: { r: 0, g: 1, b: 0, a: 1 }, position: 1 },
            ],
          },
        ],
      });
      expect(instance.cssBackgroundColor()).toBe('rgba(255, 0, 0, 0.25)');
    });
  });

  describe('when data has a SOLID fills entry and no background entry', () => {
    it('#background_color have the SOLID fills color', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.3 },
          },
        ],
      });
      expect(instance.cssBackgroundColor()).toBe('rgba(0, 0, 0, 0.3)');
    });

    it('#background_color alpha must be multiplied with the SOLID fills opacity', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            opacity: 0.5,
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.3 },
          },
        ],
      });
      expect(instance.cssBackgroundColor()).toBe('rgba(0, 0, 0, 0.15)');
    });

    it('should return undefined when the SOLID fills color is not visible', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            visible: false,
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.3 },
          },
        ],
      });
      expect(instance.cssBackgroundColor()).toBeUndefined();
    });
  });

  describe('when data has fills with no SOLID entry', () => {
    it('#background_color should be empty', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            type: 'IMAGE',
            scaleMode: 'FILL',
            imageRef: '666',
            blendMode: 'NORMAL',
          },
        ],
      });
      expect(instance.cssBackgroundColor()).toBe(undefined);
    });
  });

  describe('when data is a text node and there is a SOLID fills entry', () => {
    it('#background_color should not be populated', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        type: 'TEXT',
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            color: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          },
        ],
      });
      expect(instance.cssBackgroundColor()).toBe(undefined);
    });
  });
});
