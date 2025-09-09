import { mkdirSync, existsSync } from 'fs';

export function createDirSync(destination: string): void {
  if (existsSync(destination)) return;

  try {
    mkdirSync(destination, { recursive: true });
  } catch (error) {
    console.error(
      `createDirSync - Fail to create directory at: "${destination}"`,
      error,
    );

    throw error;
  }
}
