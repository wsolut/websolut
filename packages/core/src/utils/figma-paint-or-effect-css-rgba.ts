import * as FigmaTypes from '@figma/rest-api-spec';
import { figmaRgbaToCssRgba } from './figma-rgba-to-css-rgba';
import { figmaPaintOrEffectRgba } from './figma-paint-or-effect-rgba';

export function figmaPaintOrEffectCssRgba(
  paintOrEffect?: FigmaTypes.Paint | FigmaTypes.Effect,
): string | undefined {
  const figmaRgba = figmaPaintOrEffectRgba(paintOrEffect);

  if (!figmaRgba) return undefined;

  return figmaRgbaToCssRgba(figmaRgba);
}
