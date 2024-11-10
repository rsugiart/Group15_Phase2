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


const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });
const client = new DynamoDBClient({ region: 'us-east-1' });
const tableName = "Packages";


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


async function get_package_json(base64Zip: string) {
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
    const body = JSON.parse(event.body as string);
    const package_name = body.Name;
    var version;
    let stream
    let content;
    if (body.hasOwnProperty('Content')) {
      content = body.Content;
      const zipBuffer = Buffer.from(body.Content, 'base64');
      const zipStream = Readable.from(zipBuffer);
      stream = zipStream
      const package_json = await get_package_json(body.Content);
      if (!package_json) {
        throw new Error("Error");
      }
      const info = JSON.parse(package_json);
      version = info.version;
      
    }
    else {
      const url = body.url;
      const mod = url.substring(19);
      const sep = mod.indexOf('/');
      const owner = mod.substring(0, sep);
      const name = mod.substring(sep+1);
      if(url.includes("github.com")) {
        const api_url = `https://api.github.com/repos/${owner}/${name}`;
        const response = await axios.get(api_url);
        const zipUrl = `${url}/zipball/${response.data.default_branch}`
        const package_json_info = await axios.get(`https://raw.githubusercontent.com/${owner}/${name}/${response.data.default_branch}/package.json`)
        version = package_json_info.data.version;
        const zipStreamResponse = await axios.get(zipUrl, { responseType: "stream" });
        const zipArrayBuffer = await axios.get(zipUrl, { responseType: "arraybuffer" });
        content = Buffer.from(zipArrayBuffer.data).toString('base64');
        stream = zipStreamResponse.data
        
      }
      else if (url.includes("npmjs.com/package")) {
        const specificVersionRegex = /\/v\/\d+\.\d+\.\d+/;
        const match = url.match(specificVersionRegex);
        let response = undefined;
        let tarballUrl;
        //extract zip from the npm url instaed of tarball
        if (match) {
          version = match[0].split('/v/')[1];
          response = await axios.get(`https://registry.npmjs.org/${package_name}/${version}`);
          tarballUrl = response.data.dist.tarball;
        }
        else {
          response = await axios.get(`https://registry.npmjs.org/${package_name}`);
          version = response.data['dist-tags'].latest;
          tarballUrl = response.data.versions[version].dist.tarball

        }
        //convert tarball response to zip
        const tarballResponse = await axios.get(tarballUrl, { responseType: 'stream' });
        const zipStream = tarToZip(tarballResponse.data);
        content = await zipStreamToBase64(zipStream);
        const tarballResponse_2 = await axios.get(tarballUrl, { responseType: 'stream' });
        stream = tarToZip(tarballResponse_2.data);

      }

    }
    if (!stream) {
      throw new Error("Stream is undefined.");
    }
    const { hash: assetSHA256, buffer: assetContent } = await calculateSHA256AndBuffer(stream);
    const input = { // PublishPackageVersionRequest
    domain: "group15",
    repository: "SecurePackageRegistry", // required
    format: PackageFormat.GENERIC, // required
    namespace: "my-ns",
    package: package_name, // required
    packageVersion: version, // required
    assetContent: assetContent, // see \@smithy/types -> StreamingBlobPayloadInputTypes // required
    assetName: `${package_name}-${version}.zip`, // required
    assetSHA256: assetSHA256 // required
    }    
    
    const command = new PublishPackageVersionCommand(input);
    let response = await codeartifact_client.send(command);

    const db_input = {
      "TableName": tableName,
      "Item": {
        "Name": {
          "S": package_name
        },
        "Version": {
          "S": version 
        },
        "Rating": {
          "S": "0.5"
        },
        "productID": {
          "S": package_name
        }

      },
      "ReturnConsumedCapacity": ReturnConsumedCapacity.TOTAL,
    };
    const db_command = new PutItemCommand(db_input)
    const db_response = await client.send(db_command)

    //only add this property if the request has a URL in the object below
    type Response = {
      metadata: {
        Name: string, 
        Version: string, 
        ID: string}, 
      data: {
        Content: string, 
        url?: 
        string
      }
    }
    const api_response:Response  = 
    {
      "metadata": {
        "Name": package_name,
        "Version": version,
        "ID": package_name
      },
      "data": {
        "Content": content
      }
    }
    
    if (body.hasOwnProperty('url')) {
      api_response["data"]["url"] = body.url;
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(api_response)
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
    
    
  };

  export const get_rating= async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string
    const input = {
      "Key": {
        "productID": {
          "S": id
        }
      },
      "TableName": tableName
    };
    const command = new GetItemCommand(input);
    const response = await client.send(command);
    if (!(response && response.Item)) {
      throw new Error("Failed")
    }
    const rating = response.Item.rating.S
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        {
          message: rating,
          input: event,
        },
        null,
        2,
      ),
    };

  } catch (error) {
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
};

