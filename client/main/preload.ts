import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, func);
    },
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args);
    },
    getSharedFiles: () => {
      return ipcRenderer.invoke('get-shared-files');
    },

    openFileDialog: () => {
      try {
        return ipcRenderer.invoke('dialog:openFile');
      } catch (error) {
        console.error('Error invoking dialog:openFile:', error);
        return Promise.resolve([]);
      }
    },

    getFileSize: (filePath: string) => ipcRenderer.invoke('get-file-size', filePath),
  },
  leechFile: (magnetLink) => ipcRenderer.send('leech-file', magnetLink),
  onFilename2MagnetUpdate: (callback) => ipcRenderer.on('update-filename2magnet', callback),
  login: () => ipcRenderer.send('login-attempt'),
  dragAndDropFileDialog: (filePath: string, groups: string[]) => ipcRenderer.send('dialog:dragAndDropFile', filePath, groups),
  getTorrentPath: () => ipcRenderer.invoke('get-torrent-path'),
  quitApp: () => ipcRenderer.send('quit-app'),
  refreshAccessToken: async () => {
    const { refreshAccessToken } = await import('../renderer/utils/refreshToken');
    return refreshAccessToken();
  },
  scanFile: (filePath: string) => ipcRenderer.invoke('scan-file', filePath),
  addAccess: ( event, group, fileName) => ipcRenderer.send('addAccess', event, group, fileName),
});

export type IpcHandler = typeof ipcRenderer

