import path from 'path';
import { env } from 'node:process';

const config = {
  TORRENT_PATH: path.join(env.HOME, 'shared'), // must be an absolute path, should be configurable by user in future
  DOWNLOADS_PATH: path.join(env.HOME, 'Downloads'),
  TRACKERS: ['ws://144.122.71.171:8080/announce'],
  DJANGO_SERVER_URL: 'http://localhost:8000',
  DJANGO_WS_SERVER_URL: 'ws://localhost:8000/ws',
  REACT_HOST: 'localhost',
  REACT_PORT: '1212',
};

export function getTorrentPath() {
  return config.TORRENT_PATH;
}

export default config;
