import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { Api } from './@types';

// Custom APIs for renderer
const api: Api = {
  ping: () => ipcRenderer.send('ping'),
  serverStatus: () => ipcRenderer.invoke('serverStatus'),
  startServer: () => ipcRenderer.invoke('startServer'),
  stopServer: () => ipcRenderer.invoke('stopServer'),
  onMessage: (channel: string, callback: (data?: Record<string, unknown>) => void) => {
    // Create a secure handler to prevent leaking ipcRenderer
    const secureCallback = (_event: unknown, data?: Record<string, unknown>) => callback(data);
    ipcRenderer.on(channel, secureCallback);
  },
  pickFolder: () => ipcRenderer.invoke('pickFolder'),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
