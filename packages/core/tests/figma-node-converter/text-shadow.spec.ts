import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssTextShadow', () => {
    describe('when the node is not a text', () => {
      it('should be undefined', () => {
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

        expect(instance.cssTextShadow()).toBeUndefined();
      });
    });

    describe('when the node is a text', () => {
      it("should contain color, offset and blur radius for 'DROP_SHADOW'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.text,
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

        expect(instance.cssTextShadow()).toContain(
          '0px 4px 4px rgba(0, 0, 0, 0.25)',
        );
      });

      it("should be undefined when no 'DROP_SHADOW'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.text,
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
        expect(instance.cssTextShadow()).toBeUndefined();
      });
    });
  });
});
