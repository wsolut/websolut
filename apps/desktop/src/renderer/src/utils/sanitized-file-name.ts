const ILLEGAL_REGEX = /[/?<>\\:*|"]/g;
// eslint-disable-next-line no-control-regex
const CONTROL_REGEX = /[\x00-\x1f\x80-\x9f]/g;
const RESERVED_REGEX = /^\.+$/;
const WINDOWS_RESERVED_REGEX = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
const WINDOWS_TRAILING_REGEX = /[. ]+$/;

function truncateToBytes(str: string, maxBytes: number): string {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);

  if (encoded.length <= maxBytes) {
    return str;
  }

  // Truncate byte by byte until we're under the limit
  let truncated = str;
  while (encoder.encode(truncated).length > maxBytes && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }

  return truncated;
}

export function sanitizedFileName(input: string, replacement: string = '-'): string {
  const sanitized = input
    .trim()
    .replace(/^\/+/, '')
    .replace(ILLEGAL_REGEX, replacement)
    .replace(CONTROL_REGEX, replacement)
    .replace(RESERVED_REGEX, replacement)
    .replace(WINDOWS_RESERVED_REGEX, replacement)
    .replace(WINDOWS_TRAILING_REGEX, replacement);

  return truncateToBytes(sanitized, 255);
}
