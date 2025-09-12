import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#cssWhiteSpace', () => {
    it("returns 'pre-wrap' when characters contain newlines", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        characters: 'Line 1\nLine 2',
      });
      expect(instance.cssWhiteSpace()).toBe('pre-wrap');
    });

    it("returns 'pre-wrap' when characters contain double spaces", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        characters: 'Hello  world',
      });
      expect(instance.cssWhiteSpace()).toBe('pre-wrap');
    });

    it('returns undefined when plain single-space text', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        characters: 'Hello world',
      });
      expect(instance.cssWhiteSpace()).toBeUndefined();
    });
  });
});
