import path from 'path';
import { env } from 'node:process';

const config = {
  TORRENT_PATH: path.join(env.HOME, 'shared'), // must be an absolute path, should be configurable by user in future
  TRACKERS: ['ws://144.122.71.171:8080/announce'],
  DJANGO_SERVER_URL: 'http://144.122.71.171',
  DJANGO_WS_SERVER_URL: 'ws://144.122.71.171/ws',
  REACT_HOST: 'localhost',
  REACT_PORT: '1212',
};
export default config;
