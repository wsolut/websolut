import * as FigmaExamples from '../support/figma-examples';
import * as FigmaTypes from '@figma/rest-api-spec';
import { describe, it, expect } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('FigmaNodeConverter cssPlaceItems', () => {
  it("maps MIN/CENTER to 'start center'", () => {
    const inst = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
      counterAxisAlignItems: 'MIN',
      primaryAxisAlignItems: 'CENTER',
    } as FigmaTypes.FrameNode);
    expect(inst.cssPlaceItems()).toBe('start center');
  });

  it("maps MAX/MAX to 'end end'", () => {
    const inst = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
      counterAxisAlignItems: 'MAX',
      primaryAxisAlignItems: 'MAX',
    } as FigmaTypes.FrameNode);
    expect(inst.cssPlaceItems()).toBe('end end');
  });

  it("maps BASELINE/CENTER to 'baseline center'", () => {
    const inst = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
      counterAxisAlignItems: 'BASELINE',
      primaryAxisAlignItems: 'CENTER',
    } as FigmaTypes.FrameNode);
    expect(inst.cssPlaceItems()).toBe('baseline center');
  });

  it("approximates SPACE_BETWEEN justify to 'center' for items", () => {
    const inst = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
      counterAxisAlignItems: 'CENTER',
      primaryAxisAlignItems: 'SPACE_BETWEEN',
    } as FigmaTypes.FrameNode);
    expect(inst.cssPlaceItems()).toBe('center center');
  });

  it('returns undefined when neither part maps', () => {
    const inst = FigmaNodeConverter.create({
      ...FigmaExamples.frame,
      layoutMode: 'GRID',
    } as FigmaTypes.FrameNode);
    expect(inst.cssPlaceItems()).toBeUndefined();
  });
});
