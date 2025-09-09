import { writeFileSync as fsWriteFileSync } from 'fs';

export function writeFileSync(filePath: string, content: string): void {
  try {
    fsWriteFileSync(filePath, content, 'utf-8');
  } catch (error) {
    console.error(`writeFile - Fail to write file at: "${filePath}"`, error);

    throw error;
  }
}
