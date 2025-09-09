import { ElectronAPI } from '@electron-toolkit/preload';

export type Api = {
  ping: () => void;
  serverStatus: () => Promise<{ running: boolean; baseUrl: string; error: string }>;
  startServer: () => Promise<{ running: boolean; baseUrl: string; error: string }>;
  stopServer: () => Promise<void>;
  onMessage: (channel: string, callback: (data?: Record<string, unknown>) => void) => void;
  pickFolder: () => Promise<string | null>;
};

declare global {
  interface Window {
    electron: ElectronAPI;
    api: Api;
  }
}
