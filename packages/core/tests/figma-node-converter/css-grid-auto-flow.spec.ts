import * as FigmaExamples from '../support/figma-examples';
import * as FigmaTypes from '@figma/rest-api-spec';
import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter#cssGridAutoFlow', () => {
  it("returns 'row' when only columns are defined", () => {
    const inst = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
      gridColumnCount: 3,
      gridRowCount: undefined,
    } as FigmaTypes.FrameNode);
    expect(inst.cssGridAutoFlow()).toBe('row');
  });

  it("returns 'column' when only rows are defined", () => {
    const inst = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
      gridColumnCount: undefined,
      gridRowCount: 2,
    } as FigmaTypes.FrameNode);
    expect(inst.cssGridAutoFlow()).toBe('column');
  });

  it('returns undefined when both or neither are defined', () => {
    const both = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
      gridColumnCount: 2,
      gridRowCount: 2,
    } as FigmaTypes.FrameNode);
    expect(both.cssGridAutoFlow()).toBeUndefined();

    const neither = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
    } as FigmaTypes.FrameNode);
    expect(neither.cssGridAutoFlow()).toBeUndefined();
  });
});
