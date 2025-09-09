import { app, ipcMain, dialog, BrowserWindow } from 'electron';
import { AppManager } from './app-manager';

const appManager = new AppManager(app);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app
  .whenReady()
  .then(() => appManager.boot())
  .catch(console.error);

// Register ipc events down bellow
ipcMain.on('ping', () => console.log('pong'));

ipcMain.handle('serverStatus', () => {
  return appManager.backendServerStatus();
});
ipcMain.handle('startServer', async () => {
  await appManager.startServer();

  return appManager.backendServerStatus();
});
ipcMain.handle('stopServer', async () => await appManager.stopServer());

// IPC handler to open a folder picker dialog
ipcMain.handle('pickFolder', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog({
    // Only set 'window' if win is not null
    ...(win ? { window: win } : {}),
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths.length) {
    return null;
  }
  return result.filePaths[0];
});
