import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

// Helper to create a simple container with two absolutely positioned children
function makeParentWithChildren(children: any[]) {
  const parent = FigmaNodeConverter.create({
    ...FigmaExamples.frame,
    layoutMode: 'VERTICAL',
  });
  const instances = children.map((c) =>
    FigmaNodeConverter.create(
      c as unknown as typeof FigmaExamples.frame,
      parent,
    ),
  );
  parent.children.push(...instances);
  return { parent, instances };
}

describe('NodeWrapper', () => {
  describe('z-index for positioned nodes', () => {
    it('assigns z-index based on sibling order for absolute nodes', () => {
      const { instances } = makeParentWithChildren([
        { ...FigmaExamples.frame, layoutPositioning: 'ABSOLUTE' },
        { ...FigmaExamples.frame, layoutPositioning: 'ABSOLUTE' },
        { ...FigmaExamples.frame }, // not positioned -> no zIndex
        { ...FigmaExamples.frame, layoutPositioning: 'ABSOLUTE' },
      ]);

      expect(instances[0].cssZIndex()).toBe('1');
      expect(instances[1].cssZIndex()).toBe('2');
      expect(instances[2].cssZIndex()).toBeUndefined();
      expect(instances[3].cssZIndex()).toBe('4');
    });

    it('assigns z-index for fixed nodes as well', () => {
      const { instances } = makeParentWithChildren([
        { ...FigmaExamples.frame, isFixed: true },
        { ...FigmaExamples.frame, isFixed: true },
      ]);

      expect(instances[0].cssZIndex()).toBe('1');
      expect(instances[1].cssZIndex()).toBe('2');
    });
  });
});
