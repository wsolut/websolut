import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssGridTemplateColumns', () => {
  describe('when gridColumnsSizing is defined', () => {
    it('should return gridColumnsSizing', () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });

      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          gridColumnsSizing: 'repeat(2, minmax(0, 1fr))',
        },
        parent,
      );
      parent.children.push(instance);

      expect(instance.cssGridTemplateColumns()).toBe(
        'repeat(2, minmax(0, 1fr))',
      );
    });
  });

  describe('when gridColumnsSizing is not defined but gridColumnCount is', () => {
    it('should return repeat(gridColumnCount, 1fr)', () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });

      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          gridColumnCount: 2,
        },
        parent,
      );
      parent.children.push(instance);

      expect(instance.cssGridTemplateColumns()).toBe(
        'repeat(2, minmax(0, 1fr))',
      );
    });
  });
});
