import * as FigmaTypes from '@figma/rest-api-spec';
import { figmaRgbaToCssRgba } from './figma-rgba-to-css-rgba';

export function figmaGradientPaintToCssRgba(
  gradientPaint: FigmaTypes.GradientPaint,
): string | undefined {
  const stops = gradientPaint.gradientStops;
  const fillOpacity =
    gradientPaint.opacity !== undefined ? gradientPaint.opacity : 1;

  // If there's only one stop, return a solid color
  if (stops.length == 1) {
    const colorWithAlpha = {
      ...stops[0].color,
      a: stops[0].color.a * fillOpacity,
    };
    return figmaRgbaToCssRgba(colorWithAlpha);
  }

  return undefined;
}
