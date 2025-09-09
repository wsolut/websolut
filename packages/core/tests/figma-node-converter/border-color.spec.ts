import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssBorderColor', () => {
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
  });
});
