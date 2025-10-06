import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#cssBackgroundImage', () => {
  it('should be undefined for single-stop radial gradient', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      fills: [
        {
          type: 'GRADIENT_RADIAL',
          blendMode: 'NORMAL',
          gradientHandlePositions: [
            { x: 0.5, y: 0.5 },
            { x: 1.0, y: 0.5 },
            { x: 0.5, y: 1.0 },
          ],
          gradientStops: [{ color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 }],
        },
      ],
    });
    expect(instance.cssBackgroundImage()).toBeUndefined();
  });

  it('should emit radial-gradient with stops and center when 2+ stops', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      fills: [
        {
          type: 'GRADIENT_RADIAL',
          opacity: 0.5,
          blendMode: 'OVERLAY',
          gradientHandlePositions: [
            { x: 0.25, y: 0.75 },
            { x: 1.0, y: 0.5 },
            { x: 0.5, y: 1.0 },
          ],
          gradientStops: [
            { color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
            { color: { r: 0, g: 0, b: 0, a: 1 }, position: 1 },
          ],
        },
      ],
    });
    const img = instance.cssBackgroundImage();
    expect(img).toMatch(/^radial-gradient\(/);
    expect(img).toContain('at 25% 75%');
    expect(img).toContain('rgba(');

    const blend = instance.cssBackgroundBlendMode();
    expect(blend).toBe('overlay');
  });

  it('should append to background-image alongside image and linear-gradient layers', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      fills: [
        {
          type: 'IMAGE',
          blendMode: 'NORMAL',
          scaleMode: 'FILL',
          imageRef: 'img1',
        },
        {
          type: 'GRADIENT_LINEAR',
          blendMode: 'NORMAL',
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
        {
          type: 'GRADIENT_RADIAL',
          blendMode: 'COLOR_DODGE',
          gradientHandlePositions: [
            { x: 0.5, y: 0.5 },
            { x: 1.0, y: 0.5 },
            { x: 0.5, y: 1.0 },
          ],
          gradientStops: [
            { color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
            { color: { r: 0, g: 0, b: 0, a: 1 }, position: 1 },
          ],
        },
      ],
    });

    const img = instance.cssBackgroundImage();
    expect(img).toMatch(
      /^url\(|^url\(.*\),\s*linear-gradient\(.*\),\s*radial-gradient\(/,
    );

    const blend = instance.cssBackgroundBlendMode();
    expect(blend).toBe('normal, normal, color-dodge');
  });
});
