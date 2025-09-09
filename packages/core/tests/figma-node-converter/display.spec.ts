import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#display', () => {
    it('should be blank when layoutMode is NONE', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutMode: 'NONE',
      });
      expect(instance.cssDisplay()).toBeFalsy();
    });

    it('should be flex when layoutMode is HORIZONTAL', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutMode: 'HORIZONTAL',
      });
      expect(instance.cssDisplay()).toBe('flex');
    });

    it('should be flex when layoutMode is VERTICAL and visible is true', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutMode: 'VERTICAL',
        visible: true,
      });
      expect(instance.cssDisplay()).toBe('flex');
    });

    it('should be none when layoutMode is present but visible is false', () => {
      const instance = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        layoutMode: 'VERTICAL',
        visible: false,
      });
      expect(instance.cssDisplay()).toBe('none');
    });
  });
});
