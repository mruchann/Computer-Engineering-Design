// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  leechFile: (magnetLink) => ipcRenderer.send('leech-file', magnetLink),
  onFilename2MagnetUpdate: (callback) => ipcRenderer.on('update-filename2magnet', callback),
  login: () => ipcRenderer.send('login-attempt'),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  dragAndDropFileDialog: (filePath: string) => ipcRenderer.send('dialog:dragAndDropFile', filePath),
  startWatching: () => ipcRenderer.send('start-watching'),
  updateLocalStorage: (command: string, key: string | null, value: string | null) => ipcRenderer.send('update-local-storage', command, key, value),

  quitApp: () => ipcRenderer.send('quit-app'),
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
