import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';
import * as FigmaExamples from '../support/figma-examples';

describe('FigmaNodeConverter#cssOutline', () => {
  it('should emit outline for OUTSIDE stroke alignment', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokeAlign: 'OUTSIDE',
      strokeWeight: 4,
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });
    const outline = instance.cssOutline();
    expect(outline).toBeDefined();
    expect(outline).toContain('4px');
    expect(outline).toContain('solid');
    expect(outline).toContain('rgba(');
  });

  it('should be blank for CENTER alignment', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokeAlign: 'CENTER',
      strokeWeight: 4,
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });
    expect(instance.cssOutline()).toBeUndefined();
  });

  it('should be blank for INSIDE alignment', () => {
    const instance = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      strokeAlign: 'INSIDE',
      strokeWeight: 4,
      strokes: [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });
    expect(instance.cssOutline()).toBeUndefined();
  });
});
