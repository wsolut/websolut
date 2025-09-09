import { expect, it, describe } from 'vitest';
import { safeMergeData } from '../../src/utils';

describe('saveMergeData', () => {
  it('must not forget deep nested values', () => {
    const target = {
      i427: {
        images: {
          image1: {
            href: 'image1 url',
          },
          image2: {
            href: 'image2 url',
          },
        },
      },
      i422: { text: 'test' },
      i4468: {
        assets: {
          svg1: {
            format: 'svg',
            href: 'svg1 url',
          },
          svg2: {
            format: 'svg',
            href: 'svg2 url',
          },
        },
      },
    };

    const source = {
      i427: {
        images: {
          image1: {
            local: true,
          },
          image2: {
            href: 'updated image2 url',
          },
        },
      },
      i422: { text: 'updated test' },
      i4468: {
        assets: {
          svg2: {
            href: 'updated svg2 url',
            locale: true,
          },
          svg3: {
            format: 'svg',
            href: 'svg3 url',
          },
        },
      },
    };

    safeMergeData(target, source);

    expect(target).toEqual({
      i427: {
        images: {
          image1: {
            href: 'image1 url',
            local: true,
          },
          image2: {
            href: 'updated image2 url',
          },
        },
      },
      i422: { text: 'updated test' },
      i4468: {
        assets: {
          svg1: {
            format: 'svg',
            href: 'svg1 url',
          },
          svg2: {
            format: 'svg',
            href: 'updated svg2 url',
            locale: true,
          },
          svg3: {
            format: 'svg',
            href: 'svg3 url',
          },
        },
      },
    });
  });
});
