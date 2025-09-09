import slugify from 'slugify';

export function sanitizedRoute(input: string): string {
  const sanitized = slugify(input, {
    replacement: '-',
    lower: true,
    strict: true,
  });

  return sanitized;
}
