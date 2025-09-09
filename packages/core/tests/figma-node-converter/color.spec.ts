import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('color', () => {
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
