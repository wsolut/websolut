import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssGridTemplateRows', () => {
  describe('when gridRowsSizing is defined', () => {
    it('should return gridRowsSizing', () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });

      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          gridRowsSizing: 'repeat(4, minmax(0, 1fr))',
        },
        parent,
      );
      parent.children.push(instance);

      expect(instance.cssGridTemplateRows()).toBe('repeat(4, minmax(0, 1fr))');
    });
  });

  describe('when gridColumnsSizing is not defined but gridColumnCount is', () => {
    it('should return repeat(gridColumnCount, 1fr)', () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });

      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.frame,
          gridRowCount: 3,
        },
        parent,
      );
      parent.children.push(instance);

      expect(instance.cssGridTemplateRows()).toBe('repeat(3, minmax(0, 1fr))');
    });
  });
});
