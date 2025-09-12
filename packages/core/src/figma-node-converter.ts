import * as csstype from 'csstype';
import {
  figmaGradientPaintToCssLinearGradient,
  figmaFindVisiblePaint,
  figmaPaintOrEffectCssRgba,
  roundFloat,
  sanitizedId,
  figmaGradientPaintToCssRgba,
  figmaFilterVisibleEffects,
  figmaFilterVisiblePaints,
} from './utils';
import * as FigmaTypes from '@figma/rest-api-spec';
import {
  DomxNode,
  DomxNodeAssets,
  DomxNodeAttributes,
  DomxNodeMetadata,
  DomxNodeStyle,
  DomxNodeType,
} from './domx';

let allowConstructorToRun = false;

export class FigmaNodeConverter {
  id!: string;
  node!: FigmaTypes.Node;
  children: FigmaNodeConverter[] = [];
  parent: FigmaNodeConverter | undefined;
  ancestors: FigmaNodeConverter[] = [];

  nodeAsFrame!: FigmaTypes.FrameNode;
  nodeAsText!: FigmaTypes.TextNode;
  nodeChildren: FigmaTypes.Node[] = [];
  nodeEffects!: FigmaTypes.Effect[];
  nodeEffectsTypeDropShadow: FigmaTypes.DropShadowEffect[];
  nodeEffectsTypeInnerShadow: FigmaTypes.InnerShadowEffect[];
  nodeExportSettings!: FigmaTypes.ExportSetting[];
  nodeExportSettingsFormatSvg?: FigmaTypes.ExportSetting;
  nodeFills!: FigmaTypes.Paint[];
  nodeFillsTypeSolid!: FigmaTypes.SolidPaint[];
  nodeFillsTypeGradientLinear!: FigmaTypes.GradientPaint[];
  nodeFillTypeGradientLinear: FigmaTypes.GradientPaint | undefined;
  nodeFillTypeImage: FigmaTypes.ImagePaint | undefined;
  nodeLastFillTypeSolid: FigmaTypes.SolidPaint | undefined;
  nodeImageRef: string | undefined;
  nodeStrokes!: FigmaTypes.Paint[];
  nodeStrokesTypeSolid: FigmaTypes.SolidPaint | undefined;
  nodeStyle!: FigmaTypes.TypeStyle;
  nodeType!: string;

  domNameFromFigmaNodeName: string | undefined;
  domxAttributesFromFigmaNodeName!: DomxNodeAttributes;

  static create<T extends typeof FigmaNodeConverter>(
    this: T,
    node: FigmaTypes.Node,
    parent?: InstanceType<T>,
  ): InstanceType<T> {
    allowConstructorToRun = true;
    const instance = new this() as InstanceType<T>;
    allowConstructorToRun = false;

    instance.init(node, parent);

    return instance;
  }

  constructor() {
    if (!allowConstructorToRun) {
      throw new Error(
        'FigmaNodeConverter constructor should not be called directly. Use FigmaNodeConverter.create() instead.',
      );
    }
  }

  init(node: FigmaTypes.Node, parent?: FigmaNodeConverter) {
    this.node = node;

    this.parent = parent;

    this.ancestors = this.parent ? [...this.parent.ancestors, this.parent] : [];

    this.nodeAsFrame = node as FigmaTypes.FrameNode;

    this.nodeAsText = node as FigmaTypes.TextNode;

    this.nodeChildren = this.nodeAsFrame.children || [];

    this.nodeEffects = this.nodeAsFrame.effects || [];

    this.nodeEffectsTypeDropShadow =
      figmaFilterVisibleEffects<FigmaTypes.DropShadowEffect>(
        this.nodeEffects,
        'DROP_SHADOW',
      );

    this.nodeEffectsTypeInnerShadow =
      figmaFilterVisibleEffects<FigmaTypes.InnerShadowEffect>(
        this.nodeEffects,
        'INNER_SHADOW',
      );

    this.nodeExportSettings = this.nodeAsFrame.exportSettings || [];

    this.nodeExportSettingsFormatSvg = this.nodeExportSettings.find(
      (exportSetting) => exportSetting.format === 'SVG',
    );

    this.nodeFills = this.nodeAsFrame.fills || [];

    this.nodeFillsTypeSolid = figmaFilterVisiblePaints<FigmaTypes.SolidPaint>(
      this.nodeFills,
      'SOLID',
    );
    this.nodeLastFillTypeSolid =
      this.nodeFillsTypeSolid[this.nodeFillsTypeSolid.length - 1];

    this.nodeFillTypeImage = figmaFindVisiblePaint<FigmaTypes.ImagePaint>(
      this.nodeFills,
      'IMAGE',
    );

    this.nodeFillsTypeGradientLinear =
      figmaFilterVisiblePaints<FigmaTypes.GradientPaint>(
        this.nodeFills,
        'GRADIENT_LINEAR',
      );
    this.nodeFillTypeGradientLinear =
      figmaFindVisiblePaint<FigmaTypes.GradientPaint>(
        this.nodeFills,
        'GRADIENT_LINEAR',
      );

    this.nodeStrokes = this.nodeAsFrame.strokes || [];

    this.nodeStrokesTypeSolid = figmaFindVisiblePaint<FigmaTypes.SolidPaint>(
      this.nodeStrokes,
      'SOLID',
    );

    this.nodeStyle = this.nodeAsText.style || ({} as FigmaTypes.TypeStyle);

    this.nodeType = this.node.type || 'UNKNOWN';

    this.id = sanitizedId(this.node.id);

    this.nodeImageRef = this.nodeFillTypeImage?.imageRef;

    this.domxAttributesFromFigmaNodeName = {
      id: this.id,
    };

    this.parseFigmaNodeName();

    this.buildChildren();
  }

  convert(): DomxNode {
    return new DomxNode({
      id: this.id,
      name: this.domxNodeName(),
      type: this.domxNodeType(),
      attributes: this.domxNodeAttributes(),
      text: this.domxText(),
      assets: this.domxAssets(),
      style: this.domxNodeStyle(),
      metadata: this.domxNodeMetadata(),
      childrenIds: this.domxNodeChildrenIds(),
    });
  }

  /* getter methods - BEGIN */
  get domxNode(): DomxNode {
    return (this._domxNode ||= this.convert());
  }
  protected _domxNode: DomxNode | undefined;

  get rootNode(): boolean {
    return !this.parent;
  }

  nodeIsImgType(): boolean {
    return this.nodeIsSvgType();
  }

  nodeIsSvgType(): boolean {
    return (
      this.nodeType === 'VECTOR' ||
      this.nodeType === 'ELLIPSE' ||
      this.nodeExportSettingsFormatSvg !== undefined
    );
  }

  domxText(): string | undefined {
    if (this.nodeType === 'TEXT') {
      return this.nodeAsText.characters || '';
    }

    return undefined;
  }

  domxAssets(): DomxNodeAssets | undefined {
    const assets: DomxNodeAssets = {};

    if (this.nodeImageRef !== undefined) {
      assets[this.nodeImageRef] = { format: 'imageRef' };
    }

    if (this.nodeIsSvgType()) {
      assets[this.node.id] = { format: 'svg' };
    } else if (this.nodeIsImgType()) {
      assets[this.node.id] = {};
    }

    return Object.keys(assets).length > 0 ? assets : undefined;
  }

  domxNodeName(): string {
    if (this.rootNode) {
      return 'BODY';
    } else if (this.nodeType === 'TEXT') {
      return this.domNameFromFigmaNodeName || 'P';
    } else if (this.nodeIsImgType()) {
      return this.domNameFromFigmaNodeName || 'IMG';
    } else {
      return this.domNameFromFigmaNodeName || 'DIV';
    }
  }

  domxNodeType(): DomxNodeType {
    return DomxNodeType.ELEMENT;
  }

  domxNodeAttributes(): DomxNodeAttributes {
    const attributes: DomxNodeAttributes = {
      id: this.id,
      ...this.domxAttributesFromFigmaNodeName,
    };

    if (this.nodeIsImgType()) {
      attributes.src = `<%- ${this.id}.assets['${this.node.id}'].filePath || ${this.id}.assets['${this.node.id}'].url %>`;
    }

    return attributes;
  }

  domxNodeMetadata(): DomxNodeMetadata {
    return {
      figmaNode: {
        id: this.node.id,
        name: this.node.name,
        type: this.nodeType,
        visible: this.node.visible,
      },
    };
  }

  domxNodeChildrenIds(): string[] {
    const childrenIds: string[] = [];

    this.children.forEach((childFigmaNodeConverter) => {
      childrenIds.push(childFigmaNodeConverter.domxNode.id);
    });

    return childrenIds;
  }

  domxNodeStyle(): DomxNodeStyle {
    if (this.nodeIsImgType()) {
      // For now let's clear all css style for img's since they are all SVGs
      return {};
    }

    const properties: DomxNodeStyle = {
      alignContent: this.cssAlignContent(),
      alignItems: this.cssAlignItems(),
      alignSelf: this.cssAlignSelf(),
      backgroundColor: this.cssBackgroundColor(),
      backgroundImage: this.cssBackgroundImage(),
      backgroundPosition: this.cssBackgroundPosition(),
      backgroundRepeat: this.cssBackgroundRepeat(),
      backgroundSize: this.cssBackgroundSize(),
      borderBottomWidth: this.cssBorderBottomWidth(),
      borderColor: this.cssBorderColor(),
      borderLeftWidth: this.cssBorderLeftWidth(),
      borderRadius: this.cssBorderRadius(),
      borderRightWidth: this.cssBorderRightWidth(),
      borderSpacing: this.cssBorderSpacing(),
      borderStyle: this.cssBorderStyle(),
      borderTopWidth: this.cssBorderTopWidth(),
      borderWidth: this.cssBorderWidth(),
      bottom: this.cssBottom(),
      boxShadow: this.cssBoxShadow(),
      color: this.cssColor(),
      columnGap: this.cssColumnGap(),
      display: this.cssDisplay(),
      flex: this.cssFlex(),
      flexDirection: this.cssFlexDirection(),
      flexWrap: this.cssFlexWrap(),
      fontFamily: this.cssFontFamily(),
      fontSize: this.cssFontSize(),
      fontWeight: this.cssFontWeight(),
      gap: this.cssGap(),
      gridTemplateColumns: this.cssGridTemplateColumns(),
      gridTemplateRows: this.cssGridTemplateRows(),
      height: this.cssHeight(),
      justifyContent: this.cssJustifyContent(),
      left: this.cssLeft(),
      letterSpacing: this.cssLetterSpacing(),
      lineHeight: this.cssLineHeight(),
      maxHeight: this.cssMaxHeight(),
      maxWidth: this.cssMaxWidth(),
      minHeight: this.cssMinHeight(),
      minWidth: this.cssMinWidth(),
      mixBlendMode: this.cssMixBlendMode(),
      opacity: this.cssOpacity(),
      overflow: this.cssOverflow(),
      paddingBottom: this.cssPaddingBottom(),
      paddingLeft: this.cssPaddingLeft(),
      paddingRight: this.cssPaddingRight(),
      paddingTop: this.cssPaddingTop(),
      position: this.cssPosition(),
      right: this.cssRight(),
      rowGap: this.cssRowGap(),
      textAlign: this.cssTextAlign(),
      textDecoration: this.cssTextDecoration(),
      textShadow: this.cssTextShadow(),
      textTransform: this.cssTextTransform(),
      top: this.cssTop(),
      transform: this.cssTransform(),
      transformOrigin: this.cssTransformOrigin(),
      width: this.cssWidth(),
      writingMode: this.cssWritingMode(),
    };

    return properties;
  }
  /* getter methods - END */

  /* helper methods - BEGIN */
  protected buildChildren(): void {
    this.children = [];

    this.nodeChildren.forEach((figmaNodeChild) => {
      const childFigmaNodeConverter = this.buildChild(figmaNodeChild);

      this.children.push(childFigmaNodeConverter);
    });
  }

  protected buildChild(childNode: FigmaTypes.Node): FigmaNodeConverter {
    const converterClass = this.constructor as typeof FigmaNodeConverter;

    const childFigmaNodeConverter = converterClass.create(childNode, this);

    return childFigmaNodeConverter;
  }

  protected parseFigmaNodeName(): void {
    const nameParts = this.node.name
      .trim()
      .split(/(\[.*?\])| /)
      .filter((str) => (str ?? '') !== '');

    nameParts.forEach((namePart) => {
      if (namePart.startsWith('<') && namePart.endsWith('>')) {
        this.populateDomNameFromFigmaNodeName(namePart);
      } else if (namePart.startsWith('[') && namePart.endsWith(']')) {
        this.populateDomxAttributesFromFigmaNodeName(namePart);
      } else if (namePart.startsWith('.')) {
        this.populateDomxAttributesFromFigmaNodeNameClass(namePart);
      } else if (namePart.startsWith('#') && namePart.length > 1) {
        this.domxAttributesFromFigmaNodeName.id = namePart.slice(1);
      }
    });
  }

  protected populateDomNameFromFigmaNodeName(namePart: string) {
    const domName = namePart.slice(1, -1);

    if (domName !== '') {
      this.domNameFromFigmaNodeName = domName.toUpperCase();
    }
  }

  protected populateDomxAttributesFromFigmaNodeNameClass(namePart: string) {
    let domCssClass = namePart.slice(1);

    if (domCssClass.length === 0) return;

    domCssClass = domCssClass.split('.').join(' ');

    this.domxAttributesFromFigmaNodeName.class = [
      this.domxAttributesFromFigmaNodeName.class || '',
      domCssClass,
    ]
      .join(' ')
      .trim();
  }

  protected populateDomxAttributesFromFigmaNodeName(namePart: string) {
    const attrDeclaration = namePart.slice(1, -1).trim();

    if (attrDeclaration.length === 0) return;

    const parts = attrDeclaration.split('=');
    const attributeName = parts[0].trim();
    const attributeValue =
      parts.length === 1
        ? attributeName
        : parts
            .slice(1)
            .join('=')
            .trim()
            .replace(/^'|^"|'$|"$/g, '');

    if (attributeName) {
      this.domxAttributesFromFigmaNodeName[attributeName] = attributeValue;
    }
  }
  /* helper methods - END */

  /* CSS methods - BEGIN */
  get hoveringPosition(): boolean {
    return ['fixed', 'absolute'].includes(this.cssPosition() || '');
  }

  numberToCssSize(number: number): string {
    // Convert number to string with 'px' suffix
    return `${number}px`;
  }

  cssAlignContent(): string | undefined {
    if (this.nodeAsFrame.layoutWrap !== 'WRAP') {
      return undefined;
    }

    if (this.nodeAsFrame.counterAxisAlignContent === 'AUTO') {
      return 'normal';
    }

    if (this.nodeAsFrame.counterAxisAlignContent === 'SPACE_BETWEEN') {
      return 'space-between';
    }

    return undefined;
  }

  cssAlignItems(): csstype.Properties['alignItems'] | undefined {
    if (this.nodeType === 'TEXT') {
      // AUTO LAYOUT RULE 1:1
      if (this.nodeStyle.textAlignVertical === 'TOP') {
        return 'flex-start';
      }

      if (this.nodeStyle.textAlignVertical === 'CENTER') {
        return 'center';
      }

      if (this.nodeStyle.textAlignVertical === 'BOTTOM') {
        return 'flex-end';
      }
    }

    if (this.nodeAsFrame.counterAxisAlignItems === 'MIN') {
      return 'flex-start';
    }

    if (this.nodeAsFrame.counterAxisAlignItems === 'MAX') {
      return 'flex-end';
    }

    if (this.nodeAsFrame.counterAxisAlignItems === 'CENTER') {
      return 'center';
    }

    if (this.nodeAsFrame.counterAxisAlignItems === 'BASELINE') {
      return 'space-between'; // Need to check if this is correct, because the ruby code was "figmaNodeAsFrame.counterAxisAlignItems === 'SPACE_BETWEEN'"
    }

    return undefined;
  }

  cssAlignSelf(): string | undefined {
    return undefined;
  }

  cssBackgroundColor(): string | undefined {
    if (this.nodeType === 'TEXT') return undefined;

    let backgroundColor = figmaPaintOrEffectCssRgba(this.nodeLastFillTypeSolid);

    if (!backgroundColor && this.nodeFillsTypeGradientLinear.length > 0) {
      for (let i = this.nodeFillsTypeGradientLinear.length - 1; i >= 0; i--) {
        const bgColor = figmaGradientPaintToCssRgba(
          this.nodeFillsTypeGradientLinear[i],
        );
        if (bgColor) {
          backgroundColor = bgColor;
          break;
        }
      }
    }

    return backgroundColor;
  }

  cssBackgroundImage(): string | undefined {
    const results: string[] = [];

    if ((this.nodeImageRef ?? '') !== '') {
      results.push(
        `url(<%- ${this.id}.assets['${this.nodeImageRef}'].filePath || ${this.id}.assets['${this.nodeImageRef}'].url %>)`,
      );
    }

    if (this.nodeFillsTypeGradientLinear?.length) {
      const gradientRules = this.nodeFillsTypeGradientLinear
        .map((paint) => figmaGradientPaintToCssLinearGradient(paint))
        .filter((rule): rule is string => Boolean(rule));

      // Keep existing stacking behavior by appending gradients after image url (if any)
      results.push(...gradientRules);
    }

    return results.length > 0 ? results.join(', ') : undefined;
  }

  cssBackgroundPosition(): string | undefined {
    const scaleMode = this.nodeFillTypeImage?.scaleMode || '';

    if (scaleMode === 'FILL') return 'center';
    if (scaleMode === 'FIT') return 'center';
    if (scaleMode === 'TILE') return '0 0';

    return undefined;
  }

  cssBackgroundRepeat(): string | undefined {
    const scaleMode = this.nodeFillTypeImage?.scaleMode || '';

    if (scaleMode === 'FILL') return 'no-repeat';
    if (scaleMode === 'FIT') return 'no-repeat';
    if (scaleMode === 'TILE') return 'repeat';

    return undefined;
  }

  cssBackgroundSize(): string | undefined {
    const scaleMode = this.nodeFillTypeImage?.scaleMode || '';

    if (scaleMode === 'FILL') return 'cover';
    if (scaleMode === 'FIT') return 'contain';
    // if (scaleMode === 'TILE') return 'auto';

    return undefined;
  }

  borderBottomWidth(): number | undefined {
    if (!this.nodeStrokesTypeSolid) return undefined;

    const strokeWeights = this.nodeAsFrame.individualStrokeWeights;

    if (!strokeWeights) return undefined;

    if (
      strokeWeights.bottom === strokeWeights.top &&
      strokeWeights.top === strokeWeights.left &&
      strokeWeights.left === strokeWeights.right
    ) {
      return undefined;
    }

    return strokeWeights.bottom;
  }

  cssBorderBottomWidth(): string | undefined {
    const result = this.borderBottomWidth();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  cssBorderColor(): string | undefined {
    return figmaPaintOrEffectCssRgba(this.nodeStrokesTypeSolid);
  }

  borderLeftWidth(): number | undefined {
    if (!this.nodeStrokesTypeSolid) return undefined;

    const strokeWeights = this.nodeAsFrame.individualStrokeWeights;

    if (!strokeWeights) return undefined;

    if (
      strokeWeights.bottom === strokeWeights.top &&
      strokeWeights.top === strokeWeights.left &&
      strokeWeights.left === strokeWeights.right
    ) {
      return undefined;
    }

    return strokeWeights.left;
  }

  cssBorderLeftWidth(): string | undefined {
    const result = this.borderLeftWidth();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  borderRadius(): number | number[] | undefined {
    if (this.nodeAsFrame.rectangleCornerRadii) {
      const rectangleCornerRadii = this.nodeAsFrame.rectangleCornerRadii;
      if (rectangleCornerRadii.length === 4) {
        return rectangleCornerRadii;
      }
    }

    if (this.nodeAsFrame.cornerRadius) {
      const cornerRadius = this.nodeAsFrame.cornerRadius;

      return cornerRadius;
    }

    return undefined;
  }

  cssBorderRadius(): string | undefined {
    const result = this.borderRadius();

    if (Array.isArray(result)) {
      return result.map((radius) => this.numberToCssSize(radius)).join(' ');
    } else if (typeof result === 'number') {
      return this.numberToCssSize(result);
    }

    return undefined;
  }

  borderRightWidth(): number | undefined {
    if (!this.nodeStrokesTypeSolid) return undefined;

    const strokeWeights = this.nodeAsFrame.individualStrokeWeights;

    if (!strokeWeights) return undefined;

    if (
      strokeWeights.bottom === strokeWeights.top &&
      strokeWeights.top === strokeWeights.left &&
      strokeWeights.left === strokeWeights.right
    ) {
      return undefined;
    }

    return strokeWeights.right;
  }

  cssBorderRightWidth(): string | undefined {
    const result = this.borderRightWidth();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  borderSpacing(): number | undefined {
    if (this.nodeAsFrame.cornerSmoothing) {
      return this.nodeAsFrame.cornerSmoothing;
    }

    return undefined;
  }

  cssBorderSpacing(): string | undefined {
    const result = this.borderSpacing();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  cssBorderStyle(): string | undefined {
    if (!this.nodeStrokesTypeSolid) return undefined;

    if (this.nodeAsFrame.strokeDashes) {
      return 'dashed';
    }

    if (!this.nodeAsFrame.strokeWeight) return undefined;

    return this.nodeAsFrame.strokeWeight > 0 ? 'solid' : undefined;
  }

  borderTopWidth(): number | undefined {
    if (!this.nodeStrokesTypeSolid) return undefined;

    const strokeWeights = this.nodeAsFrame.individualStrokeWeights;

    if (!strokeWeights) return undefined;

    if (
      strokeWeights.bottom === strokeWeights.top &&
      strokeWeights.top === strokeWeights.left &&
      strokeWeights.left === strokeWeights.right
    ) {
      return undefined;
    }

    return strokeWeights.top;
  }

  cssBorderTopWidth(): string | undefined {
    const result = this.borderTopWidth();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  borderWidth(): number | undefined {
    if (!this.nodeStrokesTypeSolid) return undefined;

    const strokeWeights = this.nodeAsFrame.individualStrokeWeights;

    if (!strokeWeights && this.nodeAsFrame.strokeWeight) {
      return this.nodeAsFrame.strokeWeight;
    }

    if (strokeWeights) {
      if (
        strokeWeights.bottom === strokeWeights.top &&
        strokeWeights.top === strokeWeights.left &&
        strokeWeights.left === strokeWeights.right
      ) {
        return strokeWeights.top;
      }
    }

    return undefined;
  }

  cssBorderWidth(): string | undefined {
    const result = this.borderWidth();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  bottom(): number | undefined {
    if (!this.hoveringPosition) return undefined;

    if (this.nodeAsFrame.constraints?.vertical === 'TOP_BOTTOM') {
      return this.top();
    }

    if (this.nodeAsFrame.constraints?.vertical !== 'BOTTOM') {
      return undefined;
    }

    if (this.nodeAsFrame.relativeTransform === undefined) {
      return undefined;
    }
    if (this.nodeAsFrame.relativeTransform[1][0] === undefined) {
      return undefined;
    }

    return this.nodeAsFrame.relativeTransform[1][0] === 0
      ? 0
      : this.nodeAsFrame.relativeTransform[1][2];
  }

  cssBottom(): string | undefined {
    const result = this.bottom();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  cssBoxShadow(): string | undefined {
    // For text nodes we should use text-shadow
    if (this.nodeType === 'TEXT') return undefined;

    const results: string[] = [];

    this.nodeEffectsTypeDropShadow.forEach((dropShadowEffect) => {
      results.push(
        [
          this.numberToCssSize(roundFloat(dropShadowEffect.offset.x)),
          this.numberToCssSize(roundFloat(dropShadowEffect.offset.y)),
          this.numberToCssSize(roundFloat(dropShadowEffect.radius)),
          this.numberToCssSize(roundFloat(dropShadowEffect.spread || 0)),
          figmaPaintOrEffectCssRgba(dropShadowEffect),
        ].join(' '),
      );
    });

    this.nodeEffectsTypeInnerShadow.forEach((innerShadowEffect) => {
      results.push(
        [
          this.numberToCssSize(roundFloat(innerShadowEffect.offset.x)),
          this.numberToCssSize(roundFloat(innerShadowEffect.offset.y)),
          this.numberToCssSize(roundFloat(innerShadowEffect.radius)),
          this.numberToCssSize(roundFloat(innerShadowEffect.spread || 0)),
          figmaPaintOrEffectCssRgba(innerShadowEffect),
          'inset',
        ].join(' '),
      );
    });

    return results.length > 0 ? results.join(', ') : undefined;
  }

  cssTextShadow(): string | undefined {
    if (this.nodeType !== 'TEXT') return undefined;

    if (this.nodeEffectsTypeDropShadow.length === 0) return undefined;

    const results = this.nodeEffectsTypeDropShadow.map((eff) =>
      [
        this.numberToCssSize(roundFloat(eff.offset.x)),
        this.numberToCssSize(roundFloat(eff.offset.y)),
        this.numberToCssSize(roundFloat(eff.radius)),
        figmaPaintOrEffectCssRgba(eff),
      ].join(' '),
    );

    return results.join(', ');
  }

  cssColor(): string | undefined {
    if (this.nodeType !== 'TEXT') return undefined;

    return figmaPaintOrEffectCssRgba(this.nodeLastFillTypeSolid);
  }

  cssColumnGap(): string | undefined {
    if (typeof this.nodeAsFrame.gridColumnGap === 'number') {
      return this.numberToCssSize(this.nodeAsFrame.gridColumnGap);
    }

    return undefined;
  }

  cssDisplay(): csstype.Properties['display'] | undefined {
    if (this.node.visible === false) {
      return 'none';
    }

    // AUTO LAYOUT RULE 1:1
    if (
      this.nodeType === 'TEXT' &&
      this.nodeStyle.textAlignVertical !== undefined
    ) {
      return 'flex';
    }

    if (this.nodeAsFrame.layoutMode) {
      if (this.nodeAsFrame.layoutMode === 'HORIZONTAL') return 'flex';
      if (this.nodeAsFrame.layoutMode === 'VERTICAL') return 'flex';
      if (this.nodeAsFrame.layoutMode === 'GRID') return 'grid';
    }

    return undefined;
  }

  cssFlex(): string | undefined {
    if (this.parent?.nodeAsFrame.layoutMode !== undefined) {
      if (this.nodeAsFrame.layoutGrow === 1) {
        return '1';
      }
    }

    return undefined;
  }

  cssFlexDirection(): csstype.Property.FlexDirection | undefined {
    if (this.nodeAsFrame.layoutMode === 'HORIZONTAL') {
      return 'row';
    }

    if (this.nodeAsFrame.layoutMode === 'VERTICAL') {
      return 'column';
    }

    return undefined;
  }

  cssFlexWrap(): csstype.Property.FlexWrap | undefined {
    if (this.nodeAsFrame.layoutWrap === 'WRAP') {
      return 'wrap';
    }

    if (this.nodeAsFrame.layoutWrap === 'NO_WRAP') {
      return 'nowrap';
    }

    return undefined;
  }

  cssFontFamily(): string | undefined {
    if (this.nodeStyle.fontFamily) {
      return `'${this.nodeStyle.fontFamily}', Arial, sans-serif`;
    }

    return undefined;
  }

  fontSize(): number | undefined {
    if (this.nodeStyle.fontSize) {
      return this.nodeStyle.fontSize;
    }

    return undefined;
  }

  cssFontSize(): string | undefined {
    const result = this.fontSize();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  cssFontWeight(): string | undefined {
    if (this.nodeStyle.fontWeight) {
      return this.nodeStyle.fontWeight.toString();
    }

    return undefined;
  }

  gap(): number[] | undefined {
    if (this.cssJustifyContent() === 'space-between') {
      return undefined;
    }

    const results: number[] = [];

    if (this.nodeAsFrame.counterAxisSpacing !== undefined) {
      results.push(roundFloat(this.nodeAsFrame.counterAxisSpacing));
    }

    if (this.nodeAsFrame.itemSpacing !== undefined) {
      results.push(roundFloat(this.nodeAsFrame.itemSpacing));
    }

    return results;
  }

  cssGap(): string | undefined {
    const results = this.gap();

    if (Array.isArray(results) && results.length > 0) {
      return results.map((result) => this.numberToCssSize(result)).join(' ');
    }

    return undefined;
  }

  cssGridTemplateColumns(): string | undefined {
    if (this.nodeAsFrame.gridColumnsSizing) {
      return this.nodeAsFrame.gridColumnsSizing;
    }

    if (!this.nodeAsFrame.gridColumnCount) return undefined;

    // fallback to repeat(gridColumnCount, minmax(0, 1fr)) if no gridColumnsSizing is defined
    return `repeat(${this.nodeAsFrame.gridColumnCount}, minmax(0, 1fr))`;
  }

  cssGridTemplateRows(): string | undefined {
    if (this.nodeAsFrame.gridRowsSizing) {
      return this.nodeAsFrame.gridRowsSizing;
    }

    if (!this.nodeAsFrame.gridRowCount) return undefined;

    // fallback to repeat(gridRowCount, minmax(0, 1fr)) if no gridRowsSizing is defined
    return `repeat(${this.nodeAsFrame.gridRowCount}, minmax(0, 1fr))`;
  }

  height(): string | number | undefined {
    if (this.hoveringPosition) {
      if (this.nodeAsFrame.constraints?.vertical === 'TOP_BOTTOM') {
        return undefined;
      }
    }

    if (this.rootNode) return undefined;

    if (this.nodeType === 'TEXT') {
      if (this.nodeAsFrame.layoutSizingVertical === 'HUG') {
        return 'auto';
      }
    }

    if (this.nodeAsFrame.layoutSizingVertical === 'FILL') {
      return '100%';
    }

    if (
      this.nodeAsFrame.layoutSizingVertical === 'HUG' &&
      this.nodeExportSettingsFormatSvg === undefined
    ) {
      return undefined;
    }

    if (this.nodeAsFrame.size?.y !== undefined) {
      return roundFloat(this.nodeAsFrame.size.y);
    }

    return undefined;
  }

  cssHeight(): string | undefined {
    const result = this.height();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  cssJustifyContent(): string | undefined {
    if (this.nodeAsFrame.primaryAxisAlignItems === 'MIN') {
      return 'flex-start';
    }

    if (this.nodeAsFrame.primaryAxisAlignItems === 'MAX') {
      return 'flex-end';
    }

    if (this.nodeAsFrame.primaryAxisAlignItems === 'CENTER') {
      return 'center';
    }

    if (this.nodeAsFrame.primaryAxisAlignItems === 'SPACE_BETWEEN') {
      if (this.nodeAsFrame.children?.length === 1) {
        return 'center';
      }

      return 'space-between';
    }

    return undefined;
  }

  left(): number | undefined {
    if (!this.hoveringPosition) return undefined;

    if (this.nodeAsFrame.relativeTransform === undefined) {
      return undefined;
    }
    if (this.nodeAsFrame.relativeTransform[0][0] === undefined) {
      return undefined;
    }

    return this.nodeAsFrame.relativeTransform[0][0] === 0
      ? 0
      : this.nodeAsFrame.relativeTransform[0][2];
  }

  cssLeft(): string | undefined {
    const result = this.left();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  letterSpacing(): number | undefined {
    if (this.nodeStyle.letterSpacing) {
      return this.nodeStyle.letterSpacing;
    }

    return undefined;
  }

  cssLetterSpacing(): string | undefined {
    const result = this.letterSpacing();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  lineHeight(): number | undefined {
    if (this.nodeStyle.lineHeightPx) {
      return this.nodeStyle.lineHeightPx;
    }

    return undefined;
  }

  cssLineHeight(): string | undefined {
    const result = this.lineHeight();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  maxHeight(): number | undefined {
    const absoluteBoundingBoxHeight =
      this.nodeAsFrame.absoluteBoundingBox?.height;
    const parentAbsoluteBoundingBoxHeight =
      this.parent?.nodeAsFrame.absoluteBoundingBox?.height;

    if (
      typeof absoluteBoundingBoxHeight === 'number' &&
      typeof parentAbsoluteBoundingBoxHeight === 'number'
    ) {
      if (absoluteBoundingBoxHeight > parentAbsoluteBoundingBoxHeight) {
        return undefined;
      }
    }

    const height = this.height();
    const parentHeight = this.parent?.height();

    if (
      typeof parentHeight === 'number' &&
      typeof height === 'number' &&
      height > parentHeight
    ) {
      return undefined;
    }

    if (this.nodeAsFrame.maxHeight !== undefined) {
      return roundFloat(this.nodeAsFrame.maxHeight);
    }

    return undefined;
  }

  cssMaxHeight(): string | undefined {
    const result = this.maxHeight();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  maxWidth(): number | undefined {
    const absoluteBoundingBoxWidth =
      this.nodeAsFrame.absoluteBoundingBox?.width;
    const parentAbsoluteBoundingBoxWidth =
      this.parent?.nodeAsFrame.absoluteBoundingBox?.width;

    if (
      typeof absoluteBoundingBoxWidth === 'number' &&
      typeof parentAbsoluteBoundingBoxWidth === 'number'
    ) {
      if (absoluteBoundingBoxWidth > parentAbsoluteBoundingBoxWidth) {
        return undefined;
      }
    }

    const width = this.width();
    const parentWidth = this.parent?.width();

    if (
      typeof parentWidth === 'number' &&
      typeof width === 'number' &&
      width > parentWidth
    ) {
      return undefined;
    }

    if (this.nodeAsFrame.maxWidth !== undefined) {
      return roundFloat(this.nodeAsFrame.maxWidth);
    }

    return undefined;
  }

  cssMaxWidth(): string | undefined {
    const result = this.maxWidth();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  minHeight(): number | undefined {
    const absoluteBoundingBoxHeight =
      this.nodeAsFrame.absoluteBoundingBox?.height;
    const parentAbsoluteBoundingBoxHeight =
      this.parent?.nodeAsFrame.absoluteBoundingBox?.height;

    if (
      typeof absoluteBoundingBoxHeight === 'number' &&
      typeof parentAbsoluteBoundingBoxHeight === 'number'
    ) {
      if (absoluteBoundingBoxHeight > parentAbsoluteBoundingBoxHeight) {
        return undefined;
      }
    }

    const height = this.height();
    const parentHeight = this.parent?.height();

    if (
      typeof parentHeight === 'number' &&
      typeof height === 'number' &&
      height > parentHeight
    ) {
      return undefined;
    }

    if (this.nodeAsFrame.minHeight !== undefined) {
      return roundFloat(this.nodeAsFrame.minHeight);
    }

    return undefined;
  }

  cssMinHeight(): string | undefined {
    const result = this.minHeight();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  minWidth(): number | undefined {
    const absoluteBoundingBoxWidth =
      this.nodeAsFrame.absoluteBoundingBox?.width;
    const parentAbsoluteBoundingBoxWidth =
      this.parent?.nodeAsFrame.absoluteBoundingBox?.width;

    if (
      typeof absoluteBoundingBoxWidth === 'number' &&
      typeof parentAbsoluteBoundingBoxWidth === 'number'
    ) {
      if (absoluteBoundingBoxWidth > parentAbsoluteBoundingBoxWidth) {
        return undefined;
      }
    }

    const width = this.width();
    const parentWidth = this.parent?.width();

    if (
      typeof parentWidth === 'number' &&
      typeof width === 'number' &&
      width > parentWidth
    ) {
      return undefined;
    }

    if (this.nodeAsFrame.minWidth !== undefined) {
      return roundFloat(this.nodeAsFrame.minWidth);
    }

    return undefined;
  }

  cssMinWidth(): string | undefined {
    const result = this.minWidth();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  cssMixBlendMode(): csstype.Property.MixBlendMode | undefined {
    // If blendMode is not "PASS_THROUGH" or "NORMAL", map to mix-blend-mode or background-blend-mode.
    if (!this.nodeAsFrame.blendMode) return undefined;
    if (this.nodeAsFrame.blendMode === 'PASS_THROUGH') return undefined;
    if (this.nodeAsFrame.blendMode === 'NORMAL') return undefined;

    return this.nodeAsFrame.blendMode
      .toLowerCase()
      .replace(/_/g, '-') as csstype.Property.MixBlendMode;
  }

  opacity(): number | undefined {
    if (this.nodeAsFrame.opacity !== undefined) {
      return roundFloat(this.nodeAsFrame.opacity);
    }

    return undefined;
  }

  cssOpacity(): string | undefined {
    const result = this.opacity();

    return typeof result === 'number' ? result.toString() : result;
  }

  cssOverflow(): string | undefined {
    // if (this.parent?.nodeType === 'CANVAS') {
    //   if (this.nodeAsFrame.clipsContent === true) {
    //     return 'hidden';
    //   }
    // }

    if (this.nodeAsFrame.clipsContent === true) {
      return 'auto';
    }

    // For some reason scrollBehavior is always 'SCROLLS' on frames that are not scrollable
    // if (this.nodeAsFrame.scrollBehavior === 'SCROLLS') {
    //   return 'auto';
    // }

    return undefined;
  }

  paddingBottom(): number | undefined {
    if (this.nodeAsFrame.paddingBottom !== undefined) {
      return roundFloat(this.nodeAsFrame.paddingBottom);
    }

    return undefined;
  }

  cssPaddingBottom(): string | undefined {
    const result = this.paddingBottom();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  paddingLeft(): number | undefined {
    if (this.nodeAsFrame.paddingLeft !== undefined) {
      return roundFloat(this.nodeAsFrame.paddingLeft);
    }

    return undefined;
  }

  cssPaddingLeft(): string | undefined {
    const result = this.paddingLeft();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  paddingRight(): number | undefined {
    if (this.nodeAsFrame.paddingRight !== undefined) {
      return roundFloat(this.nodeAsFrame.paddingRight);
    }

    return undefined;
  }

  cssPaddingRight(): string | undefined {
    const result = this.paddingRight();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  paddingTop(): number | undefined {
    if (this.nodeAsFrame.paddingTop !== undefined) {
      return roundFloat(this.nodeAsFrame.paddingTop);
    }

    return undefined;
  }

  cssPaddingTop(): string | undefined {
    const result = this.paddingTop();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  cssPosition(): csstype.Property.Position | undefined {
    if (this.nodeAsFrame.layoutPositioning === 'ABSOLUTE') {
      if (this.parent?.rootNode) {
        return 'fixed';
      }

      return 'absolute';
    }

    if (this.nodeAsFrame.isFixed) {
      return 'fixed';
    }

    if (this.parent?.nodeAsFrame.layoutMode === 'NONE') {
      return 'absolute';
    }

    if (this.parent?.nodeType === 'SECTION') {
      return 'absolute';
    }

    if (this.parent?.nodeType === 'GROUP') {
      return 'absolute';
    }

    if (
      this.children.some((child) =>
        ['absolute', 'fixed'].includes(child.cssPosition()),
      )
    ) {
      return 'relative';
    }

    return undefined;
  }

  right(): number | undefined {
    if (!this.hoveringPosition) return undefined;

    if (this.nodeAsFrame.constraints?.horizontal === 'LEFT_RIGHT') {
      return this.left();
    }

    if (this.nodeAsFrame.constraints?.horizontal !== 'RIGHT') return undefined;

    if (this.nodeAsFrame.relativeTransform === undefined) {
      return undefined;
    }
    if (this.nodeAsFrame.relativeTransform[0][1] === undefined) {
      return undefined;
    }

    return this.nodeAsFrame.relativeTransform[0][1] === 0
      ? 0
      : this.nodeAsFrame.relativeTransform[0][2];
  }

  cssRight(): string | undefined {
    const result = this.right();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  cssRowGap(): string | undefined {
    if (typeof this.nodeAsFrame.gridRowGap === 'number') {
      return this.numberToCssSize(this.nodeAsFrame.gridRowGap);
    }

    return undefined;
  }

  cssTextAlign(): csstype.Property.TextAlign | undefined {
    if (this.nodeStyle.textAlignHorizontal === 'LEFT') {
      return 'left';
    }

    if (this.nodeStyle.textAlignHorizontal === 'RIGHT') {
      return 'right';
    }

    if (this.nodeStyle.textAlignHorizontal === 'CENTER') {
      return 'center';
    }

    if (this.nodeStyle.textAlignHorizontal === 'JUSTIFIED') {
      return 'justify';
    }

    return undefined;
  }

  cssTextDecoration(): string | undefined {
    if (this.nodeStyle.textDecoration === 'STRIKETHROUGH') {
      return 'line-through';
    }

    if (this.nodeStyle.textDecoration === 'UNDERLINE') {
      return 'underline';
    }

    return undefined;
  }

  cssTextTransform(): csstype.Property.TextTransform | undefined {
    if (this.nodeStyle.textCase === 'UPPER') {
      return 'uppercase';
    }

    if (this.nodeStyle.textCase === 'LOWER') {
      return 'lowercase';
    }

    if (this.nodeStyle.textCase === 'TITLE') {
      return 'capitalize';
    }

    if (this.nodeStyle.textCase === 'SMALL_CAPS') {
      // return 'small-caps';
      return 'lowercase';
    }

    if (this.nodeStyle.textCase === 'SMALL_CAPS_FORCED') {
      // return 'small-caps';
      return 'lowercase';
    }

    return undefined;
  }

  top(): number | undefined {
    if (!this.hoveringPosition) return undefined;

    if (this.nodeAsFrame.relativeTransform === undefined) {
      return undefined;
    }
    if (this.nodeAsFrame.relativeTransform[1][1] === undefined) {
      return undefined;
    }

    return this.nodeAsFrame.relativeTransform[1][1] === 0
      ? 0
      : this.nodeAsFrame.relativeTransform[1][2];
  }

  cssTop(): string | undefined {
    const result = this.top();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  width(): string | number | undefined {
    if (this.hoveringPosition) {
      if (this.nodeAsFrame.constraints?.horizontal === 'LEFT_RIGHT') {
        return undefined;
      }
    }

    if (this.rootNode) return undefined;

    if (this.nodeType === 'TEXT') {
      if (this.nodeAsFrame.layoutSizingHorizontal === 'HUG') {
        return 'auto';
      }
    }

    if (this.nodeAsFrame.layoutSizingHorizontal === 'FILL') {
      return '100%';
    }

    if (
      this.nodeAsFrame.layoutSizingHorizontal === 'HUG' &&
      this.nodeExportSettingsFormatSvg === undefined
    ) {
      return undefined;
    }

    if (this.nodeAsFrame.size?.x !== undefined) {
      return roundFloat(this.nodeAsFrame.size.x);
    }

    return undefined;
  }

  cssTransform(): string | undefined {
    // AUTO LAYOUT RULE 2:1
    if (!this.node.rotation || this.node.rotation === 0) return undefined;

    const degrees = roundFloat((this.node.rotation * 180) / Math.PI);

    // AUTO LAYOUT RULE 2:2
    if (this.nodeType === 'TEXT' && (degrees === 90 || degrees === -90)) {
      return undefined;
    }

    return `rotate(${degrees}deg)`;

    return undefined;
  }

  cssTransformOrigin(): string | undefined {
    if (this.cssTransform()) {
      return 'center';
    }

    return undefined;
  }

  cssWidth(): string | undefined {
    const result = this.width();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  cssWritingMode(): csstype.Properties['writingMode'] | undefined {
    if (this.nodeType !== 'TEXT') return undefined;

    if (!this.node.rotation || this.node.rotation === 0) return undefined;

    const degrees = roundFloat((this.node.rotation * 180) / Math.PI);

    // AUTO LAYOUT RULE 2:2
    if (degrees === 90) return 'vertical-rl';
    if (degrees === -90) return 'sideways-lr';

    return undefined;
  }
  /* CSS methods - END */
}
