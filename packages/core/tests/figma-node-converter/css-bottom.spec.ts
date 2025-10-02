import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#cssBottom', () => {
  it('should return 609px when position is fixed, constraints vertical is BOTTOM and relativeTransform is [[1, ~0, 462], [~0, 1, 609]]', () => {
    const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.frame,
        isFixed: true,
        constraints: {
          vertical: 'BOTTOM',
          horizontal: 'LEFT',
        },
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      },
      parent,
    );
    parent.children.push(instance);
    expect(instance.cssBottom()).toBe('609px');
  });

  it('should return 0px when position is fixed, constraints vertical is BOTTOM and relativeTransform is [[1, ~0, 462], [0, 1, 609]]', () => {
    const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.frame,
        isFixed: true,
        constraints: {
          vertical: 'BOTTOM',
          horizontal: 'LEFT',
        },
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [0, 1.0, 609.0],
        ],
      },
      parent,
    );
    parent.children.push(instance);
    expect(instance.cssBottom()).toBe('0px');
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
    expect(instance.cssBottom()).toBe(undefined);
  });

  it('should return the top value when constrains vertical is TOP_BOTTOM', () => {
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
          vertical: 'TOP_BOTTOM',
          horizontal: 'LEFT',
        },
        relativeTransform: [
          [1.0, 6.695353402725896e-17, 462.0],
          [-6.695353402725896e-17, 1.0, 609.0],
        ],
      },
      frameParent,
    );
    frameParent.children.push(instance);
    expect(instance.cssBottom()).toBe('609px');
  });

  it('should be blank when position is blank and relativeTransform is set', () => {
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
    expect(instance.cssBottom()).toBe(undefined);
  });
});
