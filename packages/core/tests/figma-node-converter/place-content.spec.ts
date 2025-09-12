import * as FigmaExamples from '../support/figma-examples';
import * as FigmaTypes from '@figma/rest-api-spec';
import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter cssPlaceContent', () => {
  it("maps 'AUTO' and 'CENTER' to 'normal center'", () => {
    const inst = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
      counterAxisAlignContent: 'AUTO',
      primaryAxisAlignItems: 'CENTER',
    } as FigmaTypes.FrameNode);
    expect(inst.cssPlaceContent()).toBe('normal center');
  });

  it("maps 'SPACE_BETWEEN' and 'MIN' to 'space-between flex-start'", () => {
    const inst = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
      counterAxisAlignContent: 'SPACE_BETWEEN',
      primaryAxisAlignItems: 'MIN',
      children: [{ ...FigmaExamples.text }] as FigmaTypes.Node[],
    } as FigmaTypes.FrameNode);
    expect(inst.cssPlaceContent()).toBe('space-between flex-start');
  });

  it("uses 'center' instead of 'space-between' when only one child exists", () => {
    const inst = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
      counterAxisAlignContent: 'AUTO',
      primaryAxisAlignItems: 'SPACE_BETWEEN',
      children: [{ ...FigmaExamples.text }] as FigmaTypes.Node[],
    } as FigmaTypes.FrameNode);
    expect(inst.cssPlaceContent()).toBe('normal center');
  });

  it('returns undefined when neither part maps', () => {
    const inst = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
    } as FigmaTypes.FrameNode);
    expect(inst.cssPlaceContent()).toBeUndefined();
  });
});
