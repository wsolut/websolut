import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#paddingLeft', () => {
    it('should be 666px when paddingLeft is 666', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        paddingLeft: 666,
      });
      expect(instance.cssPaddingLeft()).toBe('666px');
    });
  });
});
