import { join } from 'path';
import { app } from 'electron';

export const browserWindowConfig = {
  width: 900,
  height: 670,
  show: false,
  autoHideMenuBar: true,
  ...(process.platform === 'linux'
    ? {
        icon: join(
          app.isPackaged ? process.resourcesPath : join(__dirname, '../../../resources'),
          'icon.png',
        ),
      }
    : {}),
  webPreferences: {
    preload: join(__dirname, '../preload/index.mjs'),
    sandbox: false,
  },
};
