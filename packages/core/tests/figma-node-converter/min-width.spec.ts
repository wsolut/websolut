import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#minWidth', () => {
    describe("when 'minWidth' is 500", () => {
      it("#minWidth should be '500px'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          minWidth: 500,
        });
        expect(instance.cssMinWidth()).toBe('500px');
      });
    });

    describe("when 'minWidth' is not present", () => {
      it('#minWidth should be blank', () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
        });
        expect(instance.cssMinWidth()).toBe(undefined);
      });
    });

    describe("when 'minWidth' is 500, 'size.x' is 560, and the parent's 'size.x' is 550", () => {
      it.skip('#minWidth should be blank', () => {
        const parent = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          size: { x: 550, y: 550 },
        });
        const instance = FigmaNodeConverter.create(
          {
            ...FigmaExamples.frame,
            minWidth: 500,
            size: { x: 560, y: 560 },
          },
          parent,
        );
        expect(instance.cssMinWidth()).toBe(undefined);
      });
    });
  });
});
