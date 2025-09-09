export function figmaGradientToAngle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  // Calculate the angle of the gradient in degrees.
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;

  const angleRad = Math.atan2(deltaY, deltaX);
  const angleDeg = angleRad * (180 / Math.PI);

  // Adjust angle to match CSS conventions (0deg = up, 90deg = right)
  return angleDeg + 90;
}
