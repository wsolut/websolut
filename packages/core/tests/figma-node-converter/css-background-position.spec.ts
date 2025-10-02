import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#cssBackgroundPosition', () => {
  describe('when scaleMode is FIT', () => {
    it('should be center', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'IMAGE',
            scaleMode: 'FIT',
            imageRef: '',
          },
        ],
      });
      expect(instance.cssBackgroundPosition()).toBe('center');
    });
  });

  describe('when scaleMode is FILL', () => {
    it('should be center', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'IMAGE',
            scaleMode: 'FILL',
            imageRef: '',
          },
        ],
      });
      expect(instance.cssBackgroundPosition()).toBe('center');
    });
  });

  describe('when scaleMode is TILE', () => {
    it('should be center', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'IMAGE',
            scaleMode: 'TILE',
            imageRef: '',
          },
        ],
      });
      expect(instance.cssBackgroundPosition()).toBe('0 0');
    });
  });

  describe('when there are multiple IMAGE fills', () => {
    it('should return comma-separated positions matching each fill scaleMode', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        fills: [
          {
            blendMode: 'NORMAL',
            type: 'IMAGE',
            scaleMode: 'FIT',
            imageRef: '',
          },
          {
            blendMode: 'NORMAL',
            type: 'IMAGE',
            scaleMode: 'TILE',
            imageRef: '',
          },
          {
            blendMode: 'NORMAL',
            type: 'IMAGE',
            scaleMode: 'FILL',
            imageRef: '',
          },
        ],
      });
      expect(instance.cssBackgroundPosition()).toBe('center, 0 0, center');
    });
  });
});
