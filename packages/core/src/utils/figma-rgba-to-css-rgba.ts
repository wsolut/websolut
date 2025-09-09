import * as FigmaTypes from '@figma/rest-api-spec';
import { roundFloat } from './round-float';

export function figmaRgbaToCssRgba(color: FigmaTypes.RGBA): string {
  const red = Math.round(color.r * 255);
  const green = Math.round(color.g * 255);
  const blue = Math.round(color.b * 255);
  const alpha = color.a !== undefined ? roundFloat(color.a) : 1; // Default to 1 if alpha is not defined

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
