import { writeFileSync } from 'fs';
import { dirname } from 'path';
import { createDirSync } from './create-dir-sync';

export function writeJsonFileSync(filePath: string, data: object): void {
  const content = JSON.stringify(data, null, 2);

  createDirSync(dirname(filePath));
  writeFileSync(filePath, content, 'utf-8');
}
