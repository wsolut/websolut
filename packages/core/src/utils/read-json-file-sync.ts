import { existsSync, readFileSync } from 'fs';

export function readJsonFileSync(filePath: string): unknown {
  if (!existsSync(filePath)) return undefined;

  const content = readFileSync(filePath, 'utf-8');

  try {
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to read JSON file ${filePath}:`, error);
  }
}
