import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../src/figma-node-converter';
import * as FigmaExamples from './support/figma-examples';

describe('FigmaNodeConverter', () => {
  describe('Does not allow the constructor to be used directly', () => {
    it('should throw an error when trying to instantiate directly', () => {
      expect(() => new FigmaNodeConverter()).toThrow(
        'FigmaNodeConverter constructor should not be called directly. Use FigmaNodeConverter.create() instead.',
      );
    });
  });

  describe("when figma node's name is 'figma frame name'", () => {
    it('should not infer anything', () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          name: 'figma frame name',
        },
        parent,
      );
      parent.children.push(instance);

      expect(instance.domxNodeName()).toEqual('DIV');
      expect(instance.domxNodeAttributes()).toEqual({ id: 'i011' });
    });
  });

  describe(`when figma node's name is 'figma <frame> #name .w-100.text-danger .bg-warning [checked] [onclick="return false;"]'`, () => {
    it('should infer the domxNodeName and domxNodeAttributes', () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          name: 'figma <frame> #name .w-100.text-danger .bg-warning [checked] [onclick="return false;"]',
        },
        parent,
      );
      parent.children.push(instance);

      expect(instance.domxNodeName()).toEqual('FRAME');
      expect(instance.domxAttributesFromFigmaNodeName).toEqual({
        id: 'name',
        class: 'w-100 text-danger bg-warning',
        checked: 'checked',
        onclick: 'return false;',
      });
    });
  });

  describe("when figma node's name is 'figma <> # . []'", () => {
    it('should not infer anything', () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          name: 'figma <> # . []',
        },
        parent,
      );
      parent.children.push(instance);

      expect(instance.domxNodeName()).toEqual('DIV');
      expect(instance.domxNodeAttributes()).toEqual({ id: 'i011' });
    });
  });
});
