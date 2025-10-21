import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper#cssLeft', () => {
  it('should return 462px when position is fixed and relativeTransform is [[1, ~0, 462], [~0, 1, 609]]', () => {
    const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.frame,
        isFixed: true,
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      },
      parent,
    );
    parent.children.push(instance);
    expect(instance.cssLeft()).toBe('462px');
  });

  it('should return 0px when position is fixed and relativeTransform is [[0, ~0, 462], [~0, 1, 609]]', () => {
    const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.frame,
        isFixed: true,
        relativeTransform: [
          [0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      },
      parent,
    );
    parent.children.push(instance);
    expect(instance.cssLeft()).toBe('0px');
  });

  it('should return 462px when layoutPositioning is ABSOLUTE and relativeTransform is set', () => {
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
    expect(instance.cssLeft()).toBe('462px');
  });

  it('should be undefined when layoutPositioning is not present and relativeTransform is set', () => {
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
    expect(instance.cssLeft()).toBeUndefined();
  });

  it('should return 150 - 146 = 4px when is rotated', () => {
    const canvasParent = FigmaNodeConverter.create({
      ...FigmaExamples.canvas,
    });
    const frameParent = FigmaNodeConverter.create(
      {
        ...FigmaExamples.frame,
        absoluteBoundingBox: {
          x: 146,
          y: 425,
          width: 38,
          height: 9,
        },
      },
      canvasParent,
    );
    canvasParent.children.push(frameParent);

    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.frame,
        layoutPositioning: 'ABSOLUTE',
        absoluteBoundingBox: {
          x: 150,
          y: 425,
          width: 30,
          height: 9,
        },
        rotation: 15,
      },
      frameParent,
    );
    frameParent.children.push(instance);
    expect(instance.cssLeft()).toBe('4px');
  });

  it('should return 150 - 146 = 4px when is node is considered an img', () => {
    const canvasParent = FigmaNodeConverter.create({
      ...FigmaExamples.canvas,
    });
    const frameParent = FigmaNodeConverter.create(
      {
        ...FigmaExamples.frame,
        absoluteBoundingBox: {
          x: 146,
          y: 425,
          width: 38,
          height: 9,
        },
      },
      canvasParent,
    );
    canvasParent.children.push(frameParent);

    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.vector,
        absoluteBoundingBox: {
          x: 150,
          y: 425,
          width: 30,
          height: 9,
        },
      },
      frameParent,
    );
    frameParent.children.push(instance);
    expect(instance.cssLeft()).toBe('4px');
  });
});
