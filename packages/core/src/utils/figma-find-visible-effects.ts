import * as FigmaTypes from '@figma/rest-api-spec';

export function figmaFindVisibleEffects<T = FigmaTypes.Effect>(
  effects: FigmaTypes.Effect[],
  type: FigmaTypes.Effect['type'],
): T[] {
  const visibleEffects = effects.filter((effect) => {
    if (effect.type !== type) return false;

    const visible = (effect as { visible?: boolean }).visible;

    return visible !== false;
  });

  return visibleEffects as T[];
}
