export function resetToBaseline(
  target: Record<string, unknown>,
  template: Record<string, unknown>,
): void {
  Object.keys(template).forEach((key) => {
    const templateValue = template[key];
    const targetValue = target[key];

    if (Array.isArray(templateValue)) {
      target[key] = [];
    } else if (
      templateValue !== null &&
      typeof templateValue === 'object' &&
      !Array.isArray(templateValue)
    ) {
      if (!targetValue || typeof targetValue !== 'object') {
        target[key] = {};
      }
      resetToBaseline(
        target[key] as Record<string, unknown>,
        templateValue as Record<string, unknown>,
      );
    } else {
      target[key] = templateValue;
    }
  });
}
