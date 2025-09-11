import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#cssPosition', () => {
    describe("when parent.type is 'SECTION'", () => {
      it("should be 'absolute'", () => {
        const instance = FigmaNodeConverter.create(
          { ...FigmaExamples.frame },
          FigmaNodeConverter.create({
            ...FigmaExamples.section,
          }),
        );
        expect(instance.cssPosition()).toBe('absolute');
      });
    });

    describe("when parent.type is 'GROUP'", () => {
      it("should be 'absolute'", () => {
        const instance = FigmaNodeConverter.create(
          { ...FigmaExamples.frame },
          FigmaNodeConverter.create({
            ...FigmaExamples.group,
          }),
        );
        expect(instance.cssPosition()).toBe('absolute');
      });
    });

    describe("when parent.layoutMode is 'NONE'", () => {
      it("should be 'absolute'", () => {
        const instance = FigmaNodeConverter.create(
          { ...FigmaExamples.frame },
          FigmaNodeConverter.create({
            ...FigmaExamples.frame,
            layoutMode: 'NONE',
          }),
        );
        expect(instance.cssPosition()).toBe('absolute');
      });
    });

    describe("when layoutMode is 'VERTICAL'", () => {
      it('should be blank', () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          layoutMode: 'VERTICAL',
        });
        expect(instance.cssPosition()).toBe(undefined);
      });
    });

    describe('when parent.layoutMode is not present', () => {
      it('should be blank', () => {
        const instance = FigmaNodeConverter.create(
          { ...FigmaExamples.frame },
          FigmaNodeConverter.create({
            ...FigmaExamples.frame,
          }),
        );
        expect(instance.cssPosition()).toBe(undefined);
      });
    });

    describe("when 'isFixed' is 'true'", () => {
      it("should be 'fixed'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          isFixed: true,
        });
        expect(instance.cssPosition()).toBe('fixed');
      });
    });

    describe("when 'layoutPositioning' is 'ABSOLUTE'", () => {
      it("should be 'absolute'", () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          layoutPositioning: 'ABSOLUTE',
        });
        expect(instance.cssPosition()).toBe('absolute');
      });
    });

    describe("when a child has 'layoutPositioning' is 'ABSOLUTE'", () => {
      it("should be 'relative'", () => {
        const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
        const instance = FigmaNodeConverter.create(
          {
            ...FigmaExamples.frame,
            layoutPositioning: 'ABSOLUTE',
          },
          parent,
        );
        parent.children.push(instance);

        expect(parent.cssPosition()).toBe('relative');
      });
    });
  });
});
