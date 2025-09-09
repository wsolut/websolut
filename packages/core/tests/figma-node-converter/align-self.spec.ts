import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#cssAlignSelf', () => {
    it('should be undefined', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
      });
      expect(instance.cssAlignSelf()).toBe(undefined);
    });
  });
});
