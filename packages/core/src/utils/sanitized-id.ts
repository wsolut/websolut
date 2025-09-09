import slugify from 'slugify';

export function sanitizedId(id: string): string {
  const sluggedId = slugify(id, {
    replacement: '-', // replace invalid chars with -
    lower: true, // convert to lower case
    strict: true, // strip special characters
  });

  return /^[a-z_]/.test(sluggedId) ? sluggedId : `i${sluggedId}`;
}
