import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssPosition', () => {
  describe('when parent.type is SECTION', () => {
    describe('and instance has hovering coordinates', () => {
      it("should be 'absolute'", () => {
        const canvasParent = FigmaNodeConverter.create({
          ...FigmaExamples.canvas,
        });
        const frameAncestor = FigmaNodeConverter.create(
          { ...FigmaExamples.frame, layoutMode: 'GRID' },
          canvasParent,
        );
        canvasParent.children.push(frameAncestor);
        const sectionParent = FigmaNodeConverter.create(
          { ...FigmaExamples.section },
          frameAncestor,
        );
        frameAncestor.children.push(sectionParent);
        const instance = FigmaNodeConverter.create(
          {
            ...FigmaExamples.frame,
            relativeTransform: [
              [1.0, 6.695353402725896e-17, 462.0],
              [-6.695353402725896e-17, 1.0, 609.0],
            ],
          },
          sectionParent,
        );
        sectionParent.children.push(instance);

        expect(instance.cssPosition()).toBe('absolute');
      });
    });

    describe('and instance does not have hovering coordinates', () => {
      it('should be undefined', () => {
        const canvasParent = FigmaNodeConverter.create({
          ...FigmaExamples.canvas,
        });
        const frameAncestor = FigmaNodeConverter.create(
          { ...FigmaExamples.frame, layoutMode: 'GRID' },
          canvasParent,
        );
        canvasParent.children.push(frameAncestor);
        const sectionParent = FigmaNodeConverter.create(
          { ...FigmaExamples.section },
          frameAncestor,
        );
        frameAncestor.children.push(sectionParent);
        const instance = FigmaNodeConverter.create(
          { ...FigmaExamples.frame },
          sectionParent,
        );
        sectionParent.children.push(instance);

        expect(instance.cssPosition()).toBeUndefined();
      });
    });
  });

  describe('when parent.type is GROUP', () => {
    describe('and instance has hovering coordinates', () => {
      it("should be 'absolute'", () => {
        const canvasParent = FigmaNodeConverter.create({
          ...FigmaExamples.canvas,
        });
        const frameAncestor = FigmaNodeConverter.create(
          { ...FigmaExamples.frame, layoutMode: 'GRID' },
          canvasParent,
        );
        canvasParent.children.push(frameAncestor);
        const groupParent = FigmaNodeConverter.create(
          { ...FigmaExamples.group },
          frameAncestor,
        );
        frameAncestor.children.push(groupParent);
        const instance = FigmaNodeConverter.create(
          {
            ...FigmaExamples.frame,
            relativeTransform: [
              [1.0, 6.695353402725896e-17, 462.0],
              [-6.695353402725896e-17, 1.0, 609.0],
            ],
          },
          groupParent,
        );
        groupParent.children.push(instance);

        expect(instance.cssPosition()).toBe('absolute');
      });
    });

    describe('and instance does not have hovering coordinates', () => {
      it('should be undefined', () => {
        const canvasParent = FigmaNodeConverter.create({
          ...FigmaExamples.canvas,
        });
        const frameAncestor = FigmaNodeConverter.create(
          { ...FigmaExamples.frame, layoutMode: 'GRID' },
          canvasParent,
        );
        canvasParent.children.push(frameAncestor);
        const groupParent = FigmaNodeConverter.create(
          { ...FigmaExamples.group },
          frameAncestor,
        );
        frameAncestor.children.push(groupParent);
        const instance = FigmaNodeConverter.create(
          { ...FigmaExamples.frame },
          groupParent,
        );
        groupParent.children.push(instance);

        expect(instance.cssPosition()).toBeUndefined();
      });
    });
  });

  describe("when parent.layoutMode is 'NONE'", () => {
    describe('and instance has hovering coordinates', () => {
      it('should be absolute', () => {
        const canvasParent = FigmaNodeConverter.create({
          ...FigmaExamples.canvas,
        });
        const frameParent = FigmaNodeConverter.create(
          { ...FigmaExamples.frame, layoutMode: 'NONE' },
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

        expect(instance.cssPosition()).toBe('absolute');
      });
    });

    describe('and instance does not have hovering coordinates', () => {
      it('should be undefined', () => {
        const canvasParent = FigmaNodeConverter.create({
          ...FigmaExamples.canvas,
        });
        const frameParent = FigmaNodeConverter.create(
          { ...FigmaExamples.frame, layoutMode: 'NONE' },
          canvasParent,
        );
        canvasParent.children.push(frameParent);
        const instance = FigmaNodeConverter.create(
          { ...FigmaExamples.frame },
          frameParent,
        );
        frameParent.children.push(instance);

        expect(instance.cssPosition()).toBeUndefined();
      });
    });
  });

  describe("when layoutMode is 'VERTICAL'", () => {
    it('should be undefined', () => {
      const canvasParent = FigmaNodeConverter.create({
        ...FigmaExamples.canvas,
      });
      const frameParent = FigmaNodeConverter.create(
        { ...FigmaExamples.frame, layoutMode: 'GRID' },
        canvasParent,
      );
      canvasParent.children.push(frameParent);
      const instance = FigmaNodeConverter.create(
        { ...FigmaExamples.frame, layoutMode: 'VERTICAL' },
        frameParent,
      );
      frameParent.children.push(instance);

      expect(instance.cssPosition()).toBeUndefined();
    });
  });

  describe('when parent.layoutMode is not present', () => {
    describe('and instance has hovering coordinates', () => {
      it('should be absolute', () => {
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
            relativeTransform: [
              [1.0, 6.695353402725896e-17, 462.0],
              [-6.695353402725896e-17, 1.0, 609.0],
            ],
          },
          frameParent,
        );
        frameParent.children.push(instance);

        expect(instance.cssPosition()).toBe('absolute');
      });
    });

    describe('and instance does not have hovering coordinates', () => {
      it('should be undefined', () => {
        const canvasParent = FigmaNodeConverter.create({
          ...FigmaExamples.canvas,
        });
        const frameParent = FigmaNodeConverter.create(
          { ...FigmaExamples.frame },
          canvasParent,
        );
        canvasParent.children.push(frameParent);
        const instance = FigmaNodeConverter.create(
          { ...FigmaExamples.frame },
          frameParent,
        );
        frameParent.children.push(instance);

        expect(instance.cssPosition()).toBeUndefined();
      });
    });
  });

  describe("when 'layoutPositioning' is 'ABSOLUTE'", () => {
    it('should be absolute, when parent is not rootNode', () => {
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
          ...FigmaExamples.text,
          layoutPositioning: 'ABSOLUTE',
        },
        frameParent,
      );
      frameParent.children.push(instance);

      expect(instance.cssPosition()).toBe('absolute');
    });
  });

  describe("when 'layoutPositioning' is 'ABSOLUTE'", () => {
    it("should be 'fixed' when parent is rootNode", () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          layoutPositioning: 'ABSOLUTE',
        },
        parent,
      );
      parent.children.push(instance);

      expect(instance.cssPosition()).toBe('fixed');
    });
  });

  describe("when a child has 'layoutPositioning' is 'ABSOLUTE'", () => {
    it("should be 'relative'", () => {
      const canvasParent = FigmaNodeConverter.create({
        ...FigmaExamples.canvas,
      });
      const frameAncestor = FigmaNodeConverter.create(
        { ...FigmaExamples.frame, layoutMode: 'GRID' },
        canvasParent,
      );
      canvasParent.children.push(frameAncestor);

      const frameParent = FigmaNodeConverter.create(
        { ...FigmaExamples.frame, layoutMode: 'GRID' },
        frameAncestor,
      );
      frameAncestor.children.push(frameParent);

      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.text,
          layoutPositioning: 'ABSOLUTE',
        },
        frameParent,
      );
      frameParent.children.push(instance);

      expect(frameParent.cssPosition()).toBe('relative');
    });
  });
});
