/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import fs from 'fs/promises';
import config from './config';
import { sha256File, encryptFile, decryptFile  } from './crypto';

import { fetchGroups } from './api';

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
  if (!filePath) {
    throw new Error('File path is undefined or empty');
  }
  
  // Use path module for safer path handling
  const basename = path.basename(filePath);
  return basename;
}

export function copyFileToSharedDirectory(sourcePath: string, groups: string[]) {
  try {
    const fileName = path.basename(sourcePath);
    const destPath = path.join(config.TORRENT_PATH, fileName);

    if (groups === undefined || groups === null || groups.length === 0) {
      fetchGroups().then((allGroups) => {
        allGroups.forEach(async (group) => {
          await encryptFile(sourcePath, destPath, group.id);
        });
      })
    }

    else {
      groups.forEach(async (group) => {
        await encryptFile(sourcePath, destPath, group);
      });
    }
  } catch (error) {
    console.error('Error copying file:', error);
    throw error;
  }
}