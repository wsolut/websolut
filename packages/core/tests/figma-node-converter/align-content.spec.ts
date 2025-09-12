import * as FigmaExamples from '../support/figma-examples';
import * as FigmaTypes from '@figma/rest-api-spec';
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

  describe("when 'counterAxisAlignContent' is 'MIN' and 'layoutWrap' is 'WRAP'", () => {
    it("#align_content should be 'flex-start'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        counterAxisAlignContent: 'MIN',
        layoutWrap: 'WRAP',
      } as unknown as FigmaTypes.Node);

      expect(instance.cssAlignContent()).toBe('flex-start');
    });
  });

  describe("when 'counterAxisAlignContent' is 'MAX' and 'layoutWrap' is 'WRAP'", () => {
    it("#align_content should be 'flex-end'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        counterAxisAlignContent: 'MAX',
        layoutWrap: 'WRAP',
      } as unknown as FigmaTypes.Node);

      expect(instance.cssAlignContent()).toBe('flex-end');
    });
  });

  describe("when 'counterAxisAlignContent' is 'CENTER' and 'layoutWrap' is 'WRAP'", () => {
    it("#align_content should be 'center'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        counterAxisAlignContent: 'CENTER',
        layoutWrap: 'WRAP',
      } as unknown as FigmaTypes.Node);

      expect(instance.cssAlignContent()).toBe('center');
    });
  });
});
