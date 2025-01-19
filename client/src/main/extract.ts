import { spawn } from 'child_process';
import axios from 'axios';
import { getFileName } from './util';
import config from './config';

import {store} from "./main";

function sendMetadataToElasticsearch(
  absoluteFilePath: string,
  relativeFilePath: string,
  magnetLink: string,
  isDirectory: boolean,
): void {
  const child = spawn('extract', [absoluteFilePath]);

  let output = '';

  child.stdout.on('data', (data) => {
    output += data.toString();
  });

  child.stderr.on('data', (data) => {
    console.error(`Stderr: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);

    const metadata = convertToJSON(output);
    metadata.filename = getFileName(absoluteFilePath);
    metadata.magnetLink = magnetLink;
    // metadata.uploader = USER ???
    metadata.relativeFilePath = relativeFilePath;
    const now = new Date();
    metadata.timestamp = now.toISOString();
    metadata.isDirectory = isDirectory;

    console.log(
      'Extracted Metadata as JSON:',
      JSON.stringify(metadata, null, 2),
    );

    // Get the access token from localStorage
    const authToken = store.get('access_token');

    if (!authToken) {
      console.error('No access token found. Please log in.');
      // Optionally redirect to login or handle this error
      return;
    }

    axios
      .post(`${config.DJANGO_SERVER_URL}/index-metadata/`, metadata, {
        headers: {
          Authorization: `Bearer ${authToken}`, // Or 'Token <authToken>' depending on your backend
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

function convertToJSON(output: string): object {
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
