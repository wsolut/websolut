import * as FigmaTypes from '@figma/rest-api-spec';

export const file = {
  document: {
    id: '0:0',
    name: 'Document',
    type: 'DOCUMENT',
    children: [
      {
        id: '0:1',
        name: 'Canvas 1',
        type: 'CANVAS',
        backgroundColor: {
          r: 0.5,
          g: 0.5,
          b: 0.5,
          a: 1,
        },
        prototypeStartNodeID: null,
        children: [
          {
            id: '0:1:1',
            name: '<main> .card frame 1',
            type: 'FRAME',
            children: [
              {
                id: 'I8086:488;8067:1392;8067:1625',
                name: '.rounded-image',
                type: 'INSTANCE',
                scrollBehavior: 'SCROLLS',
                componentPropertyReferences: {
                  mainComponent: 'content#8063:0',
                },
                componentId: '8067:1629',
                isExposedInstance: true,
                componentProperties: {
                  type: {
                    value: 'circle',
                    type: 'VARIANT',
                    boundVariables: {},
                  },
                  style: {
                    value: 'thin',
                    type: 'VARIANT',
                    boundVariables: {},
                  },
                },
                overrides: [
                  {
                    id: 'I8086:488;8067:1392;8067:1625',
                    overriddenFields: [
                      'bottomLeftRadius',
                      'bottomRightRadius',
                      'boundVariables',
                      'exportSettings',
                      'fills',
                      'strokes',
                      'topLeftRadius',
                      'topRightRadius',
                    ],
                  },
                ],
                children: [],
                blendMode: 'PASS_THROUGH',
                clipsContent: true,
                background: [
                  {
                    blendMode: 'NORMAL',
                    type: 'IMAGE',
                    scaleMode: 'FILL',
                    imageRef: '2f44802a1e60e100445f7065aeea100fe646b924',
                  },
                ],
                fills: [
                  {
                    blendMode: 'NORMAL',
                    type: 'IMAGE',
                    scaleMode: 'FILL',
                    imageRef: '2f44802a1e60e100445f7065aeea100fe646b924',
                  },
                ],
                strokes: [],
                cornerRadius: 24,
                cornerSmoothing: 0,
                strokeWeight: 1,
                strokeAlign: 'INSIDE',
                backgroundColor: {
                  r: 0,
                  g: 0,
                  b: 0,
                  a: 0,
                },
                strokeJoin: 'ROUND',
                absoluteBoundingBox: {
                  x: 1205,
                  y: 61,
                  width: 40,
                  height: 40,
                },
                absoluteRenderBounds: {
                  x: 1205,
                  y: 61,
                  width: 40,
                  height: 40,
                },
                constraints: {
                  vertical: 'TOP',
                  horizontal: 'LEFT',
                },
                layoutAlign: 'STRETCH',
                layoutGrow: 1,
                layoutSizingHorizontal: 'FILL',
                layoutSizingVertical: 'FILL',
                exportSettings: [
                  {
                    suffix: '',
                    format: 'PNG',
                    constraint: {
                      type: 'SCALE',
                      value: 1,
                    },
                  },
                ],
                effects: [],
                interactions: [],
              },
              {
                id: '0:1:1:2',
                name: '<p>',
                type: 'TEXT',
                characters: 'text from API',
              },
            ],
          },
          {
            id: '0:1:2',
            name: '<p> paragraph 1',
            type: 'TEXT',
            characters: 'This is a text node',
          },
        ],
      },
    ],
  },
  components: {},
  schemaVersion: 0,
  styles: {},
  name: 'Figma Test Mock',
  thumbnailUrl: '',
  lastModified: '2025-05-13T05:21:11Z',
  version: '2220025002460591090',
  role: 'editor',
} as FigmaTypes.GetFileResponse;

export const fileWithChanges = {
  document: {
    id: '0:0',
    name: 'Document',
    type: 'DOCUMENT',
    children: [
      {
        id: '0:1',
        name: 'Canvas 1',
        type: 'CANVAS',
        backgroundColor: {
          r: 0.5,
          g: 0.5,
          b: 0.5,
          a: 1,
        },
        prototypeStartNodeID: null,
        children: [
          {
            id: '0:1:1',
            name: '<main> .card frame 1',
            type: 'FRAME',
            children: [
              {
                id: '0:1:1:2',
                name: '<p>',
                type: 'TEXT',
                characters: 'updated text from API',
              },
            ],
          },
          {
            id: '0:1:2',
            name: '<p> paragraph 1',
            type: 'TEXT',
            characters: 'This is a text node',
          },
        ],
      },
    ],
  },
  components: {},
  schemaVersion: 0,
  styles: {},
  name: 'Figma Test Mock',
  thumbnailUrl: '',
  lastModified: '2025-05-13T05:21:12Z',
  version: '2220025002460591091',
  role: 'editor',
};
