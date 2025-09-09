import * as FigmaTypes from '@figma/rest-api-spec';
import { roundFloat } from './round-float';

export function figmaPaintOrEffectRgba(
  paintOrEffect?: FigmaTypes.Paint | FigmaTypes.Effect,
): FigmaTypes.RGBA | undefined {
  if (!paintOrEffect) return undefined;

  const color: FigmaTypes.RGBA | undefined = (
    paintOrEffect as { color?: FigmaTypes.RGBA }
  ).color;

  if (!color) return undefined;

  const sanitizedColor: FigmaTypes.RGBA = { a: 1, ...color };
  const opacity = (paintOrEffect as { opacity?: number }).opacity;

  if (opacity) {
    sanitizedColor.a = roundFloat(sanitizedColor.a * opacity);
  }

  return sanitizedColor;
}
