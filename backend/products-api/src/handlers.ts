import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
// import * as dotenv from 'dotenv';
// dotenv.config();
import { execSync } from 'child_process';
import AWS from "aws-sdk";
import * as path from 'path';
import * as fs from 'fs';
import { BinaryLike, createHash } from 'crypto';
import { CodeartifactClient, PackageFormat, PublishPackageVersionCommand } from "@aws-sdk/client-codeartifact";
import { http } from "winston";
import axios from "axios";
const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });


function packPackage(package_name:string): string {
  const result = execSync(`npm pack ${package_name}`, { encoding: 'utf-8' }).trim();  // Get the .tgz file name
  console.log(`Package created: ${result}`);
  return result;  // This returns the file name (e.g., lodash-4.17.21.tgz)
}

// Function to find the full path of the file
function getPackagePath(fileName: string): string {
  const currentDir = process.cwd();  // Get current working directory
  const fullPath = path.join(currentDir, fileName);  // Create full path to the .tgz file
  return fullPath;
}


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



export const health = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {  
  
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v1.0! Your function executed successfully!",
        input: event,
      },
      null,
      2,
    ),
  };
};



export const upload_package = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  try {
    const package_name = JSON.parse(event.body as string).name
    const version = JSON.parse(event.body as string).version
    const metadataUrl = `https://registry.npmjs.org/${package_name}/${version}`;
    const metadata = (await axios.get(metadataUrl)).data;
    const tarballUrl = metadata.dist.tarball;
    const tarballResponse = await axios.get(tarballUrl, { responseType: "stream" });
    const { hash: assetSHA256, buffer: assetContent } = await calculateSHA256AndBuffer(tarballResponse.data);
    

    const input = { // PublishPackageVersionRequest
    domain: "group15",
    repository: "SecurePackageRegistry", // required
    format: PackageFormat.GENERIC, // required
    namespace: "my-ns",
    package: package_name, // required
    packageVersion: version, // required
    assetContent: assetContent, // see \@smithy/types -> StreamingBlobPayloadInputTypes // required
    assetName: `${package_name}-${version}.tgz`, // required
    assetSHA256: assetSHA256 // required

    };
    const command = new PublishPackageVersionCommand(input);
    const response = await codeartifact_client.send(command);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        {
          message: "h",
          input: event,
        },
        null,
        2,
      ),
    };
  }
  catch(error) {

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        {
          message: String(error),
          input: event,
        },
        null,
        2,
      ),
    };
  }
  // const asset_sha = calculateSHA256(`${package_name}-${version}`);
  // const fileName = packPackage(package_name);
  // const fullPath = getPackagePath(fileName);
  // const fileContent = fs.readFileSync(fullPath);

  // const input = { // PublishPackageVersionRequest
  //   domain: "group15",
  //   repository: "SecurePackageRegistry", // required
  //   format: PackageFormat.GENERIC, // required
  //   namespace: "my-ns",
  //   package: package_name, // required
  //   packageVersion: "4.17.21", // required
  //   assetContent: fileContent, // see \@smithy/types -> StreamingBlobPayloadInputTypes // required
  //   assetName: "lodash-4.17.21.tgz", // required
  //   assetSHA256: asset_sha // required
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
  

};


export const write = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  fs.writeFileSync('/mnt/access/hello.txt',"Hello");
  
  
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v1.0! Your function executed successfully!",
        input: event,
      },
      null,
      2,
    ),
  };
};

export const read = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const data = fs.readFileSync('/mnt/access/hello.txt')
  
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: data,
        input: event,
      },
      null,
      2,
    ),
  };
};