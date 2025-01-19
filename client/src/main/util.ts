/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import fs from 'fs';
import config from './config';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function findImmediatePathUnderShared(
  sharedPath: string,
  filePath: string,
): string {
  const parts1 = sharedPath.split(path.sep);
  const parts2 = filePath.split(path.sep);

  let i = 0;
  while (i < parts1.length && i < parts2.length && parts1[i] === parts2[i]) {
    i++;
  }

  return parts2.slice(0, i + 1).join(path.sep) || path.sep;
}

export function getFileName(filePath: string): string {
  return filePath.split(path.sep).slice(-1)[0];
}

export function copyFileToSharedDirectory(absoluteFilePath: string): void {
  const filename = getFileName(absoluteFilePath);
  const destination = path.join(config.TORRENT_PATH, filename);
  // cp -r absoluteFilePath ~/shared/filename
  fs.cpSync(absoluteFilePath, destination, { recursive: true });
}
