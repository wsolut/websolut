import * as FigmaTypes from '@figma/rest-api-spec';

export const instance = {
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
} as FigmaTypes.InstanceNode;
