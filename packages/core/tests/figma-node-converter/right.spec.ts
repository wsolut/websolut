import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper', () => {
  describe('#cssRight', () => {
    it('should return 462px when position is fixed, constraints horizontal is RIGHT and relativeTransform is [[1, ~0, 462], [~0, 1, 609]]', () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          scrollBehavior: 'FIXED',
          constraints: {
            vertical: 'TOP',
            horizontal: 'RIGHT',
          },
          relativeTransform: [
            [1.0, 6.695353402725896e-17, 462.0],
            [-6.695353402725896e-17, 1.0, 609.0],
          ],
        },
        parent,
      );
      parent.children.push(instance);
      expect(instance.cssRight()).toBe('462px');
    });

    it('should return 0px when position is fixed, constraints horizontal is RIGHT relativeTransform is [[1, 0, 462], [~0, 1, 609]]', () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          scrollBehavior: 'FIXED',
          constraints: {
            vertical: 'TOP',
            horizontal: 'RIGHT',
          },
          relativeTransform: [
            [1.0, 0.0, 462.0],
            [-6.695353402725896e-17, 1.0, 609.0],
          ],
        },
        parent,
      );
      parent.children.push(instance);
      expect(instance.cssRight()).toBe('0px');
    });

    it('should be undefined when position is absolute and relativeTransform is set', () => {
      const canvasParent = FigmaNodeConverter.create({
        ...FigmaExamples.canvas,
      });
      const frameParent = FigmaNodeConverter.create(
        { ...FigmaExamples.frame },
        canvasParent,
      );
      canvasParent.children.push(frameParent);
      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          layoutPositioning: 'ABSOLUTE',
          relativeTransform: [
            [1.0, 6.695353402725896e-17, 462.0],
            [-6.695353402725896e-17, 1.0, 609.0],
          ],
        },
        frameParent,
      );
      frameParent.children.push(instance);
      expect(instance.cssRight()).toBe(undefined);
    });

    it('should return the left value when constrains horizontal is LEFT_RIGHT', () => {
      const canvasParent = FigmaNodeConverter.create({
        ...FigmaExamples.canvas,
      });
      const frameParent = FigmaNodeConverter.create(
        { ...FigmaExamples.frame },
        canvasParent,
      );
      canvasParent.children.push(frameParent);
      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          layoutPositioning: 'ABSOLUTE',
          constraints: {
            vertical: 'TOP',
            horizontal: 'LEFT_RIGHT',
          },
          relativeTransform: [
            [1.0, 6.695353402725896e-17, 462.0],
            [-6.695353402725896e-17, 1.0, 609.0],
          ],
        },
        frameParent,
      );
      frameParent.children.push(instance);
      expect(instance.cssRight()).toBe('462px');
    });

    it('should be undefined when position is blank and relativeTransform is set', () => {
      const canvasParent = FigmaNodeConverter.create({
        ...FigmaExamples.canvas,
      });
      const frameParent = FigmaNodeConverter.create(
        { ...FigmaExamples.frame, layoutMode: 'GRID' },
        canvasParent,
      );
      canvasParent.children.push(frameParent);
      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          relativeTransform: [
            [1.0, 6.695353402725896e-17, 462.0],
            [-6.695353402725896e-17, 1.0, 609.0],
          ],
        },
        frameParent,
      );
      frameParent.children.push(instance);
      expect(instance.cssRight()).toBeUndefined();
    });
  });
});
