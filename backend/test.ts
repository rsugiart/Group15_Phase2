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

/**
 * Converts a tar stream to a zip stream.
 * @param tarStream The readable tar stream input
 * @returns A readable zip stream output
 */
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

async function zipStreamToBase64(zipStream: Readable): Promise<string> {
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

function tarToZip(tarStream: Readable): Readable {
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

  
async function main() {
    // const tarballUrl = 'https://github.com/cloudinary/cloudinary_npm/tarball/master'
    const response = await axios.get(`https://registry.npmjs.org/cloudinary`);
    const version = response.data['dist-tags'].latest;
    const tarballUrl_1 = response.data.versions[version].dist.tarball
    const tarballResponse_1 = await axios.get(tarballUrl_1, { responseType: 'stream' })
    const zipResponse = await tarToZip(tarballResponse_1.data);
    const base64String = await zipStreamToBase64(zipResponse);
    // console.log(base64String);
    console.log(tarballUrl_1)
    // const tarballUrl = 'https://github.com/cloudinary/cloudinary_npm/tarball/master';
    // const tarballResponse_2 = await axios.get(tarballUrl, { responseType: 'stream' });
    // const zipResponse = await tarToZip(tarballResponse_2.data);
    // const string2 = await zipStreamToBase64(zipResponse);
    // console.log(base64String);c 
    // console.log(tarballResponse_2);
}

// main()

async function main2() {
    // const specificVersionRegex = /\/v\/\d+\.\d+\.\d+/;
    // let response = undefined;
    // const url = "https://www.npmjs.com/package/cloudinary"
    // response = await axios.get(`https://registry.npmjs.org/cloudinary`);
    // const version = response.data['dist-tags'].latest;
    // const tarballUrl = response.data.versions[version].dist.tarball
    // // const readTarball = fs.createReadStream('cloudinary-2.5.1.tgz');
    // console.log(tarballUrl);
    // const tarballResponse = await axios.get(tarballUrl, { responseType: 'stream' });
    // const zipStream = tarToZip(tarballResponse.data);

    const tarballStream = fs.createReadStream('cloudinary-2.5.1.tgz');
    const new_zip = fs.createWriteStream('test.zip');
    const zipStream = tarToZip(tarballStream);
    zipStream.pipe(new_zip);

    
}

main2()