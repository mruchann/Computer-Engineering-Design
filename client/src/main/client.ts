import WebTorrent from 'webtorrent/index';
import fs from 'fs';
import path from 'path';
import { webContents } from 'electron';
import config from './config';
import { sendMetadataToElasticsearch } from './extract';

const client = new WebTorrent();
const filename2magnet = new Map();

function sendFilename2MagnetUpdate() {
  const data = Object.fromEntries(filename2magnet);
  webContents.getAllWebContents().forEach((wc) => {
    wc.send('update-filename2magnet', data);
  });
}

async function leechFile(torrentId: string): Promise<void> {
  const torrentInSession = await client.get(torrentId);
  if (torrentInSession !== null) {
    return;
  }
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

    torrent.on('done', () => {
      // Emitted when all the torrent files have been downloaded.
      clearInterval(intervalId);
      console.log(`${torrent.name} downloaded successfully.`);
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

function seedFiles(absoluteFilePath: string, relativeFilePath: string): void {
  seedFile(absoluteFilePath, relativeFilePath);

  if (fs.statSync(absoluteFilePath).isFile()) {
    return;
  }

  fs.readdirSync(absoluteFilePath).forEach((file) => {
    const filePath = path.join(absoluteFilePath, file);

    const stats = fs.statSync(filePath);
    const newRelativeFilePath = path.join(relativeFilePath, file);

    seedFile(filePath, newRelativeFilePath);

    if (stats.isDirectory()) {
      seedFiles(filePath, newRelativeFilePath);
    }
  });
}

function seedFile(absoluteFilePath: string, relativeFilePath: string): void {
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

  client.seed(absoluteFilePath, { announce: config.TRACKERS }, (torrent) => {
    filename2magnet.set(absoluteFilePath, torrent.magnetURI);
    sendFilename2MagnetUpdate();
    sendMetadataToElasticsearch(absoluteFilePath, relativeFilePath, torrent.magnetURI, isDirectory);
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

export { seedFiles, leechFile, sendFilename2MagnetUpdate };
