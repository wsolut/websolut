import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('background-clip with backdrop-filter', () => {
    it('should set background-clip to padding-box when BACKGROUND_BLUR is present', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [{ type: 'BACKGROUND_BLUR', visible: true, radius: 10 }],
      });
      const style = instance.domxNodeStyle();
      expect(style.backdropFilter).toBe('blur(10px)');
      expect(style.backgroundClip).toBe('padding-box');
    });

    it('should not set background-clip when BACKGROUND_BLUR is absent', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [],
      });
      const style = instance.domxNodeStyle();
      expect(style.backdropFilter).toBeUndefined();
      expect(style.backgroundClip).toBeUndefined();
    });
  });
});
