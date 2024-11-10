import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dotenv from 'dotenv';
dotenv.config();
import { execSync} from 'child_process';
import AWS from "aws-sdk";
import * as path from 'path';
import * as fs from 'fs';
import { BinaryLike, createHash } from 'crypto';
import { CodeartifactClient, PackageFormat, PublishPackageVersionCommand } from "@aws-sdk/client-codeartifact";
import axios from "axios";
const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });
import { Readable,Writable } from "stream";
import JSZip from "jszip";
import * as tar from 'tar';
import archiver from 'archiver';
import { PassThrough } from 'stream';

async function tarToZipWithBase64(tarStream: Readable): Promise<{ zipStream: Readable, base64String: string }> {
    const zipStream = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    // Pipe the archive data into the PassThrough zipStream
    archive.pipe(zipStream);

    // Also collect data for base64 encoding from zipStream
    zipStream.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Parse the tar stream and add files to the zip archive
    tarStream.pipe(
        new tar.Parser()
            .on('entry', (entry) => {
                if (entry.type === 'Directory') return;

                const fileChunks: Buffer[] = [];
                entry.on('data', (chunk: Buffer) => fileChunks.push(chunk));
                entry.on('end', () => {
                    const fileContent = Buffer.concat(fileChunks);
                    archive.append(fileContent, { name: entry.path });
                });
            })
            .on('finish', () => {
                archive.finalize();  // Finalize the archive when parsing is complete
            })
    );

    // Wait for the zipStream to finish, then generate the base64 string
    await new Promise<void>((resolve, reject) => {
        zipStream.on('end', resolve);
        zipStream.on('error', reject);
    });

    const base64String = Buffer.concat(chunks).toString('base64');
    return { zipStream, base64String };
}

/**
 * Function to fetch tarball and convert to zip + base64
 * Handles both npm and GitHub tarballs with appropriate headers
 */
async function convertTarballToZipBase64(tarballUrl: string) {
    try {
        // Fetch tarball as a stream
        const tarballResponse = await axios.get(tarballUrl, { responseType: 'stream' });

        console.log('Response Content-Type:', tarballResponse.headers['content-type']);

        // Handle both GitHub and NPM tarballs (application/x-gzip or application/octet-stream)
        if (!tarballResponse.headers['content-type'].startsWith('application/octet-stream') &&
            tarballResponse.headers['content-type'] !== 'application/x-gzip') {
            console.error('Unsupported content type:', tarballResponse.headers['content-type']);
            return;
        }

        // Convert the tarball stream to zip and base64
        const { zipStream, base64String } = await tarToZipWithBase64(tarballResponse.data);

        // Log the base64 string (may be large)
        console.log('Base64 String:', base64String);

        // Optionally, handle zipStream as needed
    } catch (error) {
        console.error('Error fetching or processing the tarball:', error);
    }
}

// Example GitHub tarball URL
const tarballUrlGitHub = 'https://github.com/cloudinary/cloudinary_npm/tarball/master';
convertTarballToZipBase64(tarballUrlGitHub);

// Example NPM tarball URL
const tarballUrlNpm = 'https://registry.npmjs.org/lodash';
convertTarballToZipBase64(tarballUrlNpm);