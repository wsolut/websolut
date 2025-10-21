import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('NodeWrapper#cssTop', () => {
  it('should return 609px when position is fixed and relativeTransform is [[1, ~0, 462], [~0, 1, 609]]', () => {
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
        scrollBehavior: 'FIXED',
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      },
      frameParent,
    );
    frameParent.children.push(instance);

    expect(instance.cssTop()).toBe('609px');
  });

  it('should return 0px when position is fixed and relativeTransform is [[1, ~0, 462], [~0, 0, 609]]', () => {
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
        scrollBehavior: 'FIXED',
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 0.0, 609.0],
        ],
      },
      frameParent,
    );
    frameParent.children.push(instance);

    expect(instance.cssTop()).toBe('0px');
  });

  it('should return 609px when layoutPositioning is ABSOLUTE and parent is not root', () => {
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
        ...FigmaExamples.text,
        layoutPositioning: 'ABSOLUTE',
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      },
      frameParent,
    );
    frameParent.children.push(instance);

    expect(instance.cssTop()).toBe('609px');
  });

  it('should return 609px when layoutPositioning is undefined but parent is rootNode', () => {
    const canvasParent = FigmaNodeConverter.create({
      ...FigmaExamples.canvas,
    });
    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.frame,
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      },
      canvasParent,
    );
    canvasParent.children.push(instance);

    expect(instance.cssTop()).toBe('609px');
  });

  it('should return 150 - 146 = 4px when is rotated', () => {
    const frameParent = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      absoluteBoundingBox: {
        x: 146,
        y: 425,
        width: 38,
        height: 9,
      },
    });
    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.frame,
        absoluteBoundingBox: {
          x: 150,
          y: 429,
          width: 30,
          height: 9,
        },
        rotation: 15,
      },
      frameParent,
    );
    frameParent.children.push(instance);

    expect(instance.cssTop()).toBe('4px');
  });

  it('should return 150 - 146 = 4px when is node is considered an img', () => {
    const frameParent = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      absoluteBoundingBox: {
        x: 146,
        y: 425,
        width: 38,
        height: 9,
      },
    });
    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.vector,
        absoluteBoundingBox: {
          x: 150,
          y: 429,
          width: 30,
          height: 9,
        },
      },
      frameParent,
    );
    frameParent.children.push(instance);

    expect(instance.cssTop()).toBe('4px');
  });
});
