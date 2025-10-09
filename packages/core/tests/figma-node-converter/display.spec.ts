import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#display', () => {
    describe('layoutMode is NONE', () => {
      it('should be undefined', () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          layoutMode: 'NONE',
        });
        expect(instance.cssDisplay()).toBeUndefined();
      });
    });

    describe('layoutMode is HORIZONTAL', () => {
      it('should be flex', () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          layoutMode: 'HORIZONTAL',
        });
        expect(instance.cssDisplay()).toBe('flex');
      });
    });

    describe('layoutMode is VERTICAL', () => {
      it('should be flex', () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          layoutMode: 'VERTICAL',
          visible: true,
        });
        expect(instance.cssDisplay()).toBe('flex');
      });
    });

    describe('layoutMode is GRID', () => {
      it('should be grid', () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          layoutMode: 'GRID',
          visible: true,
        });
        expect(instance.cssDisplay()).toBe('grid');
      });
    });

    describe('when layoutMode is present but visible is false', () => {
      it('should be none', () => {
        const instance = FigmaNodeConverter.create({
          ...FigmaExamples.frame,
          layoutMode: 'VERTICAL',
          visible: false,
        });
        expect(instance.cssDisplay()).toBe('none');
      });
    });
  });
});
