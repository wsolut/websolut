import * as FigmaExamples from '../support/figma-examples';
import * as FigmaTypes from '@figma/rest-api-spec';
import { expect, it, describe } from 'vitest';
import { FigmaNodeConverter } from '../../src/figma-node-converter';

describe('NodeWrapper', () => {
  describe('#cssMarginBottom', () => {
    it("returns '{px}' when paragraphSpacing is set and a following TEXT sibling exists", () => {
      const frame = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        children: [
          {
            ...FigmaExamples.text,
            id: '4:1',
            name: '<p> first',
            style: { paragraphSpacing: 12 },
          } as FigmaTypes.TextNode,
          {
            ...FigmaExamples.text,
            id: '4:2',
            name: '<p> second',
          } as FigmaTypes.TextNode,
        ],
      } as FigmaTypes.FrameNode);

      const [first] = frame.children;
      expect(first.cssMarginBottom()).toBe('12px');
    });

    it('returns undefined when paragraphSpacing is 0 or missing', () => {
      const a = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: { paragraphSpacing: 0 },
      });
      expect(a.cssMarginBottom()).toBeUndefined();

      const b = FigmaNodeConverter.create({
        ...FigmaExamples.text,
        style: {},
      });
      expect(b.cssMarginBottom()).toBeUndefined();
    });

    it('applies margin-bottom only when there is a following TEXT sibling', () => {
      const frame = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        children: [
          {
            ...FigmaExamples.text,
            id: '1:1',
            name: '<p> first',
            style: { paragraphSpacing: 8 },
          } as FigmaTypes.TextNode,
          {
            ...FigmaExamples.text,
            id: '1:2',
            name: '<p> second',
            style: { paragraphSpacing: 8 },
          } as FigmaTypes.TextNode,
        ],
      } as FigmaTypes.FrameNode);

      const [first, second] = frame.children;
      expect(first.cssMarginBottom()).toBe('8px');
      expect(second.cssMarginBottom()).toBeUndefined();
    });

    it('does not apply margin-bottom if it is the only TEXT child', () => {
      const frame = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        children: [
          {
            ...FigmaExamples.text,
            id: '2:1',
            name: '<p> only',
            style: { paragraphSpacing: 10 },
          } as FigmaTypes.TextNode,
        ],
      } as FigmaTypes.FrameNode);

      const [only] = frame.children;
      expect(only.cssMarginBottom()).toBeUndefined();
    });

    it('ignores non-TEXT next sibling for guard (no margin when no TEXT after)', () => {
      const frame = FigmaNodeConverter.create({
        ...FigmaExamples.frame,
        children: [
          {
            ...FigmaExamples.text,
            id: '3:1',
            name: '<p> first',
            style: { paragraphSpacing: 6 },
          } as FigmaTypes.TextNode,
          {
            ...FigmaExamples.frame,
            id: '3:2',
            name: '<div> non-text sibling',
          } as FigmaTypes.FrameNode,
        ],
      } as FigmaTypes.FrameNode);

      const [first] = frame.children;
      expect(first.cssMarginBottom()).toBeUndefined();
    });
  });
});
