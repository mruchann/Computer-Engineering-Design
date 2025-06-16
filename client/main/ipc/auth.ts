import { ipcMain } from 'electron';
import { setAccessToken, setRefreshToken } from '../services/tokenManager';

export function setupAuthIPC() {
  ipcMain.on('auth:token-updated', (_event, token: string) => {
    setAccessToken(token);
  });

  ipcMain.on('auth:refresh-token-updated', (_event, token: string) => {
    setRefreshToken(token);
  });
} 