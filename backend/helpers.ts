import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
// import * as dotenv from 'dotenv';
// dotenv.config();
import { execSync } from 'child_process';
import AWS from "aws-sdk";
import * as path from 'path';
import * as fs from 'fs';
import { BinaryLike, createHash } from 'crypto';
import { CodeartifactClient, PackageFormat, PublishPackageVersionCommand } from "@aws-sdk/client-codeartifact";
import axios from "axios";
import { Readable } from "stream";
import JSZip from "jszip";
import { DynamoDBClient, PutItemCommand, ReturnConsumedCapacity,GetItemCommand} from "@aws-sdk/client-dynamodb";
import * as tar from 'tar';
import archiver from 'archiver';
import { PassThrough } from 'stream';


export async function calculateSHA256AndBuffer(stream: NodeJS.ReadableStream): Promise<{ hash: string, buffer: Buffer }> {
    return new Promise((resolve, reject) => {
        const hash = createHash("sha256");
        const chunks: Buffer[] = [];
  
        stream.on("data", (chunk) => {
            hash.update(chunk);
            chunks.push(chunk); // Store chunks for later
        });
  
        stream.on("end", () => {
            const buffer = Buffer.concat(chunks); // Combine chunks into a single Buffer
            const hashValue = hash.digest("hex"); // Calculate the hash
            resolve({ hash: hashValue, buffer }); // Return hash and buffer
        });
  
        stream.on("error", reject);
    });
  }
  
export function tarToZip(tarStream: Readable): Readable {
    const zipStream = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });
  
    // Pipe the archive data into the PassThrough zipStream
    archive.pipe(zipStream);
  
    // Parse the tar stream and add files to the zip archive
    tarStream.pipe(
        new tar.Parser()
            .on('entry', (entry) => {
                if (entry.type === 'Directory') return;
  
                const chunks: Buffer[] = [];
                entry.on('data', (chunk: Buffer) => chunks.push(chunk));
                entry.on('end', () => {
                    const fileContent = Buffer.concat(chunks);
                    archive.append(fileContent, { name: entry.path });
                });
            })
            .on('finish', () => {
                archive.finalize();  // Finalize the archive when parsing is complete
            })
    );
  
    return zipStream;  // Return the readable zip stream
  }
  
  export async function zipStreamToBase64(zipStream: Readable): Promise<string> {
    const chunks: Buffer[] = [];
  
    return new Promise((resolve, reject) => {
        zipStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        zipStream.on('end', () => {
            // Concatenate all chunks into a single buffer
            const buffer = Buffer.concat(chunks);
            // Convert the buffer to a base64 string
            const base64String = buffer.toString('base64');
            resolve(base64String);
        });
        zipStream.on('error', (err) => reject(err));
    });
  }
  
  
  export async function get_package_json(base64Zip: string) {
    try {
      // Decode Base64 to binary data in a Uint8Array
      const binaryString = atob(base64Zip);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
  
      // Load zip data using JSZip
      const zip = await JSZip.loadAsync(bytes);
  
      // Search for package.json in the ZIP contents
      let packageFile: JSZip.JSZipObject | undefined;
      zip.forEach((relativePath, file) => {
        if (relativePath.endsWith("package.json")) {
          packageFile = file;
        }
      });
  
      // Check if package.json was found
      if (!packageFile) {
        console.log("package.json not found in the ZIP file.");
        return;
      }
  
      // Read and print the contents of package.json
      const content = await packageFile.async("string");
      return content;
      console.log("Contents of package.json:", content);
    } catch (error) {
      console.error("Error reading package.json from ZIP:", error);
    }
  }
  