import { spawn } from 'child_process';
import axios from 'axios';
import { getFileName } from './util';
import config from './config';
import { ensureValidToken } from "./services/tokenManager";
import fs from 'fs';

async function sendMetadataToElasticsearch(
  absoluteFilePath: string,
  originalFilePath: string,
  magnetLink: string,
  isDirectory: boolean,
  hash: string,
): Promise<void> {
  const child = spawn('extract', [originalFilePath]);

  let output = '';

  child.stdout.on('data', (data) => {
    output += data.toString();
  });

  child.stderr.on('data', (data) => {
    console.error(`Stderr: ${data}`);
  });

  child.on('close', async (code) => {
    console.log(`Metadata extraction process exited with code ${code}`);
    console.log(`Metadata is: ${output}`);

    const metadata = convertToJSON(output);
    metadata.filename = getFileName(absoluteFilePath);
    metadata.magnetLink = magnetLink;
    const now = new Date();
    metadata.timestamp = now.toISOString();
    metadata.isDirectory = isDirectory;
    metadata.hash = hash;
    // metadata owner is assigned in the server side (using request.user)
    const stats = fs.statSync(originalFilePath);
    metadata.size = stats.size; // this is in bytes

    console.log('Hash:', hash);

    // Get the current user info
    const authToken = await ensureValidToken();
    if (!authToken) {
      console.error('No access token found. Please log in.');
      return;
    }

    // send metadata info to elasticsearch
    axios
      .post(`${config.DJANGO_SERVER_URL}/api/index-metadata/`, metadata, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        withCredentials: true,
      })
      .then((response) => {
        console.log('Success:', response.data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });

  });
}

function convertToJSON(output: string): any {
  const lines = output.split('\n');
  const json = {};

  lines.slice(1).forEach(line => {
    if (line.trim()) {
      const [key, ...val] = line.split(' - ');
      const value = val.join(' - ').trim()
      if (key && value) {
        json[key.trim()] = value;
      }
    }
  });

  return json;
}

export {
  sendMetadataToElasticsearch,
};
