import * as FigmaTypes from '@figma/rest-api-spec';

export const inputWithPlaceholder = {
  name: 'Figma Test Mock',
  role: 'editor',
  lastModified: '2025-05-13T05:21:11Z',
  editorType: 'figma',
  thumbnailUrl: '',
  version: '2220025002460591090',
  nodes: {
    '0:1': {
      document: {
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
            id: '8088:331',
            name: '<fieldset>',
            type: 'INSTANCE',
            scrollBehavior: 'SCROLLS',
            boundVariables: {
              individualStrokeWeights: {
                BORDER_TOP_WEIGHT: {
                  type: 'VARIABLE_ALIAS',
                  id: 'VariableID:2625:387',
                },
                BORDER_BOTTOM_WEIGHT: {
                  type: 'VARIABLE_ALIAS',
                  id: 'VariableID:2625:387',
                },
                BORDER_LEFT_WEIGHT: {
                  type: 'VARIABLE_ALIAS',
                  id: 'VariableID:2625:387',
                },
                BORDER_RIGHT_WEIGHT: {
                  type: 'VARIABLE_ALIAS',
                  id: 'VariableID:2625:387',
                },
              },
            },
            componentId: '8086:372',
            componentProperties: {
              'button#8086:21': {
                type: 'BOOLEAN',
                value: false,
              },
              'placeholder#8086:20': {
                type: 'TEXT',
                value: 'Singapore (SIN)',
              },
              'label#8086:22': {
                type: 'TEXT',
                value: 'From',
              },
              'icon#8086:23': {
                type: 'BOOLEAN',
                value: true,
              },
              size: {
                value: 'lg',
                type: 'VARIANT',
                boundVariables: {},
              },
            },
            overrides: [],
            children: [
              {
                id: 'I8088:331;8086:373',
                name: '<label>',
                type: 'FRAME',
                scrollBehavior: 'SCROLLS',
                boundVariables: {
                  paddingLeft: {
                    type: 'VARIABLE_ALIAS',
                    id: 'VariableID:2625:390',
                  },
                  paddingRight: {
                    type: 'VARIABLE_ALIAS',
                    id: 'VariableID:2625:390',
                  },
                  fills: [
                    {
                      type: 'VARIABLE_ALIAS',
                      id: 'VariableID:2149:2204',
                    },
                  ],
                },
                children: [
                  {
                    id: 'I8088:331;8086:374',
                    name: '<span> .label-xs',
                    type: 'TEXT',
                    scrollBehavior: 'SCROLLS',
                    componentPropertyReferences: {
                      characters: 'label#8086:22',
                    },
                    boundVariables: {
                      fills: [
                        {
                          type: 'VARIABLE_ALIAS',
                          id: 'VariableID:2169:339',
                        },
                      ],
                      lineHeight: [
                        {
                          type: 'VARIABLE_ALIAS',
                          id: 'VariableID:4006:233',
                        },
                      ],
                      letterSpacing: [
                        {
                          type: 'VARIABLE_ALIAS',
                          id: 'VariableID:4006:266',
                        },
                      ],
                      fontWeight: [
                        {
                          type: 'VARIABLE_ALIAS',
                          id: 'VariableID:2625:351',
                        },
                      ],
                      fontFamily: [
                        {
                          type: 'VARIABLE_ALIAS',
                          id: 'VariableID:2198:529',
                        },
                      ],
                      fontSize: [
                        {
                          type: 'VARIABLE_ALIAS',
                          id: 'VariableID:2625:357',
                        },
                      ],
                    },
                    blendMode: 'PASS_THROUGH',
                    fills: [
                      {
                        blendMode: 'NORMAL',
                        type: 'SOLID',
                        color: {
                          r: 0.3843137323856354,
                          g: 0.4156862795352936,
                          b: 0.5176470875740051,
                          a: 1,
                        },
                        boundVariables: {
                          color: {
                            type: 'VARIABLE_ALIAS',
                            id: 'VariableID:2169:339',
                          },
                        },
                      },
                    ],
                    fillGeometry: [],
                    strokes: [],
                    strokeWeight: 1,
                    strokeAlign: 'OUTSIDE',
                    strokeGeometry: [],
                    absoluteBoundingBox: {
                      x: 150,
                      y: 425,
                      width: 30,
                      height: 9,
                    },
                    absoluteRenderBounds: {
                      x: 151.14599609375,
                      y: 425.3240051269531,
                      width: 27.671905517578125,
                      height: 8.795989990234375,
                    },
                    constraints: {
                      vertical: 'TOP',
                      horizontal: 'LEFT',
                    },
                    relativeTransform: [
                      [1, 0, 4],
                      [0, 1, 0],
                    ],
                    size: {
                      x: 30,
                      y: 9,
                    },
                    layoutAlign: 'INHERIT',
                    layoutGrow: 0,
                    layoutSizingHorizontal: 'HUG',
                    layoutSizingVertical: 'HUG',
                    characters: 'From',
                    characterStyleOverrides: [],
                    styleOverrideTable: {},
                    lineTypes: ['NONE'],
                    lineIndentations: [0],
                    style: {
                      fontFamily: 'Public Sans',
                      fontPostScriptName: 'PublicSans-Regular',
                      fontStyle: 'Regular',
                      fontWeight: 400,
                      textAutoResize: 'WIDTH_AND_HEIGHT',
                      fontSize: 12,
                      textAlignHorizontal: 'LEFT',
                      textAlignVertical: 'CENTER',
                      letterSpacing: 0.25,
                      lineHeightPx: 9,
                      lineHeightPercent: 63.82979202270508,
                      lineHeightPercentFontSize: 75,
                      lineHeightUnit: 'PIXELS',
                    },
                    layoutVersion: 4,
                    styles: {
                      text: '2207:307',
                    },
                    effects: [],
                    interactions: [],
                  },
                ],
                blendMode: 'PASS_THROUGH',
                clipsContent: false,
                background: [
                  {
                    blendMode: 'NORMAL',
                    type: 'SOLID',
                    color: {
                      r: 1,
                      g: 1,
                      b: 1,
                      a: 1,
                    },
                    boundVariables: {
                      color: {
                        type: 'VARIABLE_ALIAS',
                        id: 'VariableID:2149:2204',
                      },
                    },
                  },
                ],
                fills: [
                  {
                    blendMode: 'NORMAL',
                    type: 'SOLID',
                    color: {
                      r: 1,
                      g: 1,
                      b: 1,
                      a: 1,
                    },
                    boundVariables: {
                      color: {
                        type: 'VARIABLE_ALIAS',
                        id: 'VariableID:2149:2204',
                      },
                    },
                  },
                ],
                strokes: [],
                strokeWeight: 1,
                strokeAlign: 'INSIDE',
                backgroundColor: {
                  r: 1,
                  g: 1,
                  b: 1,
                  a: 1,
                },
                layoutMode: 'HORIZONTAL',
                counterAxisAlignItems: 'CENTER',
                paddingLeft: 4,
                paddingRight: 4,
                layoutWrap: 'NO_WRAP',
                fillGeometry: [
                  {
                    path: 'M0 0L38 0L38 9L0 9L0 0Z',
                    windingRule: 'NONZERO',
                  },
                ],
                strokeGeometry: [],
                absoluteBoundingBox: {
                  x: 146,
                  y: 425,
                  width: 38,
                  height: 9,
                },
                absoluteRenderBounds: {
                  x: 146,
                  y: 425,
                  width: 38,
                  height: 9.1199951171875,
                },
                constraints: {
                  vertical: 'TOP',
                  horizontal: 'LEFT',
                },
                relativeTransform: [
                  [1, 0, 10],
                  [0, 1, -4.5],
                ],
                size: {
                  x: 38,
                  y: 9,
                },
                layoutAlign: 'INHERIT',
                layoutGrow: 0,
                layoutPositioning: 'ABSOLUTE',
                layoutSizingHorizontal: 'HUG',
                layoutSizingVertical: 'HUG',
                effects: [],
                interactions: [],
              },
              {
                id: 'I8088:331;10065:451',
                name: '<input> #input-from',
                type: 'FRAME',
                scrollBehavior: 'SCROLLS',
                boundVariables: {
                  paddingTop: {
                    type: 'VARIABLE_ALIAS',
                    id: 'VariableID:2625:394',
                  },
                  paddingBottom: {
                    type: 'VARIABLE_ALIAS',
                    id: 'VariableID:2625:394',
                  },
                  size: {
                    y: {
                      type: 'VARIABLE_ALIAS',
                      id: 'VariableID:2625:434',
                    },
                  },
                  rectangleCornerRadii: {
                    RECTANGLE_TOP_LEFT_CORNER_RADIUS: {
                      type: 'VARIABLE_ALIAS',
                      id: 'VariableID:2625:390',
                    },
                    RECTANGLE_TOP_RIGHT_CORNER_RADIUS: {
                      type: 'VARIABLE_ALIAS',
                      id: 'VariableID:2625:390',
                    },
                    RECTANGLE_BOTTOM_LEFT_CORNER_RADIUS: {
                      type: 'VARIABLE_ALIAS',
                      id: 'VariableID:2625:390',
                    },
                    RECTANGLE_BOTTOM_RIGHT_CORNER_RADIUS: {
                      type: 'VARIABLE_ALIAS',
                      id: 'VariableID:2625:390',
                    },
                  },
                  fills: [
                    {
                      type: 'VARIABLE_ALIAS',
                      id: 'VariableID:2149:2204',
                    },
                  ],
                  effects: [
                    {
                      type: 'VARIABLE_ALIAS',
                      id: 'VariableID:2625:387',
                    },
                    {
                      type: 'VARIABLE_ALIAS',
                      id: 'VariableID:8017:156',
                    },
                  ],
                },
                children: [
                  {
                    id: 'I8088:331;8086:377',
                    name: '#input-from!::placeholder',
                    type: 'TEXT',
                    scrollBehavior: 'SCROLLS',
                    componentPropertyReferences: {
                      characters: 'placeholder#8086:20',
                    },
                    boundVariables: {
                      fills: [
                        {
                          type: 'VARIABLE_ALIAS',
                          id: 'VariableID:2169:337',
                        },
                      ],
                      lineHeight: [
                        {
                          type: 'VARIABLE_ALIAS',
                          id: 'VariableID:4006:235',
                        },
                      ],
                      fontWeight: [
                        {
                          type: 'VARIABLE_ALIAS',
                          id: 'VariableID:2625:351',
                        },
                      ],
                      fontFamily: [
                        {
                          type: 'VARIABLE_ALIAS',
                          id: 'VariableID:2198:529',
                        },
                      ],
                      fontSize: [
                        {
                          type: 'VARIABLE_ALIAS',
                          id: 'VariableID:2625:359',
                        },
                      ],
                    },
                    blendMode: 'PASS_THROUGH',
                    fills: [
                      {
                        blendMode: 'NORMAL',
                        type: 'SOLID',
                        color: {
                          r: 0,
                          g: 0,
                          b: 0,
                          a: 1,
                        },
                        boundVariables: {
                          color: {
                            type: 'VARIABLE_ALIAS',
                            id: 'VariableID:2169:337',
                          },
                        },
                      },
                    ],
                    fillGeometry: [],
                    strokes: [],
                    strokeWeight: 1,
                    strokeAlign: 'OUTSIDE',
                    strokeGeometry: [],
                    absoluteBoundingBox: {
                      x: 148,
                      y: 447.5,
                      width: 197,
                      height: 12,
                    },
                    absoluteRenderBounds: {
                      x: 148.92799377441406,
                      y: 447.3320007324219,
                      width: 114.91438293457031,
                      height: 14.90399169921875,
                    },
                    constraints: {
                      vertical: 'TOP',
                      horizontal: 'LEFT',
                    },
                    relativeTransform: [
                      [1, 0, 12],
                      [0, 1, 18],
                    ],
                    size: {
                      x: 197,
                      y: 12,
                    },
                    layoutAlign: 'INHERIT',
                    layoutGrow: 1,
                    layoutSizingHorizontal: 'FILL',
                    layoutSizingVertical: 'HUG',
                    characters: 'Singapore (SIN)',
                    characterStyleOverrides: [],
                    styleOverrideTable: {},
                    lineTypes: ['NONE'],
                    lineIndentations: [0],
                    style: {
                      fontFamily: 'Public Sans',
                      fontPostScriptName: 'PublicSans-Regular',
                      fontStyle: 'Regular',
                      fontWeight: 400,
                      textAutoResize: 'HEIGHT',
                      fontSize: 16,
                      textAlignHorizontal: 'LEFT',
                      textAlignVertical: 'CENTER',
                      leadingTrim: 'CAP_HEIGHT',
                      letterSpacing: 0,
                      lineHeightPx: 12,
                      lineHeightPercent: 63.82979202270508,
                      lineHeightPercentFontSize: 75,
                      lineHeightUnit: 'PIXELS',
                    },
                    layoutVersion: 5,
                    effects: [],
                    interactions: [],
                  },
                ],
                blendMode: 'PASS_THROUGH',
                clipsContent: true,
                background: [
                  {
                    blendMode: 'NORMAL',
                    type: 'SOLID',
                    color: {
                      r: 1,
                      g: 1,
                      b: 1,
                      a: 1,
                    },
                    boundVariables: {
                      color: {
                        type: 'VARIABLE_ALIAS',
                        id: 'VariableID:2149:2204',
                      },
                    },
                  },
                ],
                fills: [
                  {
                    blendMode: 'NORMAL',
                    type: 'SOLID',
                    color: {
                      r: 1,
                      g: 1,
                      b: 1,
                      a: 1,
                    },
                    boundVariables: {
                      color: {
                        type: 'VARIABLE_ALIAS',
                        id: 'VariableID:2149:2204',
                      },
                    },
                  },
                ],
                strokes: [],
                cornerRadius: 4,
                cornerSmoothing: 0,
                strokeWeight: 1,
                strokeAlign: 'INSIDE',
                backgroundColor: {
                  r: 1,
                  g: 1,
                  b: 1,
                  a: 1,
                },
                layoutMode: 'HORIZONTAL',
                counterAxisSizingMode: 'FIXED',
                primaryAxisSizingMode: 'FIXED',
                counterAxisAlignItems: 'CENTER',
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                layoutWrap: 'NO_WRAP',
                fillGeometry: [
                  {
                    path: 'M0 4C0 1.79086 1.79086 0 4 0L217 0C219.209 0 221 1.79086 221 4L221 44C221 46.2091 219.209 48 217 48L4 48C1.79086 48 0 46.2091 0 44L0 4Z',
                    windingRule: 'NONZERO',
                  },
                ],
                strokeGeometry: [],
                absoluteBoundingBox: {
                  x: 136,
                  y: 429.5,
                  width: 221,
                  height: 48,
                },
                absoluteRenderBounds: {
                  x: 136,
                  y: 429.5,
                  width: 221,
                  height: 48,
                },
                constraints: {
                  vertical: 'TOP',
                  horizontal: 'LEFT',
                },
                relativeTransform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
                size: {
                  x: 221,
                  y: 48,
                },
                layoutAlign: 'INHERIT',
                layoutGrow: 1,
                minWidth: 160,
                layoutSizingHorizontal: 'FILL',
                layoutSizingVertical: 'FIXED',
                effects: [
                  {
                    type: 'INNER_SHADOW',
                    visible: true,
                    color: {
                      r: 0.7137255072593689,
                      g: 0.729411780834198,
                      b: 0.7882353067398071,
                      a: 1,
                    },
                    blendMode: 'NORMAL',
                    offset: {
                      x: 0,
                      y: 0,
                    },
                    radius: 0,
                    spread: 1,
                    boundVariables: {
                      spread: {
                        type: 'VARIABLE_ALIAS',
                        id: 'VariableID:2625:387',
                      },
                      color: {
                        type: 'VARIABLE_ALIAS',
                        id: 'VariableID:8017:156',
                      },
                    },
                  },
                ],
                styles: {
                  effect: '8017:162',
                },
                interactions: [],
              },
            ],
            blendMode: 'PASS_THROUGH',
            clipsContent: false,
            background: [],
            fills: [],
            strokes: [],
            strokeWeight: 1,
            strokeAlign: 'INSIDE',
            backgroundColor: {
              r: 0,
              g: 0,
              b: 0,
              a: 0,
            },
            layoutMode: 'HORIZONTAL',
            primaryAxisSizingMode: 'FIXED',
            counterAxisAlignItems: 'CENTER',
            itemReverseZIndex: true,
            layoutWrap: 'NO_WRAP',
            fillGeometry: [],
            strokeGeometry: [],
            absoluteBoundingBox: {
              x: 136,
              y: 429.5,
              width: 221,
              height: 48,
            },
            absoluteRenderBounds: {
              x: 136,
              y: 425,
              width: 221,
              height: 52.5,
            },
            constraints: {
              vertical: 'TOP',
              horizontal: 'LEFT',
            },
            relativeTransform: [
              [1, 0, 0],
              [0, 1, 0],
            ],
            size: {
              x: 221,
              y: 48,
            },
            layoutAlign: 'INHERIT',
            layoutGrow: 1,
            layoutSizingHorizontal: 'FILL',
            layoutSizingVertical: 'HUG',
            effects: [],
            interactions: [],
          },
        ],
      },
      components: {},
      componentSets: {},
      schemaVersion: 0,
      styles: {},
    },
  },
} as unknown as FigmaTypes.GetFileNodesResponse;
