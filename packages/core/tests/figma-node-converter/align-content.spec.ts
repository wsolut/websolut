import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe("when 'counterAxisAlignContent' is 'AUTO' and 'layoutWrap' is not present", () => {
    it('#align_content should be blank', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        counterAxisAlignContent: 'AUTO',
      });

      expect(instance.cssAlignContent()).toBe(undefined);
    });
  });

  describe("when 'counterAxisAlignContent' is 'AUTO' and 'layoutWrap' is 'WRAP'", () => {
    it("#align_content should be 'normal'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        counterAxisAlignContent: 'AUTO',
        layoutWrap: 'WRAP',
      });

      expect(instance.cssAlignContent()).toBe('normal');
    });
  });

  describe("when 'counterAxisAlignContent' is 'SPACE_BETWEEN' and 'layoutWrap' is not present", () => {
    it('#align_content should be blank', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        counterAxisAlignContent: 'SPACE_BETWEEN',
      });

      expect(instance.cssAlignContent()).toBe(undefined);
    });
  });

  describe("when 'counterAxisAlignContent' is 'SPACE_BETWEEN' and 'layoutWrap' is 'WRAP'", () => {
    it("#align_content should be 'space-between'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        counterAxisAlignContent: 'SPACE_BETWEEN',
        layoutWrap: 'WRAP',
      });

      expect(instance.cssAlignContent()).toBe('space-between');
    });
  });
});
