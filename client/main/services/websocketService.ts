import { WebSocket } from 'ws';
import config from '../config';
import { ensureValidToken } from './tokenManager';
import { leechFile } from '../client';

let socket = null;

export async function connectWebSocket() {
  console.log("in connectWebSocket");
  if (socket) {
    return;
  }
  const token = await ensureValidToken();
  if (!token) {
    console.log('No access token available in connectWebSocket');
    return;
  }

  console.log('before creating websocket connection');

  socket = new WebSocket(
    `${config.DJANGO_WS_SERVER_URL}/?token=${token}`,
  );

  console.log('Created connection to websocket');

  socket.addEventListener('open', () => {
    console.log('WebSocket connection established.');
  });

  socket.addEventListener('message', async (event) => {
    const message = JSON.parse(event.data.toString());
    console.log('Message received:', message);
    await leechFile(message.magnet, "backup");
  });

  socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
  });

  socket.addEventListener('close', () => {
    console.log('WebSocket connection closed.');
  });
} 