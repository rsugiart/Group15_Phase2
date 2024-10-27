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
import { base_64_string} from "./base64.js";
import { Readable } from "stream";
import JSZip from "jszip";

async function calculateSHA256AndBuffer(stream: NodeJS.ReadableStream): Promise<{ hash: string, buffer: Buffer }> {
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

const calculateSHA256Hash_2 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data: Buffer) => {
          hash.update(data);
      });

      stream.on('end', () => {
          resolve(hash.digest('hex'));
      });

      stream.on('error', (error: Error) => {
          reject(`Error reading file: ${error.message}`);
      });
  });
};

function base64ToBlob(base64: string) {
  const binaryString = Buffer.from(base64, 'base64').toString('binary');
  const binaryLen = binaryString.length;

  const ab = new ArrayBuffer(binaryLen);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < binaryLen; i++) {
    ia[i] = binaryString.charCodeAt(i);
  }

  return new Blob([ab], { type: "application/zip" });
}



const upload_package = async () => {
  const package_name = 'lodash'
  const version = '4.17.21'
  const url = 'https://github.com/jashkenas/underscore'
  //const metadataUrl = `https://registry.npmjs.org/${package_name}/${version}`;
  // const metadata = (await axios.get(metadataUrl)).data;
  // const tarballUrl = metadata.dist.tarball;
  const mod = url.substring(19);
  const sep = mod.indexOf('/');
  const owner = mod.substring(0, sep);
  const name = mod.substring(sep+1);
  const api_url = `https://api.github.com/repos/${owner}/${name}`;
  const response = await axios.get(api_url);
  const tarballUrl = `https://github.com/jashkenas/underscore/zipball/${response.data.default_branch}`
  const tarballResponse = await axios.get(tarballUrl, { responseType: "stream" });
  const tempStream = tarballResponse.data;
  const zipBuffer = Buffer.from(base_64_string, 'base64');
  const zipStream = Readable.from(zipBuffer);
  const { hash: assetSHA256, buffer: assetContent } = await calculateSHA256AndBuffer(zipStream);
  const sha2 = await calculateSHA256Hash_2('underscore-master.zip');
  console.log(sha2)
  console.log(assetSHA256)
  // const input = { // PublishPackageVersionRequest
  //   domain: "group15",
  //   repository: "SecurePackageRegistry", // required
  //   format: PackageFormat.GENERIC, // required
  //   namespace: "my-ns",
  //   package: "lodash", // required
  //   packageVersion: "5.17.23", // required
  //   assetContent: assetContent, // see \@smithy/types -> StreamingBlobPayloadInputTypes // required
  //   assetName: "lodash-4.17.21.tgz", // required
  //   assetSHA256: assetSHA256 // required
  // };
  // try {
  //   const command = new PublishPackageVersionCommand(input);
  //   const response = await codeartifact_client.send(command);
  //   console.log(response);
  // }
  // catch(error) {
  //   console.log("Error")
  //   console.log(error);
  // }

  let blob = base64ToBlob(base_64_string);
  let zip = new JSZip();
  zip.loadAsync(blob).then(function(zip) {
    const package_json_file = zip.file("package.json")
      if (package_json_file) {
          package_json_file.async("string").then(function (content) {
          console.log(content);
      });
      }

  }).catch((e) => {
    console.log(e);
  });
  // const result = await zip.loadAsync(blob);
  // const file = result.file('package.json');
  // if (file) {
  //   const content = await file.async("string".)
  // }


};

async function printPackageJsonFromBase64(base64Zip: string) {
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
    const info = JSON.parse(content);
    console.log("Contents of package.json:", content);
  } catch (error) {
    console.error("Error reading package.json from ZIP:", error);
  }
}

// printPackageJsonFromBase64(base_64_string);
// upload_package();

function packPackage(): string {
  const result = execSync('npm pack lodash', { encoding: 'utf-8' }).trim();  // Get the .tgz file name
  console.log(`Package created: ${result}`);
  return result;  // This returns the file name (e.g., lodash-4.17.21.tgz)
}

// Function to find the full path of the file
function getPackagePath(fileName: string): string {
  const currentDir = process.cwd();  // Get current working directory
  const fullPath = path.join(currentDir, fileName);  // Create full path to the .tgz file
  return fullPath;
}

// const fileName = packPackage();
// const fullPath = getPackagePath(fileName);
const url = 'https://www.npmjs.com/package/lodash'
const specificVersionRegex = /\/v\/\d+\.\d+\.\d+/;
const match = url.match(specificVersionRegex);
let response = undefined;
var version;
const package_name='lodash';
if (match) {
  version = match[1];
  response = await axios.get(`https://registry.npmjs.org/${package_name}/${version}`);
}
else {
  response = await axios.get(`https://registry.npmjs.org/${package_name}`);
  version = response.data['dist-tags'].latest;

}

const tarballUrl = response.data.versions[version].dist.tarball
// const tarballResponse = await axios.get(tarballUrl, { responseType: 'stream' });
