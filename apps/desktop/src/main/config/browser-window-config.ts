import { join } from 'path';
import icon from '../../../resources/icons/png/512x512.png?asset';

export const browserWindowConfig = {
  width: 900,
  height: 670,
  show: false,
  autoHideMenuBar: true,
  ...(process.platform === 'linux' ? { icon } : {}),
  webPreferences: {
    preload: join(__dirname, '../preload/index.mjs'),
    sandbox: false,
  },
};
