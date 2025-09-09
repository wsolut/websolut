export function roundFloat(number: number): number {
  const numStr = String(number);
  const decimalIndex = numStr.indexOf('.');

  if (decimalIndex === -1) {
    return number; // No decimal part, return as is
  }

  const decimalPartLength = numStr.length - decimalIndex - 1;

  if (decimalPartLength > 2) {
    return parseFloat(number.toFixed(2));
  }

  return number;
}
