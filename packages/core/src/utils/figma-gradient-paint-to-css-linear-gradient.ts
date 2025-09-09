import * as FigmaTypes from '@figma/rest-api-spec';
import { figmaGradientToAngle } from './figma-gradient-to-angle';
import { figmaRgbaToCssRgba } from './figma-rgba-to-css-rgba';
import { roundFloat } from './round-float';

export function figmaGradientPaintToCssLinearGradient(
  gradientPaint: FigmaTypes.GradientPaint,
): string | undefined {
  // Convert Figma gradient to CSS linear-gradient.
  const stops = gradientPaint.gradientStops;
  const handles = gradientPaint.gradientHandlePositions;
  const fillOpacity =
    gradientPaint.opacity !== undefined ? gradientPaint.opacity : 1;

  // Determine direction using handles
  const x1 = handles[0].x;
  const y1 = handles[0].y;
  const x2 = handles[1].x;
  const y2 = handles[1].y;
  const angle = figmaGradientToAngle(x1, y1, x2, y2);

  // If there's only one stop, return a solid color
  if (stops.length == 1) {
    // const colorWithAlpha = {
    //   ...stops[0].color,
    //   a: stops[0].color.a * fillOpacity,
    // };
    // return figmaRgbaToCssRgba(colorWithAlpha);
    return undefined;
  }

  // Build gradient stops
  const cssStops = stops.map((stop) => {
    const position = roundFloat(stop.position * 100); // Convert to percentage and round to int
    const colorWithAlpha = { ...stop.color, a: stop.color.a * fillOpacity };
    const rgbaColor = figmaRgbaToCssRgba(colorWithAlpha);

    return `${rgbaColor} ${position}%`;
  });

  // Construct CSS gradient
  return `linear-gradient(${angle}deg, ${cssStops.join(', ')})`;
}
