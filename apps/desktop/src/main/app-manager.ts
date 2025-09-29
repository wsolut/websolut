import { app, App, BrowserWindow, Tray, Menu, nativeImage, shell } from 'electron';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import * as fs from 'fs';
import * as path from 'path';
import { Manager as BackendManager, PortAlreadyInUseError } from 'websolut-backend';
import trayIconTemplate from '../../resources/trayIcon.png?asset';
import { browserWindowConfig } from './config/browser-window-config';
import chokidar, { FSWatcher } from 'chokidar';
import dotenv from 'dotenv';
import { copyDirSync, copyFileSync, createDirSync, readFileSync, writeFileSync } from './utils';

const DEFAULT_BACKEND_PORT = '5556';
const DEFAULT_OUT_DIR_PATH = './tmp';
const OUT_DIR_NAME = 'out';
const SHOW_ON_TRAY = true;
const QUIT_TIMEOUT = 1000;

dotenv.config();

export class AppManager {
  app: App;
  backendServer: BackendManager;
  tray!: Tray;
  win?: BrowserWindow;
  showOnTray: boolean = SHOW_ON_TRAY;
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

    // When User tries to open a second instance
    this.app.on('second-instance', () => {
      if (this.win) {
        if (this.win.isMinimized()) {
          this.win.restore();
        } else {
          this.win.show();
        }

        this.win.focus();
      }
    });

    if (!this.app.requestSingleInstanceLock()) {
      app.quit();
    }

    this.app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    this.app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        void this.quit();
      }
    });

    this.createMainWindow();

    if (this.showOnTray) {
      this.tray = this.createTrayIcon();
    }

    // On macOS, re-open the window when the dock icon is clicked
    this.app.on('activate', () => {
      if (this.win) {
        this.win.show(); // Show the window if it's hidden
        this.win.setSkipTaskbar(false);
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
    // Set quitting flag to bypass window close prevention
    this.isQuitting = true;

    // Close file watcher to prevent the process from hanging
    if (this.fileWatcher) {
      await this.fileWatcher.close();
      this.fileWatcher = undefined;
    }

    // Destroy tray to clean up resources
    if (this.tray) {
      this.tray.destroy();
    }

    await this.stopServer();

    // Force close the main window without triggering the close event prevention
    if (this.win && !this.win.isDestroyed()) {
      this.win.removeAllListeners('close'); // Remove the preventDefault listener
      this.win.close();
    }

    // Force quit the app
    this.app.quit();

    // If app.quit() doesn't work, force exit the process
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
      // In packaged app (after build), resources are in app.asar.unpacked
      sourcePath = path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'resources',
        'backend-spa',
      );
    } else {
      // In development mode, resources are in the project directory
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

  protected createTrayIcon(): Tray {
    const trayIcon = nativeImage.createFromPath(trayIconTemplate);
    const smallerTrayIcon = trayIcon.resize({ width: 20, height: 20 });
    smallerTrayIcon.setTemplateImage(true);

    const tray = new Tray(smallerTrayIcon);
    tray.setToolTip('Websolut Desktop App');
    tray.setContextMenu(this.createContextMenu());
    tray.setIgnoreDoubleClickEvents(true);

    // On Windows, also open the context menu on left-click for parity with macOS
    if (process.platform === 'win32') {
      tray.on('click', () => {
        tray.popUpContextMenu();
      });
    }

    return tray;
  }

  protected createContextMenu(): Menu {
    return Menu.buildFromTemplate([
      { label: 'Websolut Desktop App', enabled: false },
      { type: 'separator' },
      {
        label: 'Status',
        click: () => {
          if (this.win) {
            this.win.show();
            this.win.webContents.send('navigate-to', { route: '/' });
          }
        },
      },
      // { label: 'Check for updates' },
      { type: 'separator' },
      { label: 'Quit', click: () => void this.quit() },
    ]);
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

    // Ensure minimizing keeps the app visible in Dock/taskbar
    mainWindow.on('minimize', () => {
      if (process.platform === 'darwin') {
        void app.dock?.show();
      }
      // Keep in taskbar on Windows/Linux when minimized
      mainWindow.setSkipTaskbar(false);
    });

    // Ensure maximizing keeps Dock/taskbar visible
    mainWindow.on('maximize', () => {
      if (process.platform === 'darwin') {
        void app.dock?.show();
      }
      mainWindow.setSkipTaskbar(false);
    });

    // Ensure entering full-screen keeps Dock (app icon) and taskbar entry logic sane
    mainWindow.on('enter-full-screen', () => {
      if (process.platform === 'darwin') {
        void app.dock?.show();
      }
      mainWindow.setSkipTaskbar(false);
    });

    // Prevent the app from quitting when the window is closed
    mainWindow.on('close', (event) => {
      // Allow closing if we're in the process of quitting
      if (this.isQuitting) return;

      if (this.showOnTray) {
        // Prevent default behavior
        event.preventDefault();

        // Hide the window instead of closing it
        mainWindow.hide();

        // On macOS
        if (process.platform === 'darwin') {
          void this.app.dock?.hide(); // Hide the dock icon to mimic closing
        }
      } else {
        this.app.quit();
      }
    });

    mainWindow.on('show', function () {
      if (process.platform === 'darwin') {
        void app.dock?.show();
      }
      mainWindow.setSkipTaskbar(false);
    });

    mainWindow.on('hide', () => {
      const isMin = mainWindow.isMinimized();
      const isFS = mainWindow.isFullScreen();
      const isMax = mainWindow.isMaximized();

      // Only hide Dock icon when we're truly hiding to tray
      if (this.showOnTray) {
        if (process.platform === 'darwin' && !isMin && !isFS && !isMax) {
          void app.dock?.hide();
        }
      }

      // Remove from taskbar only when hiding to tray (not minimized/maximized/fullscreen)
      if (!isMin && !isFS && !isMax) {
        mainWindow.setSkipTaskbar(true);
      } else {
        mainWindow.setSkipTaskbar(false);
      }
    });
  }
}
