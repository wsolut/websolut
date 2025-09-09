import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#paddingTop', () => {
    it('should be 666px when paddingTop is 666', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        paddingTop: 666,
      });
      expect(instance.cssPaddingTop()).toBe('666px');
    });
  });
});
