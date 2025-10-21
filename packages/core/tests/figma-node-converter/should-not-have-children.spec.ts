import * as FigmaExamples from '../support/figma-examples';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper#shouldNotHaveChildren', () => {
  it('returns true when node is an HTML INPUT ELEMENT', () => {
    const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.frame,
        name: '<input>',
      },
      parent,
    );
    parent.children.push(instance);

    expect(instance.shouldNotHaveChildren()).toBe(true);
  });

  it('returns true when node is an HTML IMG ELEMENT', () => {
    const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.vector,
      },
      parent,
    );
    parent.children.push(instance);

    expect(instance.shouldNotHaveChildren()).toBe(true);
  });

  it('returns false otherwise', () => {
    const parent = FigmaNodeConverter.create({ ...FigmaExamples.canvas });
    const instance = FigmaNodeConverter.create(
      {
        ...FigmaExamples.frame,
      },
      parent,
    );
    parent.children.push(instance);

    expect(instance.shouldNotHaveChildren()).toBe(false);
  });
});
