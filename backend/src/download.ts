
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
// import * as dotenv from 'dotenv';
// dotenv.config();
import { execSync } from 'child_process';
import AWS from "aws-sdk";
import * as path from 'path';
import * as fs from 'fs';
import { BinaryLike, createHash } from 'crypto';
import { CodeartifactClient, PackageFormat, PublishPackageVersionCommand,GetPackageVersionAssetCommand} from "@aws-sdk/client-codeartifact";
import axios from "axios";
import { Readable } from "stream";
import JSZip from "jszip";
import { DynamoDBClient, PutItemCommand, ReturnConsumedCapacity,GetItemCommand} from "@aws-sdk/client-dynamodb";
import { zipStreamToBase64 } from "../helpers.js";
import { QueryCommand } from "@aws-sdk/client-dynamodb";


const tableName = "PackagesTable";
const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });
const client = new DynamoDBClient({ region: 'us-east-1' });

const package_exists = async (package_name:string,version:string) => {
  const input = {
    "ExpressionAttributeValues": {
      ":v1": {"S":package_name},
      ":v2": {"S":version}
    },
    "TableName": tableName,
    "KeyConditionExpression": "packageName = :v1 AND version = :v2",
    "ProjectionExpression": "productID"
  };
  const db_command = new QueryCommand(input)
  const db_response = await client.send(db_command)
  console.log(db_response)
  if (db_response) {  
    return true
  }
  return false;

}

export const get_package = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => { 
    const id = event.pathParameters?.id as string
    //check if id has a -
    if (!id.includes("-")) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: "Invalid Package ID"
        }
    } 
    const package_name = id.split("-")[0]
    const version = id.split("-")[1]
    
    if (!(await package_exists(package_name,version))) {
        return {
            statusCode: 404,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              {
                Error: "Package not found"
              })
          }
    }

    const input = { // GetPackageVersionAssetRequest
        domain: "group15", // required
        repository: "SecurePackageRegistry", // required
        format: PackageFormat.GENERIC,
        namespace: "my-ns",
        package: package_name, // required
        packageVersion: version, // required
        asset: `${package_name}-${version}.zip` // required   
      };
    try {
    const command = new GetPackageVersionAssetCommand(input);
    const response = await codeartifact_client.send(command);
    const base64String = await zipStreamToBase64(response.asset as Readable);

    type Response = {
        metadata: {
          Name: string, 
          Version: string, 
          ID: string}, 
        data: {
          Content: string, 
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
          "Content": base64String
        }
      }
    return {
        statusCode: 200,
        headers: {
            "contentType": 'application/json', 
        },
        body: JSON.stringify(api_response)
    } 

}
    catch (err) {
        return {
            statusCode: 200,
            body: JSON.stringify(
              {
                message: err
              }
            )
          };

    }

  
  };

  export const download_package = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {  
    

    try {

    const body = JSON.parse(event.body as string);
    
    return {
      statusCode: 200,
      headers: {
        "contentType": "application/zip",
        "Content-Disposition": `attachment; filename=${body.name}-${body.version}.zip`
        },
      
      body: body.content,
      isBase64Encoded: true
  };

}

catch (err) {
    return {
        statusCode: 200,
        body: JSON.stringify(
          {
            message: err,
          }
        )
      };
}
}