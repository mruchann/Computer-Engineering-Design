import path from "path";
import { app } from "electron";
import { createWindow } from "./helpers";
import "./services/torrentService";
import { setupAuthIPC } from "./ipc/auth";
import { ensureValidToken, setupTokenManager } from "./services/tokenManager";
import axios from "axios";
import config from "./config";
import fs from "fs";
import { seedFile } from "./client";


app.setPath('userData', `${app.getPath('userData')} (development)`)

// Initialize all IPC handlers immediately
setupAuthIPC();
setupTokenManager();

;(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.maximize();
  
  const port = process.argv[2];
  await mainWindow.loadURL(`http://localhost:${port}/`);
  // mainWindow.webContents.openDevTools();

})()


async function leaveNetwork() {
  // Get the current user info
  const authToken = await ensureValidToken();
  if (!authToken) {
    console.error('No access token found. Please log in.');
    return;
  }
  console.log("Inside of leaveNetwork function with", authToken);

  await axios.get(`${config.DJANGO_SERVER_URL}/api/shared-leave/`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    withCredentials: true,
  });
}

app.on('before-quit', async (event) => {
  event.preventDefault();
  await leaveNetwork();
  app.exit();
})
