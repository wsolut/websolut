import * as csstype from 'csstype';
import {
  figmaGradientPaintToCssLinearGradient,
  figmaPaintOrEffectCssRgba,
  roundFloat,
  sanitizedId,
  figmaGradientPaintToCssRgba,
  figmaGradientPaintToCssRadialGradient,
  figmaGradientPaintToCssConicGradient,
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
  nodeExportSettings!: FigmaTypes.ExportSetting[];
  nodeExportSettingsFormatSvg?: FigmaTypes.ExportSetting;
  nodeFills!: FigmaTypes.Paint[];
  nodeFillsTypeGradientLinear!: FigmaTypes.GradientPaint[];
  nodeFillsTypeImage!: FigmaTypes.ImagePaint[];
  nodeFillsTypeSolid!: FigmaTypes.SolidPaint[];
  nodeStrokes!: FigmaTypes.Paint[];
  nodeStyle!: FigmaTypes.TypeStyle;
  nodeType!: string;
  uniformStrokeWeight: number | undefined = undefined;
  topMostSolidStroke: FigmaTypes.SolidPaint | undefined = undefined;
  topMostSolidStrokeColor: string | undefined = undefined;
  lastLinearGradientStroke: FigmaTypes.GradientPaint | undefined = undefined;

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

    this.nodeExportSettings = this.nodeAsFrame.exportSettings || [];

    this.nodeExportSettingsFormatSvg = this.nodeExportSettings.find(
      (exportSetting) => exportSetting.format === 'SVG',
    );

    this.nodeFills = this.nodeAsFrame.fills || [];

    this.nodeFillsTypeSolid = figmaFilterVisiblePaints<FigmaTypes.SolidPaint>(
      this.nodeFills,
      'SOLID',
    );

    this.nodeFillsTypeImage = figmaFilterVisiblePaints<FigmaTypes.ImagePaint>(
      this.nodeFills,
      'IMAGE',
    );

    this.nodeFillsTypeGradientLinear =
      figmaFilterVisiblePaints<FigmaTypes.GradientPaint>(
        this.nodeFills,
        'GRADIENT_LINEAR',
      );

    this.nodeStrokes = this.nodeAsFrame.strokes || [];

    this.nodeStyle = this.nodeAsText.style || ({} as FigmaTypes.TypeStyle);

    this.nodeType = this.node.type || 'UNKNOWN';

    // Stroke helpers
    const visibleStrokes = (this.nodeStrokes || []).filter((p) => {
      const visible = (p as { visible?: boolean }).visible;
      return visible !== false;
    });

    if (visibleStrokes.length > 0) {
      const topMost = visibleStrokes[visibleStrokes.length - 1];

      if (topMost.type === 'SOLID') {
        this.topMostSolidStroke = topMost;
      }
    }

    this.topMostSolidStrokeColor = figmaPaintOrEffectCssRgba(
      this.topMostSolidStroke,
    );

    const strokeWeights = this.nodeAsFrame.individualStrokeWeights;
    if (strokeWeights) {
      if (
        strokeWeights.bottom === strokeWeights.top &&
        strokeWeights.top === strokeWeights.left &&
        strokeWeights.left === strokeWeights.right
      ) {
        this.uniformStrokeWeight = strokeWeights.top;
      }
    } else if (this.nodeAsFrame.strokeWeight !== undefined) {
      this.uniformStrokeWeight = this.nodeAsFrame.strokeWeight;
    }

    // --- Gradient stroke via border-image (CENTER alignment only) ---
    const nodeStrokesTypeGradientLinear =
      figmaFilterVisiblePaints<FigmaTypes.GradientPaint>(
        this.nodeStrokes,
        'GRADIENT_LINEAR',
      );

    if (nodeStrokesTypeGradientLinear.length > 0) {
      this.lastLinearGradientStroke =
        nodeStrokesTypeGradientLinear[nodeStrokesTypeGradientLinear.length - 1];
    }

    this.id = sanitizedId(this.node.id);

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
    if (this.nodeType !== 'TEXT') return undefined;

    const text = this.nodeAsText.characters || '';

    return (
      text
        // Carriage return + line feed (CRLF)
        .replace(/\r\n/g, `\n`)
        // Carriage return only (CR)
        .replace(/\r/g, `\n`)
        // Unicode line separator
        .replace(/\u2028/g, `\n`)
        // Unicode paragraph separator
        .replace(/\u2029/g, `\n`)
        // Next line (NEL)
        .replace(/\u0085/g, `\n`)
        // Vertical tab
        .replace(/\v/g, `\n`)
    );
  }

  domxAssets(): DomxNodeAssets | undefined {
    const assets: DomxNodeAssets = {};

    this.nodeFillsTypeImage.forEach((nodeFillTypeImage) => {
      assets[nodeFillTypeImage.imageRef] = { format: 'imageRef' };
    });

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
      return {
        bottom: this.cssBottom(),
        left: this.cssLeft(),
        position: this.cssPosition(),
        right: this.cssRight(),
        top: this.cssTop(),
      };
    }

    const properties: DomxNodeStyle = {
      alignContent: this.cssAlignContent(),
      alignItems: this.cssAlignItems(),
      alignSelf: this.cssAlignSelf(),
      backdropFilter: this.cssBackdropFilter(),
      backgroundBlendMode: this.cssBackgroundBlendMode(),
      backgroundClip: this.cssBackgroundClip(),
      backgroundColor: this.cssBackgroundColor(),
      backgroundImage: this.cssBackgroundImage(),
      backgroundPosition: this.cssBackgroundPosition(),
      backgroundRepeat: this.cssBackgroundRepeat(),
      backgroundSize: this.cssBackgroundSize(),
      borderBottomWidth: this.cssBorderBottomWidth(),
      borderColor: this.cssBorderColor(),
      borderImageRepeat: this.cssBorderImageRepeat(),
      borderImageSlice: this.cssBorderImageSlice(),
      borderImageSource: this.cssBorderImageSource(),
      borderLeftWidth: this.cssBorderLeftWidth(),
      borderRadius: this.cssBorderRadius(),
      borderRightWidth: this.cssBorderRightWidth(),
      borderStyle: this.cssBorderStyle(),
      borderTopWidth: this.cssBorderTopWidth(),
      borderWidth: this.cssBorderWidth(),
      bottom: this.cssBottom(),
      boxShadow: this.cssBoxShadow(),
      color: this.cssColor(),
      columnGap: this.cssColumnGap(),
      display: this.cssDisplay(),
      filter: this.cssFilter(),
      flex: this.cssFlex(),
      flexDirection: this.cssFlexDirection(),
      flexWrap: this.cssFlexWrap(),
      fontFamily: this.cssFontFamily(),
      fontSize: this.cssFontSize(),
      fontStyle: this.cssFontStyle(),
      fontVariantCaps: this.cssFontVariantCaps(),
      fontWeight: this.cssFontWeight(),
      gap: this.cssGap(),
      gridAutoFlow: this.cssGridAutoFlow(),
      gridTemplateColumns: this.cssGridTemplateColumns(),
      gridTemplateRows: this.cssGridTemplateRows(),
      height: this.cssHeight(),
      justifyContent: this.cssJustifyContent(),
      left: this.cssLeft(),
      letterSpacing: this.cssLetterSpacing(),
      lineHeight: this.cssLineHeight(),
      marginBottom: this.cssMarginBottom(),
      maxHeight: this.cssMaxHeight(),
      maxWidth: this.cssMaxWidth(),
      minHeight: this.cssMinHeight(),
      minWidth: this.cssMinWidth(),
      mixBlendMode: this.cssMixBlendMode(),
      opacity: this.cssOpacity(),
      outline: this.cssOutline(),
      overflow: this.cssOverflow(),
      paddingBottom: this.cssPaddingBottom(),
      paddingLeft: this.cssPaddingLeft(),
      paddingRight: this.cssPaddingRight(),
      paddingTop: this.cssPaddingTop(),
      placeContent: this.cssPlaceContent(),
      placeItems: this.cssPlaceItems(),
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
      WebkitBackdropFilter: this.cssBackdropFilter(),
      WebkitBackgroundClip: this.cssWebkitBackgroundClip(),
      WebkitFilter: this.cssFilter(),
      WebkitTextFillColor: this.cssWebkitTextFillColor(),
      whiteSpace: this.cssWhiteSpace(),
      width: this.cssWidth(),
      writingMode: this.cssWritingMode(),
      zIndex: this.cssZIndex(),
    };

    return properties;
  }
  /* getter methods - END */

  /* helper methods - BEGIN */
  protected emulateStrokeAlign(): boolean {
    return (
      this.emulateStrokeAlignInsideAsBoxShadow() ||
      this.emulateStrokeAlignOutsideAsOutline()
    );
  }

  protected emulateStrokeAlignInsideAsBoxShadow(): boolean {
    if (this.useLastLinearGradientStrokeAsBorderImage()) return false;

    return this.nodeAsFrame.strokeAlign === 'INSIDE';
  }

  protected emulateStrokeAlignOutsideAsOutline(): boolean {
    if (this.useLastLinearGradientStrokeAsBorderImage()) return false;

    return this.nodeAsFrame.strokeAlign === 'OUTSIDE';
  }

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

    if (this.nodeAsFrame.counterAxisAlignContent === 'MIN') {
      return 'flex-start';
    }

    if (this.nodeAsFrame.counterAxisAlignContent === 'MAX') {
      return 'flex-end';
    }

    if (this.nodeAsFrame.counterAxisAlignContent === 'CENTER') {
      return 'center';
    }

    return undefined;
  }

  cssAlignItems(): csstype.Properties['alignItems'] | undefined {
    // For grid containers, prefer place-items shorthand and skip align-items
    if (this.nodeAsFrame.layoutMode === 'GRID') return undefined;

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
      return 'baseline';
    }

    return undefined;
  }

  cssAlignSelf(): string | undefined {
    return undefined;
  }

  cssBackgroundColor(): string | undefined {
    if (this.nodeType === 'TEXT') return undefined;

    const nodeLastFillTypeSolid =
      this.nodeFillsTypeSolid[this.nodeFillsTypeSolid.length - 1];

    let backgroundColor = figmaPaintOrEffectCssRgba(nodeLastFillTypeSolid);

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

    this.nodeFillsTypeImage.forEach((nodeFillTypeImage) => {
      const imageRef = nodeFillTypeImage.imageRef;

      results.push(
        `url(<%- ${this.id}.assets['${imageRef}'].filePath || ${this.id}.assets['${imageRef}'].url %>)`,
      );
    });

    // Linear gradients
    if (this.nodeFillsTypeGradientLinear.length > 0) {
      const gradientRules = this.nodeFillsTypeGradientLinear
        .map((paint) => figmaGradientPaintToCssLinearGradient(paint))
        .filter((rule) => (rule ?? '') !== '');

      results.push(...gradientRules);
    }

    // Radial gradients
    const nodeFillsTypeGradientRadial =
      figmaFilterVisiblePaints<FigmaTypes.GradientPaint>(
        this.nodeFills,
        'GRADIENT_RADIAL',
      );
    if (nodeFillsTypeGradientRadial.length > 0) {
      const gradientRules = nodeFillsTypeGradientRadial
        .map((paint) => figmaGradientPaintToCssRadialGradient(paint))
        .filter((rule) => (rule ?? '') !== '');
      results.push(...gradientRules);
    }

    // Conic gradients (angular)
    const nodeFillsTypeGradientConic =
      figmaFilterVisiblePaints<FigmaTypes.GradientPaint>(
        this.nodeFills,
        'GRADIENT_ANGULAR',
      );
    if (nodeFillsTypeGradientConic.length > 0) {
      const gradientRules = nodeFillsTypeGradientConic
        .map((paint) => figmaGradientPaintToCssConicGradient(paint))
        .filter((rule) => (rule ?? '') !== '');
      results.push(...gradientRules);
    }

    return results.length > 0 ? results.join(', ') : undefined;
  }

  cssBackgroundBlendMode(): string | undefined {
    // Emit one value per background layer in the same order as cssBackgroundImage():
    // 1) all IMAGE fills; 2) GRADIENT_LINEAR fills that produce a CSS gradient.
    const results: string[] = [];

    const toCssBlend = (mode?: string): string => {
      if (!mode) return 'normal';
      if (mode === 'PASS_THROUGH' || mode === 'NORMAL') return 'normal';
      return mode.toLowerCase().replace(/_/g, '-');
    };

    // Image layers
    this.nodeFillsTypeImage.forEach((paint) => {
      results.push(toCssBlend(paint.blendMode));
    });

    // Gradient layers that actually render
    this.nodeFillsTypeGradientLinear.forEach((paint) => {
      const gradientRule = figmaGradientPaintToCssLinearGradient(paint);
      if (gradientRule) results.push(toCssBlend(paint.blendMode));
    });

    // Radial gradients
    const nodeFillsTypeGradientRadial =
      figmaFilterVisiblePaints<FigmaTypes.GradientPaint>(
        this.nodeFills,
        'GRADIENT_RADIAL',
      );
    nodeFillsTypeGradientRadial.forEach((paint) => {
      const gradientRule = figmaGradientPaintToCssRadialGradient(paint);
      if (gradientRule) results.push(toCssBlend(paint.blendMode));
    });

    // Conic gradients
    const nodeFillsTypeGradientConic =
      figmaFilterVisiblePaints<FigmaTypes.GradientPaint>(
        this.nodeFills,
        'GRADIENT_ANGULAR',
      );
    nodeFillsTypeGradientConic.forEach((paint) => {
      const gradientRule = figmaGradientPaintToCssConicGradient(paint);
      if (gradientRule) results.push(toCssBlend(paint.blendMode));
    });

    return results.length > 0 ? results.join(', ') : undefined;
  }

  cssBackgroundPosition(): string | undefined {
    if (this.nodeFillsTypeImage.length === 0) return undefined;

    const values = this.nodeFillsTypeImage.map((fill) => {
      const scaleMode = fill.scaleMode || '';
      if (scaleMode === 'FILL') return 'center';
      if (scaleMode === 'FIT') return 'center';
      if (scaleMode === 'TILE') return '0 0';
      if (scaleMode === 'STRETCH') return '0 0';
      return 'center';
    });

    return values.join(', ');
  }

  cssBackgroundRepeat(): string | undefined {
    if (this.nodeFillsTypeImage.length === 0) return undefined;

    const values = this.nodeFillsTypeImage.map((fill) => {
      const scaleMode = fill.scaleMode || '';
      if (scaleMode === 'FILL') return 'no-repeat';
      if (scaleMode === 'FIT') return 'no-repeat';
      if (scaleMode === 'TILE') return 'repeat';
      if (scaleMode === 'STRETCH') return 'no-repeat';
      return 'no-repeat';
    });

    return values.join(', ');
  }

  cssBackgroundSize(): string | undefined {
    if (this.nodeFillsTypeImage.length === 0) return undefined;

    const values = this.nodeFillsTypeImage.map((fill) => {
      const scaleMode = fill.scaleMode || '';
      if (scaleMode === 'FILL') return 'cover';
      if (scaleMode === 'FIT') return 'contain';
      if (scaleMode === 'TILE') return 'auto';
      if (scaleMode === 'STRETCH') return '100% 100%';
      return 'cover';
    });

    return values.join(', ');
  }

  borderBottomWidth(): number | undefined {
    if (!this.cssBorderColor()) return undefined;

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
    if (this.emulateStrokeAlign()) return undefined;

    const result = this.borderBottomWidth();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  cssBorderColor(): string | undefined {
    if (this.emulateStrokeAlign()) return undefined;

    return this.topMostSolidStrokeColor;
  }

  borderLeftWidth(): number | undefined {
    if (!this.cssBorderColor()) return undefined;

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
    if (this.emulateStrokeAlign()) return undefined;

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
    if (!this.cssBorderColor()) return undefined;

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
    if (this.emulateStrokeAlign()) return undefined;

    const result = this.borderRightWidth();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  // borderSpacing(): number | undefined {
  //   if (this.nodeAsFrame.cornerSmoothing) {
  //     return this.nodeAsFrame.cornerSmoothing; // cornerSmoothing does not seem to be related to borderSpacing
  //   }

  //   return undefined;
  // }

  // cssBorderSpacing(): string | undefined {
  //   const result = this.borderSpacing();

  //   return typeof result === 'number' ? this.numberToCssSize(result) : result;
  // }

  cssBorderStyle(): string | undefined {
    if (this.useLastLinearGradientStrokeAsBorderImage()) return 'solid'; // when using border-image, we need a border-style

    if (this.emulateStrokeAlign()) return undefined;
    if (!this.cssBorderColor()) return undefined;

    if (this.nodeAsFrame.strokeDashes && this.nodeAsFrame.strokeDashes.length) {
      const pattern = this.nodeAsFrame.strokeDashes;
      const weight = this.nodeAsFrame.strokeWeight ?? undefined;
      const nearZero = (n: number) => Math.abs(n) <= 0.1; // treat ~0 as 0

      // Heuristic 1: any dash ~ 0 with a positive gap -> dotted
      let hasNearZeroDash = false;
      let hasPositiveGap = false;
      pattern.forEach((val, idx) => {
        if (idx % 2 === 0) {
          // dash lengths (even indices)
          if (nearZero(val)) hasNearZeroDash = true;
        } else {
          // gaps (odd indices)
          if (val > 0.1) hasPositiveGap = true;
        }
      });
      if (hasNearZeroDash && hasPositiveGap) return 'dotted';

      // Heuristic 2: all segments are very short -> dotted
      if (pattern.length > 0) {
        const threshold =
          weight !== undefined ? Math.max(0.5, weight * 0.5) : 1; // px
        const allShort = pattern.every((n) => n <= threshold);
        if (allShort) return 'dotted';
      }

      // Otherwise, we can only express generic dashed in CSS
      return 'dashed';
    }

    if (!this.nodeAsFrame.strokeWeight) return undefined;

    return this.nodeAsFrame.strokeWeight > 0 ? 'solid' : undefined;
  }

  borderTopWidth(): number | undefined {
    if (!this.cssBorderColor()) return undefined;

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
    if (this.emulateStrokeAlign()) return undefined;

    const result = this.borderTopWidth();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  borderWidth(): number | undefined {
    if (!this.cssBorderColor()) return undefined;

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
    let borderWidth: string | undefined = undefined;

    if (!this.emulateStrokeAlign()) {
      if (typeof this.borderWidth() === 'number') {
        borderWidth = this.numberToCssSize(this.borderWidth());
      }
    }

    // Provide a border-width when using border-image and no regular border width applies
    if (!borderWidth && this.useLastLinearGradientStrokeAsBorderImage()) {
      const strokeWeight = this.uniformStrokeWeight;

      if (typeof strokeWeight === 'number' && strokeWeight > 0) {
        borderWidth = this.numberToCssSize(roundFloat(strokeWeight));
      }
    }

    return borderWidth;
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

    const nodeEffectsTypeInnerShadow =
      figmaFilterVisibleEffects<FigmaTypes.InnerShadowEffect>(
        this.nodeEffects,
        'INNER_SHADOW',
      );

    nodeEffectsTypeInnerShadow.forEach((innerShadowEffect) => {
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

    // Emulate INSIDE stroke with an inset ring box-shadow if applicable
    if (this.emulateStrokeAlignInsideAsBoxShadow()) {
      const color = this.topMostSolidStrokeColor;
      const width = this.uniformStrokeWeight;

      if (color && typeof width === 'number' && width > 0) {
        results.push(
          [
            this.numberToCssSize(0),
            this.numberToCssSize(0),
            this.numberToCssSize(0),
            this.numberToCssSize(roundFloat(width)),
            color,
            'inset',
          ].join(' '),
        );
      }
    }

    return results.length > 0 ? results.join(', ') : undefined;
  }

  cssOutline(): string | undefined {
    // Emulate OUTSIDE stroke with outline when uniform width and solid color
    if (this.emulateStrokeAlignOutsideAsOutline()) {
      const color = this.topMostSolidStrokeColor;
      const width = this.uniformStrokeWeight;

      if (color && typeof width === 'number' && width > 0) {
        return `${this.numberToCssSize(roundFloat(width))} solid ${color}`;
      }
    }
    return undefined;
  }

  cssFilter(): string | undefined {
    if (this.nodeType === 'TEXT') return undefined; // filters on text handled via text effects

    const filters: string[] = [];

    const nodeEffectsTypeLayerBlur =
      figmaFilterVisibleEffects<FigmaTypes.BlurEffect>(
        this.nodeEffects,
        'LAYER_BLUR',
      );

    nodeEffectsTypeLayerBlur.forEach((eff) => {
      const radius = roundFloat(eff.radius || 0);
      if (radius > 0) filters.push(`blur(${this.numberToCssSize(radius)})`);
    });

    return filters.length > 0 ? filters.join(' ') : undefined;
  }

  cssBackdropFilter(): string | undefined {
    const filters: string[] = [];

    const nodeEffectsTypeBackgroundBlur =
      figmaFilterVisibleEffects<FigmaTypes.BlurEffect>(
        this.nodeEffects,
        'BACKGROUND_BLUR',
      );

    nodeEffectsTypeBackgroundBlur.forEach((eff) => {
      const radius = roundFloat(eff.radius || 0);

      if (radius > 0) filters.push(`blur(${this.numberToCssSize(radius)})`);
    });

    return filters.length > 0 ? filters.join(' ') : undefined;
  }

  cssBackgroundClip(): string | undefined {
    // Gradient text takes precedence: clip background to glyphs
    if (this.useGradientText()) return 'text';

    // If we apply backdrop-filter, clipping to padding-box usually matches Figma's inner/background blur bounds better.
    if (this.cssBackdropFilter()) return 'padding-box';

    return undefined;
  }

  // Vendor-prefixed background-clip for better browser coverage on text gradients
  cssWebkitBackgroundClip(): string | undefined {
    if (this.useGradientText()) return 'text';
    return undefined;
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

    // When using gradient text, the text color should be transparent so the background gradient shows through the glyphs
    if (this.useGradientText()) return 'transparent';

    const nodeLastFillTypeSolid =
      this.nodeFillsTypeSolid[this.nodeFillsTypeSolid.length - 1];

    return figmaPaintOrEffectCssRgba(nodeLastFillTypeSolid);
  }

  // Vendor-prefixed text fill color for Safari/WebKit
  cssWebkitTextFillColor(): string | undefined {
    if (this.nodeType !== 'TEXT') return undefined;
    if (this.useGradientText()) return 'transparent';
    return undefined;
  }

  // Determine if we should render text with a background gradient clipped to text
  private useGradientText(): boolean {
    if (this.nodeType !== 'TEXT') return false;

    // Any renderable gradient fill (linear/radial/conic) qualifies
    return this.hasRenderableGradientFill();
  }

  private hasRenderableGradientFill(): boolean {
    // Linear
    const hasLinear = (this.nodeFillsTypeGradientLinear || []).some((p) => {
      const rule = figmaGradientPaintToCssLinearGradient(p);
      return !!(rule && rule.length > 0);
    });
    if (hasLinear) return true;

    // Radial
    const nodeFillsTypeGradientRadial =
      figmaFilterVisiblePaints<FigmaTypes.GradientPaint>(
        this.nodeFills,
        'GRADIENT_RADIAL',
      );
    const hasRadial = nodeFillsTypeGradientRadial.some((p) => {
      const rule = figmaGradientPaintToCssRadialGradient(p);
      return !!(rule && rule.length > 0);
    });
    if (hasRadial) return true;

    // Conic
    const nodeFillsTypeGradientConic =
      figmaFilterVisiblePaints<FigmaTypes.GradientPaint>(
        this.nodeFills,
        'GRADIENT_ANGULAR',
      );
    const hasConic = nodeFillsTypeGradientConic.some((p) => {
      const rule = figmaGradientPaintToCssConicGradient(p);
      return !!(rule && rule.length > 0);
    });

    return hasConic;
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

  cssFontStyle(): csstype.Property.FontStyle | undefined {
    if (this.nodeType !== 'TEXT') return undefined;

    // Prefer explicit italic boolean if present
    type TypeStyleExtended = FigmaTypes.TypeStyle & {
      italic?: boolean;
      fontPostScriptName?: string;
    };
    const styleExtended = this.nodeStyle as TypeStyleExtended;
    if (styleExtended.italic === true) return 'italic';

    // Check common style name hints
    const styleName = styleExtended.fontPostScriptName || '';
    if (/italic|oblique/i.test(styleName)) return 'italic';

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

  cssFontVariantCaps(): csstype.Property.FontVariantCaps | undefined {
    if (this.nodeType !== 'TEXT') return undefined;

    if (this.nodeStyle.textCase === 'SMALL_CAPS') {
      return 'small-caps';
    }

    if (this.nodeStyle.textCase === 'SMALL_CAPS_FORCED') {
      return 'all-small-caps';
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

  cssGridAutoFlow(): csstype.Property.GridAutoFlow | undefined {
    if (this.nodeAsFrame.layoutMode !== 'GRID') return undefined;

    const hasCols =
      typeof this.nodeAsFrame.gridColumnCount === 'number' &&
      this.nodeAsFrame.gridColumnCount > 0;
    const hasRows =
      typeof this.nodeAsFrame.gridRowCount === 'number' &&
      this.nodeAsFrame.gridRowCount > 0;

    if (hasCols && !hasRows) return 'row';
    if (hasRows && !hasCols) return 'column';

    // If both are set or neither is set, let browser default apply
    return undefined;
  }

  cssPlaceContent(): string | undefined {
    if (this.nodeAsFrame.layoutMode !== 'GRID') return undefined;

    // Align-content (block/cross axis for grid)
    let alignPart: string | undefined;
    const alignContentVal =
      (this.nodeAsFrame.counterAxisAlignContent as unknown as string) || '';
    switch (alignContentVal) {
      case 'AUTO':
        alignPart = 'normal';
        break;
      case 'SPACE_BETWEEN':
        alignPart = 'space-between';
        break;
      case 'MIN':
        alignPart = 'start';
        break;
      case 'MAX':
        alignPart = 'end';
        break;
      case 'CENTER':
        alignPart = 'center';
        break;
      default:
        break;
    }

    // Justify-content (inline/main axis for grid) mapped from primaryAxisAlignItems
    let justifyPart: string | undefined;
    if (this.nodeAsFrame.primaryAxisAlignItems === 'MIN')
      justifyPart = 'flex-start';
    if (this.nodeAsFrame.primaryAxisAlignItems === 'MAX')
      justifyPart = 'flex-end';
    if (this.nodeAsFrame.primaryAxisAlignItems === 'CENTER')
      justifyPart = 'center';
    if (this.nodeAsFrame.primaryAxisAlignItems === 'SPACE_BETWEEN') {
      justifyPart =
        (this.nodeAsFrame.children?.length || 0) <= 1
          ? 'center'
          : 'space-between';
    }

    if (!alignPart && !justifyPart) return undefined;

    return `${alignPart || 'normal'} ${justifyPart || 'normal'}`;
  }

  cssPlaceItems(): string | undefined {
    if (this.nodeAsFrame.layoutMode !== 'GRID') return undefined;

    // Align-items mapped from counterAxisAlignItems
    let alignItemsPart: string | undefined;
    switch (this.nodeAsFrame.counterAxisAlignItems) {
      case 'MIN':
        alignItemsPart = 'start';
        break;
      case 'MAX':
        alignItemsPart = 'end';
        break;
      case 'CENTER':
        alignItemsPart = 'center';
        break;
      case 'BASELINE':
        alignItemsPart = 'baseline';
        break;
      default:
        break;
    }

    // Justify-items mapped from primaryAxisAlignItems
    let justifyItemsPart: string | undefined;
    switch (this.nodeAsFrame.primaryAxisAlignItems) {
      case 'MIN':
        justifyItemsPart = 'start';
        break;
      case 'MAX':
        justifyItemsPart = 'end';
        break;
      case 'CENTER':
        justifyItemsPart = 'center';
        break;
      case 'SPACE_BETWEEN':
        // Not valid for items; approximate with center
        justifyItemsPart = 'center';
        break;
      default:
        break;
    }

    if (!alignItemsPart && !justifyItemsPart) return undefined;

    return `${alignItemsPart || 'normal'} ${justifyItemsPart || 'normal'}`;
  }

  cssWhiteSpace(): csstype.Property.WhiteSpace | undefined {
    if (this.nodeType !== 'TEXT') return undefined;

    const text = this.nodeAsText?.characters || '';
    // Preserve hard line breaks and consecutive spaces
    if (/[\n\r\t]/.test(text) || / {2,}/.test(text)) {
      return 'pre-wrap';
    }

    return undefined;
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

  cssMarginBottom(): string | undefined {
    if (this.nodeType !== 'TEXT') return undefined;

    type TypeStyleExtended = FigmaTypes.TypeStyle & {
      paragraphSpacing?: number;
    };
    const spacing = (this.nodeStyle as TypeStyleExtended).paragraphSpacing;
    if (
      typeof spacing === 'number' &&
      !Number.isNaN(spacing) &&
      spacing !== 0
    ) {
      // Skip margin for last TEXT in its immediate parent group/frame
      const siblings = this.parent?.children || [];
      const idx = siblings.findIndex((c) => c === this);
      const hasNextTextSibling = siblings
        .slice(idx + 1)
        .some((c) => c.nodeType === 'TEXT');
      if (!hasNextTextSibling) return undefined;
      return this.numberToCssSize(roundFloat(spacing));
    }

    return undefined;
  }

  cssHeight(): string | undefined {
    const result = this.height();

    return typeof result === 'number' ? this.numberToCssSize(result) : result;
  }

  cssJustifyContent(): string | undefined {
    // For grid containers, prefer place-content shorthand and skip justify-content
    if (this.nodeAsFrame.layoutMode === 'GRID') return undefined;

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
    if (this.rootNode) {
      return undefined;
    }

    if (this.nodeAsFrame.layoutPositioning === 'ABSOLUTE') {
      if (this.parent?.rootNode) {
        return 'fixed';
      }

      return 'absolute';
    }

    if (this.nodeAsFrame.isFixed) {
      return 'fixed';
    }

    if (['SECTION', 'GROUP'].includes(this.parent?.nodeType)) {
      return 'absolute';
    }

    if (['NONE', undefined].includes(this.parent?.nodeAsFrame.layoutMode)) {
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

  private useLastLinearGradientStrokeAsBorderImage(): boolean {
    if (
      typeof this.uniformStrokeWeight !== 'number' ||
      this.uniformStrokeWeight <= 0
    ) {
      return false;
    }

    if (
      this.nodeAsFrame.strokeDashes &&
      this.nodeAsFrame.strokeDashes.length > 0
    ) {
      return false;
    }

    const paint = this.lastLinearGradientStroke;

    if (!paint) return false;

    const src = figmaGradientPaintToCssLinearGradient(paint);

    return !!src;
  }

  cssBorderImageSource(): string | undefined {
    if (!this.useLastLinearGradientStrokeAsBorderImage()) return undefined;

    const paint = this.lastLinearGradientStroke;

    if (!paint) return undefined;

    return figmaGradientPaintToCssLinearGradient(paint) || undefined;
  }

  cssBorderImageSlice(): string | undefined {
    if (!this.useLastLinearGradientStrokeAsBorderImage()) return undefined;

    return '1';
  }

  cssBorderImageRepeat(): string | undefined {
    if (!this.useLastLinearGradientStrokeAsBorderImage()) return undefined;

    return 'stretch';
  }

  cssZIndex(): string | undefined {
    if (!this.hoveringPosition) return undefined;

    const siblings = this.parent?.children || [];
    const idx = siblings.findIndex((c) => c === this);
    const z = idx >= 0 ? idx + 1 : 1; // 1-based to avoid 0 edge cases
    return z.toString();
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

    // SMALL_CAPS and SMALL_CAPS_FORCED are handled via fontVariantCaps

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
