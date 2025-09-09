import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#minHeight', () => {
    describe("when 'minHeight' is 500", () => {
      it("#minHeight should be '500px'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          minHeight: 500,
        });
        expect(instance.cssMinHeight()).toBe('500px');
      });
    });

    describe("when 'minHeight' is not present", () => {
      it('#minHeight should be blank', () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
        });
        expect(instance.cssMinHeight()).toBe(undefined);
      });
    });
  });
});
