import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('blurs', () => {
    it('should output filter: blur(px) for LAYER_BLUR', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [
          {
            type: 'LAYER_BLUR',
            visible: true,
            radius: 6,
          },
        ],
      });
      expect(instance.domxNodeStyle().filter).toBe('blur(6px)');
    });

    it('should combine multiple LAYER_BLUR effects space-separated', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [
          { type: 'LAYER_BLUR', visible: true, radius: 2 },
          { type: 'LAYER_BLUR', visible: true, radius: 4 },
        ],
      });
      expect(instance.domxNodeStyle().filter).toBe('blur(2px) blur(4px)');
    });

    it('should output backdrop-filter: blur(px) for BACKGROUND_BLUR', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [
          {
            type: 'BACKGROUND_BLUR',
            visible: true,
            radius: 8,
          },
        ],
      });
      const style = instance.domxNodeStyle();
      expect(style['backdrop-filter']).toBe('blur(8px)');
      expect(style['background-clip']).toBe('padding-box');
      // WebKit prefix should mirror standard property
      expect(style['-webkit-backdrop-filter']).toBe(style['backdrop-filter']);
    });

    it('should combine multiple BACKGROUND_BLUR effects space-separated', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [
          { type: 'BACKGROUND_BLUR', visible: true, radius: 3 },
          { type: 'BACKGROUND_BLUR', visible: true, radius: 5 },
        ],
      });
      const style = instance.domxNodeStyle();
      expect(style['backdrop-filter']).toBe('blur(3px) blur(5px)');
      // WebKit prefix should mirror standard property
      expect(style['-webkit-backdrop-filter']).toBe(style['backdrop-filter']);
    });

    it('should not output filters when no blur effects', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [],
      });
      const style = instance.domxNodeStyle();
      expect(style.filter).toBeUndefined();
      expect(style['backdrop-filter']).toBeUndefined();
    });
  });
});
