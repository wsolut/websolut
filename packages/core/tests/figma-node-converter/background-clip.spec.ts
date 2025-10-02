import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';
import * as FigmaTypes from '@figma/rest-api-spec';

describe('FigmaNodeConverter', () => {
  describe('background-clip with backdrop-filter', () => {
    it('should set background-clip to padding-box when BACKGROUND_BLUR is present', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [{ type: 'BACKGROUND_BLUR', visible: true, radius: 10 }],
      });
      const style = instance.domxNodeStyle();
      expect(style.backdropFilter).toBe('blur(10px)');
      expect(style.backgroundClip).toBe('padding-box');
    });

    it('should not set background-clip when BACKGROUND_BLUR is absent', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [],
      });
      const style = instance.domxNodeStyle();
      expect(style.backdropFilter).toBeUndefined();
      expect(style.backgroundClip).toBeUndefined();
    });
  });

  describe('background-clip for gradient text', () => {
    const linearGradient: FigmaTypes.GradientPaint = {
      opacity: 1,
      blendMode: 'NORMAL',
      type: 'GRADIENT_LINEAR',
      gradientHandlePositions: [
        { x: 0.0, y: 0.5 },
        { x: 1.0, y: 0.5 },
        { x: 0.0, y: 1.0 },
      ],
      gradientStops: [
        { color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
        { color: { r: 0, g: 0, b: 1, a: 1 }, position: 1 },
      ],
    };

    it('sets background-clip:text for TEXT with gradient fill and exposes WebKit variant', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        fills: [linearGradient],
      });
      const style = instance.domxNodeStyle();

      expect(style.backgroundClip).toBe('text');
      expect(style.WebkitBackgroundClip).toBe('text');
    });
  });
});
