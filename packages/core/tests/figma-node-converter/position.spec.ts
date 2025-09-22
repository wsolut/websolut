import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#cssPosition', () => {
    describe("when parent.type is 'SECTION'", () => {
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
          { ...FigmaExamples.frame },
          sectionParent,
        );
        sectionParent.children.push(instance);

        expect(instance.cssPosition()).toBe('absolute');
      });
    });

    describe("when parent.type is 'GROUP'", () => {
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
          { ...FigmaExamples.frame },
          groupParent,
        );
        groupParent.children.push(instance);

        expect(instance.cssPosition()).toBe('absolute');
      });
    });

    describe("when parent.layoutMode is 'NONE'", () => {
      it("should be 'absolute'", () => {
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

        expect(instance.cssPosition()).toBe('absolute');
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
      it("should be 'absolute'", () => {
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

        expect(instance.cssPosition()).toBe('absolute');
      });
    });

    describe("when 'isFixed' is 'true'", () => {
      it("should be 'fixed'", () => {
        const canvasParent = FigmaNodeConverter.create({
          ...FigmaExamples.canvas,
        });
        const frameParent = FigmaNodeConverter.create(
          { ...FigmaExamples.frame, layoutMode: 'GRID' },
          canvasParent,
        );
        canvasParent.children.push(frameParent);
        const instance = FigmaNodeConverter.create(
          { ...FigmaExamples.frame, isFixed: true },
          frameParent,
        );
        frameParent.children.push(instance);

        expect(instance.cssPosition()).toBe('fixed');
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
});
