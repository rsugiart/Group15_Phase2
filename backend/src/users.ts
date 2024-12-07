import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { CodeartifactClient, PackageFormat, PublishPackageVersionCommand, GetPackageVersionAssetCommand, ListPackagesCommand,ListPackageVersionsCommand, DeletePackageVersionsCommand,DeletePackageCommand} from "@aws-sdk/client-codeartifact";
import { Readable, Transform } from "stream";
import { DynamoDBClient, PutItemCommand, ReturnConsumedCapacity,GetItemCommand, QueryCommand,ScanCommand,DeleteItemCommand} from "@aws-sdk/client-dynamodb";
import { calculateSHA256AndBuffer,tarToZip,zipStreamToBase64,get_package_json } from "./helpers.js";
import AWS from "aws-sdk";
import axios from "axios";
import { version } from "os";
import { String } from "aws-sdk/clients/cloudhsm.js";
import { package_version_exists } from "./download.js";
import {RateParameters} from "./interfaces.js";
import { off } from "process";
import safeRegex from "safe-regex";
import { c } from "tar";


const USERS_TABLE = process.env.USERS_TABLE || "UsersTable";
const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });
const client = new DynamoDBClient({ region: 'us-east-1' });
const tableName = "PackagesTable";
const docClient = new AWS.DynamoDB.DocumentClient();

export const get_users = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const params = {
        TableName: USERS_TABLE,
    };
    try {
        const result = await docClient.scan(params).promise();
        result
        return {
            statusCode: 200,
            body: JSON.stringify(
                {
                    users: result.Items
                },
                null,
                2
            ),
        };
    }
    catch (err) {
        return {
            statusCode: 400,
            body: JSON.stringify(
                {
                    message: err
                },
                null,
                2
            ),
        };
    }

}

export const modify_user = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    
    try {
        // Parse request body
        if (!event.body) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Request body is required." }),
          };
        }
    
        const { username, permissions } = JSON.parse(event.body);
    
        // Validate input
        if (!username || !permissions) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              message: "Invalid input. 'username' and 'permissions' are required.",
            }),
          };
        }
    
        // Update user permissions in DynamoDB
        const params = {
            TableName: USERS_TABLE,
            Key: { username }, // Assuming 'username' is the partition key
            UpdateExpression: "SET #permissions = :permissions",
            ExpressionAttributeNames: {
              "#permissions": "permissions",
            },
            ExpressionAttributeValues: {
              ":permissions": permissions,
            },
            ReturnValues: "UPDATED_NEW",
          };
      
        const result = await docClient.update(params).promise();
    
        // Return success response
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "User permissions updated successfully.",
            updatedAttributes: result.Attributes,
          }),
        };
      } catch (error: any) {
        console.error("Error modifying user:", error);
    
        // Return error response
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Failed to modify user.",
            error: error.message,
          }),
        };
      }
}

export const delete_user = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Extract username from path parameters
        const username = event.pathParameters?.username;
    
        if (!username) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Username is required." }),
          };
        }
    
        // Delete user from DynamoDB
        const params = {
          TableName: USERS_TABLE,
          Key: { username }, 
        };
    
        await docClient.delete(params).promise();
    
        // Return success response
        return {
          statusCode: 200,
          body: JSON.stringify({ message: `User '${username}' deleted successfully.` }),
        };
      } catch (error: any) {
        console.error("Error deleting user:", error);
    
        // Return error response
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Failed to delete user.",
            error: error.message,
          }),
        };
      }

}
