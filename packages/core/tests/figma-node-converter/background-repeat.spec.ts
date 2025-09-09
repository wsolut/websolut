import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssBackgroundRepeat', () => {
    it('should be no-repeat when fills contains an IMAGE entry with scaleMode FIT', () => {
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
      expect(instance.cssBackgroundRepeat()).toBe('no-repeat');
    });

    it('should be no-repeat when fills contains an IMAGE entry with scaleMode FILL', () => {
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
      expect(instance.cssBackgroundRepeat()).toBe('no-repeat');
    });
  });
});
