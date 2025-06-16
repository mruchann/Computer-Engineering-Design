import WebTorrent from 'webtorrent/index';
import fs from 'fs';
import path from 'path';
import { webContents } from 'electron';
import config from './config';
import { sendMetadataToElasticsearch } from './extract';
import {sha256File, encryptFile, decryptFile } from './crypto'
import { getFileName } from './util';
import axios from 'axios';
import { ensureValidToken } from "./services/tokenManager";

const client = new WebTorrent();
const filename2magnet = new Map();

function sendFilename2MagnetUpdate() {
  const data = Object.fromEntries(filename2magnet);
  webContents.getAllWebContents().forEach((wc) => {
    wc.send('update-filename2magnet', data);
  });
}

async function leechFile(torrentId: string, type: string = "normal"): Promise<void> {
  const torrentInSession = await client.get(torrentId);
  console.log("inside the leechFile function");

  if (torrentInSession !== null) {
    return;
  }
  console.log("torrent was not in session");
  client.add(torrentId, { path: config.TORRENT_PATH }, (torrent: any) => {
    console.log(`Leeching ${torrent.name} & Magnet Link: ${torrent.magnetURI}`);
    const intervalId = setInterval(function () {
      console.log(client.progress);
    }, 1000);

    torrent.on('infoHash', () => {
      // Emitted when the info hash of the torrent has been determined.
    });

    torrent.on('metadata', () => {
      //  Emitted when the metadata of the torrent has been determined.
      //  This includes the full contents of the .torrent file, including list of files,
      //  torrent length, piece hashes, piece length, etc.
    });

    torrent.on('ready', () => {
      // Emitted when the torrent is ready to be used (i.e. metadata is available and store is ready).
    });

    torrent.on('warning', (err) => {
      //  Emitted when there is a warning. This is purely informational
      //  and it is not necessary to listen to this event, but it may aid in debugging.
    });

    torrent.on('error', (err) => {
      // Emitted when the client encounters a fatal error.
      // The client is automatically destroyed and all torrents are removed and cleaned up when this occurs.
    });

    torrent.on('done', async () => {
      // Emitted when all the torrent files have been downloaded.
      try {
        clearInterval(intervalId);
        console.log(`${torrent.name} downloaded successfully.`);

        const sharedPath = path.join(config.TORRENT_PATH, torrent.name);
        const downloadPath = path.join(config.DOWNLOADS_PATH, torrent.name);

        // this also solves the zlib error.
        // before, users did not have the correct decryption key, so they could not decrypt the file into a zip file and then unzip it.
        if (type !== "backup") {
          // don't move the file to Downloads folder if the file was downloaded because of backup.
          await decryptFile(sharedPath, downloadPath);
          console.log("copied file to", downloadPath);

          // don't show popup if the file was downloaded because of backup.
          webContents.getAllWebContents().forEach((wc) => {
            wc.send('torrent-download-finished', {
              name: torrent.name,
              path: downloadPath,
            });
          });
        }

        // get the current user info
        const authToken = await ensureValidToken();
        if (!authToken) {
          console.error('No access token found. Please log in.');
          return;
        }

        // send shared files info for backup
        const sharedFilePayload = {
          magnetLink: torrent.magnetURI,
        }

        axios
            .post(`${config.DJANGO_SERVER_URL}/api/shared-join/`, sharedFilePayload, {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
              withCredentials: true,
            })
            .then((response) => {
              console.log('Successfully posted shared files info');
            })
            .catch((error) => {
              console.log('Error while posting the shared files info:', error);
            });

      } catch(error: any) {
        console.error("An error Occurred: ", error.message);
      }
    });

    torrent.on('download', (bytes) => {
      //  Emitted whenever data is downloaded. Useful for reporting the current torrent status.
      console.log('just downloaded: ' + bytes);
      console.log('total downloaded: ' + torrent.downloaded);
      console.log('download speed: ' + torrent.downloadSpeed);
      console.log('progress: ' + torrent.progress);
    });

    torrent.on('upload', (bytes) => {
      // Emitted whenever data is uploaded. Useful for reporting the current torrent status.
      // console.log('just uploaded: ' + bytes);
      // console.log('total uploaded: ' + torrent.uploaded);
      // console.log('upload speed: ' + torrent.uploadSpeed);
      // console.log(torrent.path);
    });

    torrent.on('wire', (wire, addr) => {
      // Emitted whenever a new peer is connected for this torrent.
      // wire is an instance of bittorrent-protocol, which is a node.js-style
      // duplex stream to the remote peer. This event can be used to specify custom BitTorrent protocol extensions.
      console.log('connected to peer with address ' + addr);
    });

    torrent.on('noPeers', (announceType) => {
      // Emitted whenever a DHT, tracker, or LSD announce occurs, but no peers have been found.
      // announceType is either 'tracker', 'dht', or 'lsd' depending on which announce occurred to trigger this event.
      // console.log(announceType);
    });
  });
}

function seedFile(absoluteFilePath: string, originalFilePath: string, send_to_elasticsearch: boolean = true): void {
  if (filename2magnet.has(absoluteFilePath)) {
    removeFile(absoluteFilePath);
  }

  if (!fs.existsSync(absoluteFilePath)) {
    console.log(`${absoluteFilePath} has been deleted.`);
    return;
  }

  if (fs.statSync(absoluteFilePath).isDirectory() && fs.readdirSync(absoluteFilePath).length === 0) {
    console.log("Cannot seed empty directory");
    return;
  }

  const isDirectory = fs.statSync(absoluteFilePath).isDirectory();

  client.seed(absoluteFilePath, { announce: config.TRACKERS }, async (torrent) => {
    filename2magnet.set(absoluteFilePath, torrent.magnetURI);
    sendFilename2MagnetUpdate();

    // Here, get the hash of the file
    const hash = sha256File(absoluteFilePath);
    if (send_to_elasticsearch) {
      await sendMetadataToElasticsearch(absoluteFilePath, originalFilePath, torrent.magnetURI, isDirectory, hash);
    }

    // Get the current user info
    const authToken = await ensureValidToken();
    if (!authToken) {
      console.error('No access token found. Please log in.');
      return;
    }

    // send shared files info for backup
    const sharedFilePayload = {
      hash: hash,
      filename: getFileName(absoluteFilePath),
      magnetLink: torrent.magnetURI,
    }

    axios
      .post(`${config.DJANGO_SERVER_URL}/api/shared-join/`, sharedFilePayload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        withCredentials: true,
      })
      .then((response) => {
        console.log('Successfully posted shared files info');
      })
      .catch((error) => {
        console.log('Error while posting the shared files info:', error);
      });

    console.log(`Seeding ${torrent.name} & Magnet Link: ${torrent.magnetURI}`);

    torrent.on('infoHash', () => {
      // Emitted when the info hash of the torrent has been determined.
    });

    torrent.on('metadata', () => {
      //  Emitted when the metadata of the torrent has been determined.
      //  This includes the full contents of the .torrent file, including list of files,
      //  torrent length, piece hashes, piece length, etc.
    });

    torrent.on('ready', () => {
      // Emitted when the torrent is ready to be used (i.e. metadata is available and store is ready).
    });

    torrent.on('warning', (err) => {
      //  Emitted when there is a warning. This is purely informational
      //  and it is not necessary to listen to this event, but it may aid in debugging.
    });

    torrent.on('error', (err) => {
      // Emitted when the client encounters a fatal error.
      // The client is automatically destroyed and all torrents are removed and cleaned up when this occurs.
    });

    torrent.on('download', (bytes) => {
      //  Emitted whenever data is downloaded. Useful for reporting the current torrent status.
      console.log('just downloaded: ' + bytes);
      console.log('total downloaded: ' + torrent.downloaded);
      console.log('download speed: ' + torrent.downloadSpeed);
      console.log('progress: ' + torrent.progress);
    });

    torrent.on('upload', (bytes) => {
      // Emitted whenever data is uploaded. Useful for reporting the current torrent status.
      console.log('just uploaded: ' + bytes);
      console.log('total uploaded: ' + torrent.uploaded);
      console.log('upload speed: ' + torrent.uploadSpeed);
      console.log(torrent.path);
    });

    torrent.on('wire', (wire, addr) => {
      // Emitted whenever a new peer is connected for this torrent.
      // wire is an instance of bittorrent-protocol, which is a node.js-style
      // duplex stream to the remote peer. This event can be used to specify custom BitTorrent protocol extensions.
      console.log(`connected to peer with address ${addr}`);
    });

    torrent.on('noPeers', (announceType) => {
      // Emitted whenever a DHT, tracker, or LSD announce occurs, but no peers have been found.
      // announceType is either 'tracker', 'dht', or 'lsd' depending on which announce occurred to trigger this event.
      // console.log(announceType);
    });
  });
}

function removeFile(file: string): void {
  client.remove(filename2magnet.get(file), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`Removed file ${file}`);
      filename2magnet.delete(file);
      sendFilename2MagnetUpdate();
    }
  });
}

// list torrents every 3 sec
setInterval(() => {
  client.torrents.forEach((torrent: any) => {
    console.log(torrent.name);
    sendFilename2MagnetUpdate();
  });
}, 3000);

export { seedFile, leechFile, sendFilename2MagnetUpdate };
