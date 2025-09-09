function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function safeMergeData(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): void {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];

      if (isRecord(sourceValue)) {
        if (!target[key] || !isRecord(target[key])) {
          target[key] = {};
        }
        safeMergeData(target[key] as Record<string, unknown>, sourceValue);
      } else {
        target[key] = sourceValue;
      }
    }
  }
}
