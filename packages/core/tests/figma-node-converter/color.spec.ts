import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaTypes from '@figma/rest-api-spec';

describe('NodeWrapper', () => {
  describe('color', () => {
    it('returns transparent for TEXT with gradient fill and sets WebKit text fill', () => {
      const gradient: FigmaTypes.GradientPaint = {
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

      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        fills: [gradient],
      });

      const style = instance.domxNodeStyle();
      expect(instance.cssColor()).toBe('transparent');
      expect(style.WebkitTextFillColor).toBe('transparent');
    });

    it("should return the SOLID fills color, when 'type' is 'TEXT' and there is a SOLID fills entry", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            color: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          },
        ],
      });
      expect(instance.cssColor()).toBe('rgba(0, 0, 0, 1)');
    });

    it('should return undefined when the SOLID fills color is not visible', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'SOLID',
            visible: false,
            color: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          },
        ],
      });
      expect(instance.cssColor()).toBeUndefined();
    });
  });
});
