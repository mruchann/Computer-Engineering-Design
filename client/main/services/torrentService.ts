import { BrowserWindow, ipcMain, dialog } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { leechFile } from '../client';
import {
  copyFileToSharedDirectory,
} from '../util';
import config from '../config';
import { ensureValidToken } from './tokenManager';
import axios from 'axios';
import {sha256File} from '../crypto'
import { seedFile } from '../client';
import { connectWebSocket } from "./websocketService";

ipcMain.on('connect-websocket', async (event) => {
  console.log("Inside of connect-websocket callback.");
  await connectWebSocket();
})

ipcMain.on('shared-join', async (event) => {
  console.log("Inside of shared-join callback.");
  const files = await fs.readdir(config.TORRENT_PATH);

  files.forEach((file) => {
    console.log("File:", file);
    seedFile(path.join(config.TORRENT_PATH, file), "", false);
  });
});

ipcMain.on('leech-file', async (event, torrentId) => {
  await leechFile(torrentId);
});

ipcMain.on('dialog:dragAndDropFile', (event, filePath: string, groups: string[]) => {
  copyFileToSharedDirectory(filePath, groups);
});

ipcMain.handle('get-file-size', async (_, filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error('Failed to get file size:', error);
    return 0;
  }
});

// File upload dialog
ipcMain.handle('dialog:openFile', async () => {
  try {
    const window = BrowserWindow.getFocusedWindow();
    if (window === null) {
      console.warn('No focused window found when opening file dialog');
      return [];
    }

    const result = await dialog.showOpenDialog(window, {
      properties: ['openFile', 'multiSelections'],
    });

    return result.canceled ? [] : result.filePaths;
  } catch (error) {
    console.error('Error in dialog:openFile handler:', error);
    return [];  // Always return a value even on error
  }
});

ipcMain.handle('addAccess', async(event, group, fileName) =>{
  try{

    //const filePath = path.join(config.TORRENT_PATH, fileName);
    const fileBaseName = path.basename(fileName);
    const filePath =  path.join(config.TORRENT_PATH, fileBaseName);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const hash = sha256File(filePath);

    console.log("group is " + group);
    console.log("fileName is " + fileName);
    console.log("hash is " + hash);

    console.log("filePath:" + filePath);

    const response = await axios.post(
      `${config.DJANGO_SERVER_URL}/api/access/`,
      { group: group ,
        file_hash : hash
      },
    );
  }
  catch (error) {
    console.error('Failed for adding access!', error);
  }

} );

// Helper function to check if path is a directory
async function isDirectory(filePath: string) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

// Handle file copy to shared directory
ipcMain.handle('copy-to-shared', async (_event, filePath: string, groups: string[]) => {
  try {
     copyFileToSharedDirectory(filePath, groups);

     //const filePath = path.join(config.TORRENT_PATH, fileName);
    /* const fileBaseName = path.basename(filePath);
     const filePathConfig =  path.join(config.TORRENT_PATH, fileBaseName);
     const hash = sha256File(filePathConfig);
 
     console.log("fileName is " + filePathConfig);
     console.log("hash is " + hash);
 
     console.log("filePath:" + filePath);
 
     groups.forEach(async (group) => {

      console.log("group is " + group);
      
      const response = await axios.post(
        `${config.DJANGO_SERVER_URL}/api/access/`,
        { group: group ,
          file_hash : hash
        },
      );
     }); */

     return { success: true };    
  } catch (error) {
    console.error('Error copying file in copy-to-shared:', error);
    return { success: false, error: error.message };
  }
});

interface SharedFile {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedTime: Date;
}

ipcMain.handle('get-shared-files', async () => {
  try {
    const sharedDir = config.TORRENT_PATH;

    const files = await fs.readdir(sharedDir);

    const fileDetails: SharedFile[] = await Promise.all(
      files.map(async (fileName) => {
        const filePath = path.join(sharedDir, fileName);
        const stats = await fs.stat(filePath);
        
        return {
          name: fileName,
          path: filePath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modifiedTime: stats.mtime
        };
      })
    );

    return { success: true, files: fileDetails };
  } catch (error) {
    console.error('Error reading shared directory:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-torrent-path', () => {
  return config.TORRENT_PATH;
});

// Add this new handler
ipcMain.handle('scan-file', async (_event, filePath: string) => {
  try {
    const authToken = await ensureValidToken();
    if (!authToken) {
      throw new Error('Authentication required');
    }

    const response = await axios.post(
      `${config.DJANGO_SERVER_URL}/api/virus-scan/`,
      { file_path: filePath },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.is_safe;
  } catch (error) {
    console.error('Error scanning file:', error);
    throw error;
  }
});
