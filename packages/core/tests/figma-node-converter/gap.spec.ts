import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#cssGap', () => {
    it("should be 'itemSpacing'px when 'itemSpacing' is present and 'counterAxisSpacing' is nil", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        itemSpacing: 100.5678,
        counterAxisSpacing: undefined,
      });
      expect(instance.cssGap()).toBe('100.57px');
    });

    it("should be 'counterAxisSpacing'px when 'itemSpacing' is nil and 'counterAxisSpacing' is present", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        itemSpacing: undefined,
        counterAxisSpacing: 100,
      });
      expect(instance.cssGap()).toBe('100px');
    });

    it("should be '0px 100px' when 'itemSpacing' is 0 and 'counterAxisSpacing' is present", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        itemSpacing: 0,
        counterAxisSpacing: 100,
      });
      expect(instance.cssGap()).toBe('100px 0px');
    });

    it("should be '100px 0px' when 'itemSpacing' is present and 'counterAxisSpacing' is 0", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        itemSpacing: 100,
        counterAxisSpacing: 0,
      });
      expect(instance.cssGap()).toBe('0px 100px');
    });

    it("should be '' when both 'counterAxisSpacing' and 'itemSpacing' are nil", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        itemSpacing: undefined,
        counterAxisSpacing: undefined,
      });
      expect(instance.cssGap()).toBe(undefined);
    });
  });
});
