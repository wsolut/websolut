import * as FigmaTypes from '@figma/rest-api-spec';
import { figmaRgbaToCssRgba } from './figma-rgba-to-css-rgba';
import { roundFloat } from './round-float';

// Convert a Figma GRADIENT_ANGULAR paint to a CSS conic-gradient().
// - Uses handle[0] as center when available.
// - Multiplies stop alpha by paint.opacity.
// - Returns undefined for single-stop gradients.
export function figmaGradientPaintToCssConicGradient(
  gradientPaint: FigmaTypes.GradientPaint,
): string | undefined {
  const stops = gradientPaint.gradientStops || [];
  const handles = gradientPaint.gradientHandlePositions || [];
  const fillOpacity =
    gradientPaint.opacity !== undefined ? gradientPaint.opacity : 1;

  if (stops.length <= 1) return undefined;

  // Center position from handle[0]
  let atClause = '';
  if (handles[0]) {
    const cx = roundFloat((handles[0].x || 0) * 100);
    const cy = roundFloat((handles[0].y || 0) * 100);
    atClause = ` at ${cx}% ${cy}%`;
  }

  const cssStops = stops.map((stop) => {
    const position = roundFloat(stop.position * 100);
    const colorWithAlpha = { ...stop.color, a: stop.color.a * fillOpacity };
    const rgba = figmaRgbaToCssRgba(colorWithAlpha);
    return `${rgba} ${position}%`;
  });

  return `conic-gradient(${atClause.trim()}${atClause ? ', ' : ''}${cssStops.join(', ')})`;
}
