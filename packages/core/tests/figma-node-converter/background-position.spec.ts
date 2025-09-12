import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssBackgroundPosition', () => {
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
  });
});
