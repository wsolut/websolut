export function safeParseJson<T>(
  jsonString: string | undefined | null,
  defaultValue: T,
): T {
  if (jsonString === undefined || jsonString === null) return defaultValue;

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn(`Failed to parse JSON: ${error}`);
    return defaultValue;
  }
}
