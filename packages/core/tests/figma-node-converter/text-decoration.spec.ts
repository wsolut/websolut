import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('css_properties.text_decoration', () => {
    describe("when 'style.textDecoration' is 'STRIKETHROUGH'", () => {
      it("#text_decoration should be 'line-through'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.text,
          style: { textDecoration: 'STRIKETHROUGH' },
        });
        expect(instance.cssTextDecoration()).toBe('line-through');
      });
    });
    describe("when 'style.textDecoration' is 'UNDERLINE'", () => {
      it("#text_decoration should be 'underline'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.text,
          style: { textDecoration: 'UNDERLINE' },
        });
        expect(instance.cssTextDecoration()).toBe('underline');
      });
    });
  });
});
