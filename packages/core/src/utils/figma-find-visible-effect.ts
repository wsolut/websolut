import * as FigmaTypes from '@figma/rest-api-spec';

export function figmaFindVisibleEffect<T = FigmaTypes.Effect>(
  effects: FigmaTypes.Effect[],
  type: FigmaTypes.Effect['type'],
): T | undefined {
  const effect = effects.find((e) => e.type === type);

  if (
    effect &&
    'visible' in effect &&
    (effect as { visible?: boolean }).visible === false
  ) {
    return undefined;
  }

  return effect as T | undefined;
}
