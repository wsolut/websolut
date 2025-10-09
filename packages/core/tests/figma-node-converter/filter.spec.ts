import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('filter (LAYER_BLUR)', () => {
    it('should output filter: blur(px) for single LAYER_BLUR', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [{ type: 'LAYER_BLUR', visible: true, radius: 12 }],
      });
      const style = instance.domxNodeStyle();
      expect(style.filter).toBe('blur(12px)');
      expect(style['-webkit-filter']).toBe(style.filter);
    });

    it('should combine multiple LAYER_BLUR with spaces', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [
          { type: 'LAYER_BLUR', visible: true, radius: 2 },
          { type: 'LAYER_BLUR', visible: true, radius: 6 },
        ],
      });
      const style = instance.domxNodeStyle();
      expect(style.filter).toBe('blur(2px) blur(6px)');
      expect(style['-webkit-filter']).toBe(style.filter);
    });

    it('should not output filter when no LAYER_BLUR is present', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [],
      });
      const style = instance.domxNodeStyle();
      expect(style.filter).toBeUndefined();
      expect(style['-webkit-filter']).toBeUndefined();
    });
  });
});
