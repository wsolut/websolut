import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe("when 'style.textAlignHorizontal' is 'LEFT'", () => {
    it("#text_align should be 'left'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { textAlignHorizontal: 'LEFT' },
      });
      expect(instance.cssTextAlign()).toBe('left');
    });
  });

  describe("when 'style.textAlignHorizontal' is 'RIGHT'", () => {
    it("#text_align should be 'right'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { textAlignHorizontal: 'RIGHT' },
      });
      expect(instance.cssTextAlign()).toBe('right');
    });
  });

  describe("when 'style.textAlignHorizontal' is 'CENTER'", () => {
    it("#text_align should be 'center'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { textAlignHorizontal: 'CENTER' },
      });
      expect(instance.cssTextAlign()).toBe('center');
    });
  });
});
