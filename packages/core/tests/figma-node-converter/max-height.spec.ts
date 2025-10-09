import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#maxHeight', () => {
    describe("when 'maxHeight' is 500", () => {
      it("#maxHeight should be '500px'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          maxHeight: 500,
        });
        expect(instance.cssMaxHeight()).toBe('500px');
      });
    });

    describe("when 'maxHeight' is not present", () => {
      it('#maxHeight should be blank', () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
        });
        expect(instance.cssMaxHeight()).toBe(undefined);
      });
    });

    describe("when 'maxHeight' is 500, 'size.x' is 560, and the parent's 'size.x' is 550", () => {
      it.skip('#maxHeight should be blank', () => {
        const parent = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          size: { x: 550, y: 550 },
        });

        const instance = FigmaNodeConverter.create(
          {
            ...FigmaExamples.frame,
            maxHeight: 500,
            size: { x: 560, y: 560 },
          },
          parent,
        );
        expect(instance.cssMaxHeight()).toBe(undefined);
      });
    });
  });
});
