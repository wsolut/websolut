import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#maxWidth', () => {
    describe("when 'maxWidth' is 500", () => {
      it("#maxWidth should be '500px'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          maxWidth: 500,
        });
        expect(instance.cssMaxWidth()).toBe('500px');
      });
    });

    describe("when 'maxWidth' is not present", () => {
      it('#maxWidth should be blank', () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
        });
        expect(instance.cssMaxWidth()).toBe(undefined);
      });
    });
  });
});
