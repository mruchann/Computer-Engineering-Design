export interface SharedFile {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedTime: Date;
}

export interface IpcRenderer {
  invoke(channel: string, ...args: any[]): Promise<any>;
  on(channel: string, func: (...args: any[]) => void): void;
  removeListener(channel: string, func: (...args: any[]) => void): void;
  send(channel: string, ...args: any[]): void;
  getSharedFiles: () => Promise<{ 
    success: boolean; 
    files?: SharedFile[]; 
    error?: string; 
  }>;
}

export interface ElectronWindow {
  electron: {
    ipcRenderer: IpcRenderer;
    leechFile: (magnetLink: string) => void;
    onFilename2MagnetUpdate: (callback: (event: any, data: any) => void) => void;
    login: () => void;
    openFileDialog: () => Promise<string[]>;
    getTorrentPath: () => Promise<string>;
    quitApp: () => void;
    refreshAccessToken: () => Promise<string | null>;
  };
}

declare global {
  interface Window extends ElectronWindow {}
} 