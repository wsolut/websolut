import { existsSync, rmSync, copyFileSync as fsCopyFileSync } from 'fs';

export function copyFileSync(source: string, destination: string): void {
  if (!existsSync(source)) {
    const message = `copyFileSync - Source file does not exist: "${source}"`;

    console.error(message);

    throw new Error(message);
  }

  if (existsSync(destination)) {
    rmSync(destination);
  }

  fsCopyFileSync(source, destination);
}
