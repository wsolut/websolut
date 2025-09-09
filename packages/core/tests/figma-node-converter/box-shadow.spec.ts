import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('boxShadow', () => {
    it("should contain color, offset and blur radius for 'DROP_SHADOW'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: true,
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.25 },
            blendMode: 'NORMAL',
            offset: { x: 0.0, y: 4.0 },
            radius: 4.0,
            showShadowBehindNode: true,
          },
        ],
      });
      expect(instance.cssBoxShadow()).toContain(
        '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
      );
    });

    it("should contain color, offset and blur radius for 'INNER_SHADOW'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [
          {
            type: 'INNER_SHADOW',
            visible: true,
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.25 },
            blendMode: 'NORMAL',
            offset: { x: 0.0, y: 4.0 },
            radius: 4.0,
          },
        ],
      });
      expect(instance.cssBoxShadow()).toContain(
        '0px 4px 4px 0px rgba(0, 0, 0, 0.25) inset',
      );
    });

    it("should contain both 'INNER_SHADOW' and 'DROP_SHADOW'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [
          {
            type: 'INNER_SHADOW',
            visible: true,
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.25 },
            blendMode: 'NORMAL',
            offset: { x: 0.0, y: 4.0 },
            radius: 4.0,
          },
          {
            type: 'DROP_SHADOW',
            visible: true,
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.25 },
            blendMode: 'NORMAL',
            offset: { x: 0.0, y: 4.0 },
            radius: 4.0,
            showShadowBehindNode: true,
          },
        ],
      });
      expect(instance.cssBoxShadow()).toContain(
        '0px 4px 4px 0px rgba(0, 0, 0, 0.25), 0px 4px 4px 0px rgba(0, 0, 0, 0.25) inset',
      );
    });

    it("should be blank when no 'DROP_SHADOW' or 'INNER_SHADOW'", () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        effects: [],
      });
      expect(instance.cssBoxShadow()).toBe(undefined);
    });
  });
});
