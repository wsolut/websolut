import { existsSync, readFileSync as fsReadFileSync } from 'fs';

export function readFileSync(filePath: string): string {
  if (!existsSync(filePath)) {
    const message = `readFile - File does not exist: "${filePath}"`;

    console.error(message);

    throw new Error(message);
  }

  try {
    const content = fsReadFileSync(filePath, 'utf-8');

    return content;
  } catch (error) {
    console.error(`readFile - Fail to read file at: "${filePath}"`, error);

    throw error;
  }
}
