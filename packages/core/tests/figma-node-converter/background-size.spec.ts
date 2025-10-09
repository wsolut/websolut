import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssBackgroundSize', () => {
    it('should be contain when fills contains an IMAGE entry with scaleMode FIT', () => {
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
      expect(instance.cssBackgroundSize()).toBe('contain');
    });

    it('should be cover when fills contains an IMAGE entry with scaleMode FILL', () => {
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
      expect(instance.cssBackgroundSize()).toBe('cover');
    });

    it('should return comma-separated sizes for multiple IMAGE fills', () => {
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
      expect(instance.cssBackgroundSize()).toBe(
        `contain, <%- i011.assets[''].width*1 %>px <%- i011.assets[''].height*1%>px, cover`,
      );
    });
  });
});
