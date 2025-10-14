import { app, App, BrowserWindow, shell } from 'electron';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import * as fs from 'fs';
import * as path from 'path';
import { Manager as BackendManager, PortAlreadyInUseError } from 'websolut-backend';
import { browserWindowConfig } from './config/browser-window-config';
import chokidar, { FSWatcher } from 'chokidar';
import dotenv from 'dotenv';
import { copyDirSync, copyFileSync, createDirSync, readFileSync, writeFileSync } from './utils';

const DEFAULT_BACKEND_PORT = '5556';
const DEFAULT_OUT_DIR_PATH = './tmp';
const OUT_DIR_NAME = 'out';
const QUIT_TIMEOUT = 1000;

dotenv.config();

export class AppManager {
  app: App;
  backendServer: BackendManager;
  win?: BrowserWindow;
  backendServerError: string = '';
  private fileWatcher?: FSWatcher;
  private isQuitting: boolean = false;

  constructor(app: App) {
    this.app = app;

    const outDirPath = app.isPackaged
      ? path.join(app.getPath('userData'), OUT_DIR_NAME)
      : process.env.OUT_DIR_PATH || DEFAULT_OUT_DIR_PATH;

    this.backendServer = new BackendManager({
      outDirPath,
      logToFileSystem: app.isPackaged,
    });
  }

  backendServerStatus() {
    const running = this.backendServer.running;
    const error = this.backendServerError;
    const baseUrl = running ? this.backendServer.baseUrl : '';

    return { running, error, baseUrl };
  }

  boot(): void {
    electronApp.setAppUserModelId('com.electron');

    this.app.on('second-instance', () => {
      if (this.win) {
        if (this.win.isMinimized()) {
          this.win.restore();
        }
        this.win.show();
        this.win.focus();
      }
    });

    if (!this.app.requestSingleInstanceLock()) {
      app.quit();
    }

    this.app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    this.app.on('window-all-closed', () => {
      void this.quit();
    });

    this.createMainWindow();

    this.app.on('activate', () => {
      if (this.win) {
        this.win.show();
        this.win.focus();
        if (process.platform === 'darwin') {
          try {
            void app.dock?.show();
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        this.createMainWindow();
      }
    });
  }

  async startServer(): Promise<void> {
    this.backendServerError = '';

    try {
      await this.backendServer.startServer(
        Number(process.env.BACKEND_PORT || DEFAULT_BACKEND_PORT),
      );

      this.copyBackendSpaFiles(this.backendServer.config.spaDirPath);
      this.updateBackendBaseUrl(this.backendServer.config.spaDirPath);
    } catch (error) {
      if (error instanceof PortAlreadyInUseError) {
        this.backendServerError = 'port in use';
      } else {
        console.error('Error starting backend server:', error);

        return this.app.quit();
      }
    }
  }

  async stopServer(): Promise<void> {
    await this.backendServer.stopServer();
  }

  async quit(): Promise<void> {
    this.isQuitting = true;

    if (this.fileWatcher) {
      await this.fileWatcher.close();
      this.fileWatcher = undefined;
    }

    await this.stopServer();

    if (this.win && !this.win.isDestroyed()) {
      this.win.removeAllListeners('close');
      this.win.close();
    }

    this.app.quit();

    setTimeout(() => {
      console.log('Force exiting process...');
      process.exit(0);
    }, QUIT_TIMEOUT);
  }

  protected updateBackendBaseUrl(destinationPath: string) {
    let content = readFileSync(path.join(destinationPath, 'index.html'));

    content = content.replace(
      /backendBaseUrl="(.*?)"/g,
      `backendBaseUrl="${this.backendServer.baseUrl}"`,
    );

    writeFileSync(path.join(destinationPath, 'index.html'), content);
  }

  protected copyBackendSpaFiles(destinationPath: string) {
    createDirSync(destinationPath);

    let sourcePath: string;

    if (app.isPackaged) {
      sourcePath = path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'resources',
        'backend-spa',
      );
    } else {
      sourcePath = path.join(__dirname, '..', '..', 'resources', 'backend-spa');
    }

    try {
      copyDirSync(sourcePath, destinationPath);

      if (is.dev) {
        this.watchBackendSpa(sourcePath, destinationPath);
      }
    } catch (error) {
      console.error('Error copying renderer files:', error);
    }
  }

  protected watchBackendSpa(sourcePath: string, destinationPath: string) {
    this.fileWatcher = chokidar.watch(sourcePath).on('all', (event, sourceFilePath) => {
      if ((event === 'add' || event === 'change') && fs.statSync(sourceFilePath).isFile()) {
        const destinationFilePath = sourceFilePath.replace(sourcePath, destinationPath);

        copyFileSync(sourceFilePath, destinationFilePath);
      }
    });
  }

  protected createMainWindow(options?: { devTools?: boolean }) {
    const mainWindow = new BrowserWindow(browserWindowConfig);

    this.win = mainWindow;

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      void mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}`);
    } else {
      void mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
    }

    if (options?.devTools === true) {
      mainWindow.webContents.once('did-frame-finish-load', () => {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      });
    }

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url).catch((error) => {
        console.error('Error opening external URL:', error);
      });

      return { action: 'deny' };
    });

    mainWindow.on('ready-to-show', () => {
      mainWindow.show();
    });

    mainWindow.on('closed', () => {
      this.win = undefined;
    });

    mainWindow.on('close', () => {
      if (this.isQuitting) return;
    });
  }
}
