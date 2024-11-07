
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
  
  