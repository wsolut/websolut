export function errorHasStack(e: unknown): e is { stack: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'stack' in e &&
    typeof (e as { stack?: unknown }).stack === 'string'
  );
}
