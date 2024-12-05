
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
import { zipStreamToBase64 } from "./helpers.js";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import jwt from 'jsonwebtoken';
import { verify_token } from "./authenticate.js";

const USERS_TABLE = process.env.USERS_TABLE || "UsersTable";
const tableName = "PackagesTable";
const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = new AWS.DynamoDB.DocumentClient();


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
  if (db_response.Items && db_response.Items.length== 0) {  
    return false
  }
  return true;

}

export const get_package = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => { 
  try {
    console.log("Enter")
    console.log(event.pathParameters)
    const id = event.pathParameters?.id as string
    const body = JSON.parse(event.body as string);
    console.log(body)
    // const auth_header = event.headers['X-Authorization']
    // const [success,message] = await verify_token(auth_header,"download") || [];
    // if (!success) {
    //   return {
    //     statusCode: 403,
    //     body: JSON.stringify(
    //       {
    //         message: message
    //       })
    //   }
    // }
      //check if id has a -
      if (!id.includes("....")) {
          return {
              statusCode: 400,
              headers: { "Content-Type": "application/json" },
              body: "Invalid Package ID"
          }
      } 
      const package_name = id.split("....")[0]
      const version = id.split("....")[1]
      const input = { // GetPackageVersionAssetRequest
          domain: "group15", // required
          repository: "SecurePackageRegistry", // required
          format: PackageFormat.GENERIC,
          namespace: "my-ns",
          package: package_name, // required
          packageVersion: version, // required
          asset: `${package_name}-${version}.zip` // required   
        };
      let response;
      try {
        const command = new GetPackageVersionAssetCommand(input);
        response = await codeartifact_client.send(command);
      }

      catch {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify(
            {
              Error: "Package not found"
            })
          }
      }
      const base64String = await zipStreamToBase64(response.asset as Readable);

      type Response = {
          metadata: {
            Name: string, 
            Version: string, 
            ID: string}, 
          data: {
            Content: string, 
            JSProgram: string
          }
        }
        const api_response:Response  = 
        {
          "metadata": {
            "Name": package_name,
            "Version": version,
            "ID": id
          },
          "data": {
            "Content": base64String,
            "JSProgram": ''
          }
        }
      console.log(api_response)
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