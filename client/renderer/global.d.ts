interface Window {
  electron: {
    ipcRenderer: {
      invoke(channel: string, ...args: any[]): Promise<any>;
      on(channel: string, func: (...args: any[]) => void): void;
      removeListener(channel: string, func: (...args: any[]) => void): void;
      send(channel: string, ...args: any[]): void;
      getSharedFiles(): Promise<any>;
      openFileDialog(): Promise<string[]>;
      getFileSize(filePath: string): Promise<number>;
    };
    leechFile(magnetLink: string): void;
    onFilename2MagnetUpdate(callback: Function): void;
    login(): void;
    dragAndDropFileDialog(filePath: string, groups: string[]): void;
    getTorrentPath(): Promise<string>;
    quitApp(): void;
    refreshAccessToken(): Promise<any>;
    scanFile(filePath: string): Promise<any>;
    addAccess(event: any, group: any, fileName: any): void;
  };
} 