import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('css_properties.text_transform', () => {
    describe("when 'style.textCase' is 'UPPER'", () => {
      it("#text_transform should be 'uppercase'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.text,
          style: { textCase: 'UPPER' },
        });
        expect(instance.cssTextTransform()).toBe('uppercase');
      });
    });
    describe("when 'style.textCase' is 'LOWER'", () => {
      it("#text_transform should be 'lowercase'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.text,
          style: { textCase: 'LOWER' },
        });
        expect(instance.cssTextTransform()).toBe('lowercase');
      });
    });
    describe("when 'style.textCase' is 'TITLE'", () => {
      it("#text_transform should be 'capitalize'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.text,
          style: { textCase: 'TITLE' },
        });
        expect(instance.cssTextTransform()).toBe('capitalize');
      });
    });
    describe("when 'style.textCase' is 'SMALL_CAPS'", () => {
      it("#text_transform should be 'lowercase'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.text,
          style: { textCase: 'SMALL_CAPS' },
        });
        expect(instance.cssTextTransform()).toBe('lowercase');
      });
    });
    describe("when 'style.textCase' is 'SMALL_CAPS_FORCED'", () => {
      it("#text_transform should be 'lowercase'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.text,
          style: { textCase: 'SMALL_CAPS_FORCED' },
        });
        expect(instance.cssTextTransform()).toBe('lowercase');
      });
    });
  });
});
