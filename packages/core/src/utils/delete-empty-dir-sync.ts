import { existsSync, readdirSync, rmdirSync } from 'fs';

export function deleteEmptyDir(dirPath: string) {
  if (existsSync(dirPath)) {
    const files = readdirSync(dirPath);

    if (files.length === 0) {
      rmdirSync(dirPath);
    }
  }
}
