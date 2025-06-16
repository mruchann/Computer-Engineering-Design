interface Window {
    require: (module: string) => any;
    process: {
        type: string;
    };
    electron: {
        ipcRenderer: {
            invoke(channel: string, ...args: any[]): Promise<any>;
            on(channel: string, func: (...args: any[]) => void): void;
            removeListener(channel: string, func: (...args: any[]) => void): void;
        };
    };
}

interface IpcRenderer {
    on(channel: string, func: (...args: any[]) => void): void;
    removeListener(channel: string, func: (...args: any[]) => void): void;
    invoke(channel: string, ...args: any[]): Promise<any>;
} 