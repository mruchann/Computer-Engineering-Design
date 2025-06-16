import * as crypto from 'crypto';
import fs from 'fs';
import config from './config';
import axios from 'axios';
import zlib from 'zlib';
import { sendMetadataToElasticsearch } from './extract';
import { seedFile } from './client';


// Function to get file size
function getFileSize(path: string): number {
  return fs.statSync(path).size;
}

// Function to calculate SHA-256 checksum
function getChecksum(path: string): string {
  const fileBuffer = fs.readFileSync(path);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

export function sha256File(filePath: string): string {
  try {
    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Create a SHA-256 hash instance
    const hash = crypto.createHash('sha256');

    // Update the hash with the file buffer
    hash.update(fileBuffer);

    // Compute the digest in hexadecimal format
    return hash.digest('hex');
  } catch(error: any) {
    console.error("An error Occurred: ", error.message);
  }
}

async function copyEncryptedFileToShared(response: any, inputPath: string, outputPath: string) {
  try {
    return new Promise<void>((resolve, reject) => {
      console.log('AES Key:', response.data.aes_key);

      // IV = INITIALIZATION VECTOR
      // IV HAS NO CRYPTOGRAPHIC VALUE UNLIKE KEY BUT IT MUST BE USED AS AN ADDITIONAL INPUT
      const key = String(response.data.aes_key);
      console.log("key from group:", key);
      const ENCRYPTION_KEY = Buffer.from(String(key), 'hex');

      const cipher =  crypto.createCipheriv('aes-128-cbc', ENCRYPTION_KEY, IV);

      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);
      const gzip = zlib.createGzip();

      // Encrypt → Compress → Save
      input.pipe(gzip).pipe(cipher).pipe(output).on('finish', () => {
        console.log(`Compression complete: ${inputPath} -> ${outputPath}`);
        console.log(`Original Size: ${getFileSize(inputPath)} bytes`);
        console.log(`Compressed Size: ${getFileSize(outputPath)} bytes`);
      });

      output.on('close', () => {
        console.log(`Encrypted file written to: ${outputPath}`);
        seedFile(outputPath, inputPath);
        resolve();
      });

      output.on('error', (err) => {
        console.error(`Error in compression/encryption: ${err.message}`);
        reject(err);
      });
    });
  } catch(error: any) {
    console.error("An error Occurred: ", error.message);
  }

}

async function copyDecryptedDecompressedFileToDownloads(response: any, inputPath: string, outputPath: string) {
  try {
    return new Promise<void>((resolve, reject) => {
      console.log('AES Key:', response.data.aes_key);

      const key = String(response.data.aes_key);
      console.log("Key from hash:", key);
      const ENCRYPTION_KEY = Buffer.from(key, 'hex');

      const decipher = crypto.createDecipheriv('aes-128-cbc', ENCRYPTION_KEY, IV);

      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);

      try {
        // Decrypt → Decompress → Save
        const gunzip = zlib.createGunzip();
        input.pipe(decipher).pipe(gunzip).pipe(output).on('finish', () => {
          console.log(`Decompression complete: ${inputPath} -> ${outputPath}`);
          console.log(`Original Checksum: ${getChecksum(inputPath)}`);
          console.log(`Decompressed Checksum: ${getChecksum(outputPath)}`);
        });
      } catch(error: any) {
        console.error("An error occurred while unzipping:", error.message);
        reject(error);
      }

      output.on('finish', () => {
        console.log(`Decrypted and decompressed file written to: ${outputPath}`);
        resolve();
      });

      output.on('error', (err) => {
        console.error(`Error in decryption/decompression: ${err.message}`);
        reject(err);
      });
    });
  } catch(error: any) {
    console.error("An error Occurred: ", error.message);
  }
}

// BELOW IS FOR ENCRYPTION

// VALUES BELOW ARE HARDCODED JUST FOR NOW, WE WILL ASK FOR THE KEY FROM THE SERVER
// IN THE FUTURE ONCE WE THINK HOW TO HANDLE IT
//const ENCRYPTION_KEY = Buffer.from('0123456789abcdef0123456789abcdef', 'hex');

const IV = Buffer.from('0123456789abcdef0123456789abcdef', 'hex');

/**
 * @param {string} inputPath - PATH OF THE FILE TO ENCRYPT.
 * @param {string} outputPath - PATH OF THE FILE TO DECRYPT.
 * @param group
 */
 export async function encryptFile(inputPath: string, outputPath: string, group: string) {
  try {
    console.log("getKeyByGroup called!");

    console.log('group in key:' + group);

    // http://localhost:8000/api/groups/keys/b22594c8a065c2b5b4c0c59c4dc1546785b10b9b37b7c09aea51a93c34cdd8a2/
    const url = `${config.DJANGO_SERVER_URL}/api/groups/groupkeys/${group}/`;

    const response = await axios.get(url);

    await copyEncryptedFileToShared(response, inputPath, outputPath);
  } catch(error: any) {
    console.error("An error Occurred: ", error.message);
  }
}


/**
 * Decrypts an AES-encrypted file.
 * 
 * @param {string} inputPath - Path to the encrypted file.
 * @param {string} outputPath - Path to save the decrypted file.
 */
 export async function decryptFile(inputPath: string, outputPath: string): Promise<void>  {
  try {
    console.log("getKey called!");

    const hash = sha256File(inputPath);

    console.log('getKey called!');
    console.log('hash in key:' + hash);

    // http://localhost:8000/api/groups/keys/b22594c8a065c2b5b4c0c59c4dc1546785b10b9b37b7c09aea51a93c34cdd8a2/
    const url = `${config.DJANGO_SERVER_URL}/api/groups/keys/${hash}/`;

    axios.get(url, {})
         .then(response => copyDecryptedDecompressedFileToDownloads(response, inputPath, outputPath))
         .catch(error => console.error("An error occurred while fetching the AES key:", error.message));
      //console.log('AES Key:', response.data.aes_key);

      // IV = INITIALIZATION VECTOR
      // IV HAS NO CRYPTOGRAPHIC VALUE UNLIKE KEY BUT IT MUST BE USED AS AN ADDITIONAL INPUT

      /*
      var key =  String(response.data.aes_key);
      console.log("key from hash:", key);
      const ENCRYPTION_KEY = Buffer.from( String(key) , 'hex');
      const decipher = crypto.createDecipheriv('aes-128-gcm', ENCRYPTION_KEY, IV); 

      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);

      input.pipe(decipher).pipe(output);

      output.on('finish', () => {
        console.log(`Decrypted file written to: ${outputPath}`);
      });

      output.on('error', (err) => {
        console.error(`Error decrypting file: ${err.message}`);
      });

      
    }).catch(error => {
      console.error("An error occurred while fetching the AES key:", error.message);
    });
    */

  } catch (error: any) {
    console.error("An error occurred:", error.message);
  }
}

// BELOW IS THE TERMINAL COMMAND TO DECRYPT/ ENCRYPT
// openssl enc -d -aes-128-cbc -in 00\ -\ Syllabus.pdf.enc -out decrypted_file.pdf -K 0123456789abcdef0123456789abcdef  -iv abcdef0123456789abcdef 
// hex string is too short, padding with zero bytes to length

