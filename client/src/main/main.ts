/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import chokidar from 'chokidar';
import WebSocket from 'ws';
import MenuBuilder from './menu';
import { leechFile, seedFiles } from './client';
import {
  findImmediatePathUnderShared,
  getFileName,
  copyFileToSharedDirectory,
} from './util';
import config from './config';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let watcher: chokidar.FSWatcher | null = null;
export const store: Map<string, any> = new Map();

ipcMain.on('leech-file', async (event, torrentId) => {
  await leechFile(torrentId);
});

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('start-watching', () => {
  if (!watcher) {
    watcher = chokidar.watch(config.TORRENT_PATH, {
      persistent: true,
    });

    watcher.on('all', async (event, filePath) => {
      // cp -r in copyFileToSharedDirectory is not atomic, wait for 0.5 seconds between updates to avoid conflicts
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(`${event} detected on: ${filePath}`);
      const share = findImmediatePathUnderShared(config.TORRENT_PATH, filePath);
      if (share !== config.TORRENT_PATH) {
        seedFiles(share, getFileName(share));
      }
    });

    console.log('Watcher started!');
  }
  connectWebSocket();
});

// File upload dialog
ipcMain.handle('dialog:openFile', async () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window === null) {
    return [];
  }
  const result = await dialog.showOpenDialog(window, {
    properties: ['openFile', 'openDirectory', 'multiSelections'],
  });
  if (result.canceled) {
    return [];
  }
  const response = [];
  for (const filePath of result.filePaths) {
    copyFileToSharedDirectory(filePath);
    response.push(getFileName(filePath));
    console.log('Seeding file', filePath);
  }
  return response;
});

ipcMain.on('dialog:dragAndDropFile', (event, filePath: string) => {
  copyFileToSharedDirectory(filePath);
});

ipcMain.on('update-local-storage', async (event, command, key, value) => {
  if (command === 'set') {
    store.set(key, value);
    console.log(`${key} is set to ${value}`);
  } else if (command === 'remove') {
    store.delete(key);
    console.log(`${key} is deleted`);
  } else if (command === 'clear') {
    store.clear();
    console.log(`Local storage is cleared.`);
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  // mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.loadURL(`http://${config.REACT_HOST}:${config.REACT_PORT}/`);

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
    process.exit();
  }
});

ipcMain.on('quit-app', () => {
  app.quit();
  process.exit();
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

function connectWebSocket() {
  console.log('Token is:::', store.get('access_token'));
  const socket = new WebSocket(
    `${config.DJANGO_WS_SERVER_URL}/?token=${store.get('access_token')}`,
  );

  socket.on('open', () => {
    console.log('WebSocket connection established.');
  });

  socket.on('message', async (data) => {
    const message = JSON.parse(data.toString());
    console.log('Message received:', message);
    await leechFile(message.magnet);
  });

  socket.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  socket.on('close', () => {
    console.log('WebSocket connection closed.');
  });
}
