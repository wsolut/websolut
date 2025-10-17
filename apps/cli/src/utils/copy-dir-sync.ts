import * as path from 'path';
import { readdirSync, existsSync } from 'fs';
import { createDirSync } from './create-dir-sync';
import { copyFileSync } from './copy-file-sync';

export function copyDirSync(source: string, destination: string): void {
  if (!existsSync(source)) {
    const message = `copyDirSync - Source directory does not exist: "${source}"`;

    console.error(message);

    throw new Error(message);
  }

  const items = readdirSync(source, { withFileTypes: true });

  for (const item of items) {
    const sourcePath = path.join(source, item.name);
    const destinationPath = path.join(destination, item.name);

    if (item.isDirectory()) {
      createDirSync(destinationPath);

      copyDirSync(sourcePath, destinationPath);
    } else {
      copyFileSync(sourcePath, destinationPath);
    }
  }
}
