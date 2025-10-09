import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#convert', () => {
  describe("when figma node's name is 'figma parent!::placeholder'", () => {
    it('should return undefined', () => {
      const parent = FigmaNodeConverter.create({ ...FigmaExamples.frame });
      const instance = FigmaNodeConverter.create(
        {
          ...FigmaExamples.text,
          name: 'figma parent!::placeholder',
          characters: 'hello world',
        },
        parent,
      );
      parent.children.push(instance);

      expect(instance.domxNode).toBeUndefined();
    });
  });
});
