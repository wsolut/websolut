import { app, ipcMain, dialog, BrowserWindow, nativeImage } from 'electron';
import { AppManager } from './app-manager';
import * as path from 'path';

const appManager = new AppManager(app);

app.name = 'Websolut';

if (process.platform === 'darwin') {
  const iconPath = path.join(__dirname, '../../resources/icon.png');
  const image = nativeImage.createFromPath(iconPath);
  if (app.dock) {
    app.dock.setIcon(image);
  }
}

app.on('ready', () => {
  if (process.platform === 'darwin') {
    app.setActivationPolicy('regular');
  }

  try {
    appManager.boot();
  } catch (err) {
    console.error(err);
  }
});

ipcMain.on('ping', () => console.log('pong'));

ipcMain.handle('serverStatus', () => appManager.backendServerStatus());

ipcMain.handle('startServer', async () => {
  await appManager.startServer();
  return appManager.backendServerStatus();
});

ipcMain.handle('stopServer', async () => {
  await appManager.stopServer();
  return appManager.backendServerStatus();
});

ipcMain.handle('pickFolder', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog({
    ...(win ? { window: win } : {}),
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths.length) {
    return null;
  }
  return result.filePaths[0];
});
