import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssBorderStyle', () => {
    it("should be 'solid' when strokes has SOLID and strokeWeight is present", () => {
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
        strokeWeight: 1,
      });
      expect(instance.cssBorderStyle()).toBe('solid');
    });

    it("should be 'solid' when strokes does not have SOLID and strokeWeight is present", () => {
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
        strokeWeight: 1,
      });
      expect(instance.cssBorderStyle()).toBe('solid');
    });

    it('should be blank when strokes has SOLID and strokeWeight is missing', () => {
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
      expect(instance.cssBorderStyle()).toBe(undefined);
    });

    it("should be 'dashed' when strokes has SOLID, strokeWeight is present and strokeDashes is also present", () => {
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
        strokeWeight: 1,
        strokeDashes: [2, 2],
      });
      expect(instance.cssBorderStyle()).toBe('dashed');
    });
  });
});
