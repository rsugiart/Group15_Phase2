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
import { DynamoDBClient, PutItemCommand, ReturnConsumedCapacity,GetItemCommand, QueryCommand} from "@aws-sdk/client-dynamodb";
import * as tar from 'tar';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { calculateSHA256AndBuffer,tarToZip,zipStreamToBase64,get_package_json } from "../helpers.js";
import { analyzeURL } from "./rating/main.js";
import {RateParameters} from "./interfaces.js";
import { version } from "os";
import jwt from "jsonwebtoken";


const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });
const client = new DynamoDBClient({ region: 'us-east-1' });
const tableName = "PackagesTable";


export const health = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {  
  const auth_header = event.headers['x-authorization']
  const token = auth_header && auth_header.split(' ')[1]
  if (token == null) {
    return {
      statusCode: 401,
      body: JSON.stringify(
        {
          message: token
        })
    }
  }
  if (!process.env.JWT_ACCESS_SECRET) {
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Blah"
        })
    }
    throw new Error("JWT_ACCESS_SECRET not set")
  }
try {

  const result = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: result
      },
      null,
      2,
    ),
  };
}
catch(err) {
  return {
    statusCode: 401,
    body: JSON.stringify(
      {
        message: String(err)
      })
  }
}


};

export const package_exists = async (package_name:string) => {
  const input = {
    "ExpressionAttributeValues": {
      ":v1": {"S":package_name},
    },
    "TableName": tableName,
    "KeyConditionExpression": "packageName = :v1",
    "ProjectionExpression": "productID"
  };
  const db_command = new QueryCommand(input)
  const db_response = await client.send(db_command)
  if (db_response.Items) {  
    return true
  }
  return false;

}


export const upload_package = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  try {
    const body = JSON.parse(event.body as string);
    const package_name = body.Name;
    const db_response2 = await package_exists(package_name);
    if (await package_exists(package_name)) {
      return {
        statusCode: 409,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
        {
          Error: "Package already exists"
        })
      };
    }
    var version;
    let stream
    let content;
    let url
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
      if (info.hasOwnProperty('version')) {
        version = info.version;
      }
      else {
        version = "1.0.0";
      }
      
    }
    else {
      url = body.url;
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
    const result = await analyzeURL("https://github.com/lodash/lodash");
    // if (!result) {
    //   throw new Error("Erro");
    // }
    // console.log(result);
    // if (url.includes("npmjs.com/package")) {
    //   if (result.BusFactor <0.5 || result.ResponsiveMaintainer <0.5 || result.RampUp <0.5 || result.Correctness <0.5 || result.License <0.5 || result.GoodPinningPractice <0.5 || result.PullRequest <0.5 || result.NetScore <0.5) {
    //     return {
    //       statusCode: 500,
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify(
    //       {
    //         Error: "Package could not be ingested due to low rating"
    //       })
    //     };
    //   }
    // }
    const rating = JSON.stringify(result);

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
    
    //console.log(result)

    const command = new PublishPackageVersionCommand(input);
    let response = await codeartifact_client.send(command);
    const db_input = {
      "TableName": tableName,
      "Item": {
        "packageName": {
          "S": package_name
        },
        "version": {
          "S": version 
        },
        "rating": {
          "N": rating
        },
        "productID": {
          "S": `${package_name}-${version}`
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
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
      {
        Error: String(error),
      })
    };
    }
     
  };

