import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssMixBlendMode', () => {
  describe("when 'blendMode' is LINEAR_DODGE", () => {
    it('should be linear-dodge', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        blendMode: 'LINEAR_DODGE',
      });
      expect(instance.cssMixBlendMode()).toBe('linear-dodge');
    });
  });

  describe("when 'blendMode' is PASS_THROUGH", () => {
    it('should be undefined', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        blendMode: 'PASS_THROUGH',
      });
      expect(instance.cssMixBlendMode()).toBeUndefined();
    });
  });

  describe("when 'blendMode' is NORMAL", () => {
    it('should be undefined', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        blendMode: 'NORMAL',
      });
      expect(instance.cssMixBlendMode()).toBeUndefined();
    });
  });
});
