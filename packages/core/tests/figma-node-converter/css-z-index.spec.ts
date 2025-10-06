import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

// Helper to create a simple container with two absolutely positioned children
function makeParentWithChildren(children: any[], parentOverrides = {}) {
  const parent = FigmaNodeConverter.create({
    ...FigmaExamples.frame,
    layoutMode: 'VERTICAL',
    ...parentOverrides,
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

describe('FigmaNodeConverter#cssZIndex', () => {
  describe('when parent does not have itemReverseZIndex', () => {
    it('assigns z-index based on sibling order for absolute nodes', () => {
      const { instances } = makeParentWithChildren([
        {
          ...FigmaExamples.frame,
          id: 'child-1',
          layoutPositioning: 'ABSOLUTE',
        },
        {
          ...FigmaExamples.frame,
          id: 'child-2',
          layoutPositioning: 'ABSOLUTE',
        },
        { ...FigmaExamples.frame, id: 'child-3' },
        {
          ...FigmaExamples.frame,
          id: 'child-4',
          layoutPositioning: 'ABSOLUTE',
        },
      ]);

      expect(instances[0].cssZIndex()).toBe('1000');
      expect(instances[1].cssZIndex()).toBe('1001');
      expect(instances[2].cssZIndex()).toBeUndefined();
      expect(instances[3].cssZIndex()).toBe('1003');
    });
  });

  describe('when parent does not have itemReverseZIndex', () => {
    it('assigns z-index based on sibling reverse order', () => {
      const { instances } = makeParentWithChildren(
        [
          {
            ...FigmaExamples.frame,
            id: 'child-1',
            layoutPositioning: 'ABSOLUTE',
          },
          {
            ...FigmaExamples.frame,
            id: 'child-2',
            layoutPositioning: 'ABSOLUTE',
          },
          { ...FigmaExamples.frame, id: 'child-3' },
          {
            ...FigmaExamples.frame,
            id: 'child-4',
            layoutPositioning: 'ABSOLUTE',
          },
        ],
        { itemReverseZIndex: true },
      );

      expect(instances[0].cssZIndex()).toBe('1003');
      expect(instances[1].cssZIndex()).toBe('1002');
      expect(instances[2].cssZIndex()).toBe('1001');
      expect(instances[3].cssZIndex()).toBe('1000');
    });
  });
});
