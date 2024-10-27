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


const upload_package = async () => {
  const package_name = 'lodash'
  const version = '4.17.21'
  const metadataUrl = `https://registry.npmjs.org/${package_name}/${version}`;
  const metadata = (await axios.get(metadataUrl)).data;
  const tarballUrl = metadata.dist.tarball;
  const tarballResponse = await axios.get(tarballUrl, { responseType: "stream" });
  const tempStream = tarballResponse.data;
  const { hash: assetSHA256, buffer: assetContent } = await calculateSHA256AndBuffer(tarballResponse.data);
  
  console.log(assetSHA256);
  const input = { // PublishPackageVersionRequest
    domain: "group15",
    repository: "SecurePackageRegistry", // required
    format: PackageFormat.GENERIC, // required
    namespace: "my-ns",
    package: "lodash", // required
    packageVersion: "5.17.23", // required
    assetContent: assetContent, // see \@smithy/types -> StreamingBlobPayloadInputTypes // required
    assetName: "lodash-4.17.21.tgz", // required
    assetSHA256: assetSHA256 // required
  };
  try {
    const command = new PublishPackageVersionCommand(input);
    const response = await codeartifact_client.send(command);
    console.log(response);
  }
  catch(error) {
    console.log("Error")
    console.log(error);
  }


};

upload_package();

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