
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
// import * as dotenv from 'dotenv';
// dotenv.config();
import { execSync } from 'child_process';
import AWS from "aws-sdk";
import * as path from 'path';
import * as fs from 'fs';
import { BinaryLike, createHash } from 'crypto';
import { CodeartifactClient, PackageFormat, PublishPackageVersionCommand,GetPackageVersionAssetCommand } from "@aws-sdk/client-codeartifact";
import axios from "axios";
import { Readable } from "stream";
import JSZip from "jszip";
import { DynamoDBClient, PutItemCommand, ReturnConsumedCapacity,GetItemCommand} from "@aws-sdk/client-dynamodb";
import { zipStreamToBase64 } from "./handlers.js";


const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });

export const get_package = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => { 
    const id = event.pathParameters?.id as string
    const package_name = id
    const version = '4.17.2'
    
    const input = { // GetPackageVersionAssetRequest
        domain: "group15", // required
        repository: "SecurePackageRegistry", // required
        format: PackageFormat.GENERIC,
        namespace: "my-ns",
        package: 'lodash', // required
        packageVersion: '4.17.21', // required
        asset: `lodash-4.17.21.zip` // required
        
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
                message: err,
                input: event,
              },
              null,
              2,
            ),
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
            input: event,
          },
          null,
          2,
        ),
      };
}

  

}