import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#height', () => {
    it('should be from size if size if present', () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });

      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          size: { x: 500.666, y: 666.666 },
        },
        parent,
      );
      parent.children.push(instance);

      expect(instance.cssHeight()).toBe('666.67px');
    });

    it('should undefined if the node is considered a body node', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        size: { x: 560, y: 560 },
      });

      expect(instance.cssHeight()).toBe(undefined);
    });

    describe("when layoutSizingVertical is 'FILL'", () => {
      it('should be 100%', () => {
        const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });

        const instance = FigmaNodeConverter.create(
          {
            ...FigmaExamples.frame,
            layoutSizingVertical: 'FILL',
          },
          parent,
        );
        parent.children.push(instance);

        expect(instance.cssHeight()).toBe('100%');
      });
    });

    describe("when layoutSizingHorizontal is 'HUG'", () => {
      it('should be undefined', () => {
        const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });

        const instance = FigmaNodeConverter.create(
          {
            ...FigmaExamples.frame,
            layoutSizingHorizontal: 'HUG',
          },
          parent,
        );
        parent.children.push(instance);

        expect(instance.cssWidth()).toBe(undefined);
      });

      it("should be 'auto' when type is 'TEXT'", () => {
        const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });

        const instance = FigmaNodeConverter.create(
          {
            ...FigmaExamples.text,
            layoutSizingVertical: 'HUG',
          },
          parent,
        );
        parent.children.push(instance);

        expect(instance.cssHeight()).toBe('auto');
      });

      it('should be from size if format in exportSettings is svg', () => {
        const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });

        const instance = FigmaNodeConverter.create(
          {
            ...FigmaExamples.frame,
            layoutSizingHorizontal: 'HUG',
            size: { x: 500.666, y: 666.666 },
            exportSettings: [
              {
                format: 'SVG',
                suffix: '',
                constraint: { type: 'SCALE', value: 1 },
              },
            ],
          },
          parent,
        );
        parent.children.push(instance);
        expect(instance.cssHeight()).toBe('666.67px');
      });
    });
  });
});
