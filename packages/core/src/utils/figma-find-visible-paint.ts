import * as FigmaTypes from '@figma/rest-api-spec';

export function figmaFindVisiblePaint<T = FigmaTypes.BasePaint>(
  paints: FigmaTypes.Paint[],
  type: FigmaTypes.Paint['type'],
): T | undefined {
  const paint = paints.find((p) => p.type === type);

  if (paint?.visible === false) return undefined;

  return paint as T | undefined;
}
