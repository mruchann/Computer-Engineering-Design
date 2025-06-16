import { ipcMain } from 'electron';
import { BrowserWindow } from 'electron';
import axios from 'axios';
import config from '../config';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshToken) {
    console.error('No refresh token available');
    return null;
  }

  try {
    const response = await axios.post(`${config.DJANGO_SERVER_URL}/api/auth/token/refresh/`, {
      refresh: refreshToken
    });

    if (response.status === 200) {
      const newToken = response.data.access;
      setAccessToken(newToken);
      return newToken;
    }
    return null;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}

export async function ensureValidToken(): Promise<string | null> {
  if (!accessToken) {
    return null;
  }

  try {
    // Try to use the token
    await axios.get(`${config.DJANGO_SERVER_URL}/api/users/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return accessToken;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Token is invalid, try to refresh
      const newToken = await refreshAccessToken();
      if (newToken) {
        return newToken;
      }
    }
    return null;
  }
}

// Set up IPC handlers for token management
export function setupTokenManager() {
  ipcMain.on('auth:token-updated', (_event, token: string | null) => {
    setAccessToken(token);
  });

  // Register refresh callback
  ipcMain.handle('auth:refresh-token', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;
    
    // Send request to renderer to refresh token
    const newToken = await window.webContents.executeJavaScript(`
      window.refreshAccessToken();
    `);
    
    if (newToken) {
      setAccessToken(newToken);
    }
    return newToken;
  });
} 