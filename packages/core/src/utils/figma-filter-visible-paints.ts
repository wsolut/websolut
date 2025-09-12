import * as FigmaTypes from '@figma/rest-api-spec';

export function figmaFilterVisiblePaints<T = FigmaTypes.BasePaint>(
  paints: FigmaTypes.Paint[],
  type: FigmaTypes.Paint['type'],
): T[] {
  const visiblePaints = paints.filter((effect) => {
    if (effect.type !== type) return false;

    const visible = (effect as { visible?: boolean }).visible;

    return visible !== false;
  });

  return visiblePaints as T[];
}
