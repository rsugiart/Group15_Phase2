import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { CodeartifactClient, PackageFormat, PublishPackageVersionCommand, GetPackageVersionAssetCommand} from "@aws-sdk/client-codeartifact";
import axios from "axios";
import { Readable } from "stream";
import { DynamoDBClient, PutItemCommand, ReturnConsumedCapacity,GetItemCommand, QueryCommand} from "@aws-sdk/client-dynamodb";
import { calculateSHA256AndBuffer,tarToZip,zipStreamToBase64,get_package_json } from "./helpers.js";
import fs from "fs";


// console.log("npm")
// const package_name = "next"
// const url = "https://registry.npmjs.org/next";
// const specificVersionRegex = /\/v\/\d+\.\d+\.\d+/;
// const match = url.match(specificVersionRegex);
// let response = undefined;
// let tarballUrl;
// let version;
// //extract zip from the npm url instaed of tarball
// if (match) {
//   version = match[0].split('/v/')[1];
//   response = await axios.get(`https://registry.npmjs.org/${package_name}/${version}`);
//   tarballUrl = response.data.dist.tarball;
// }
// else {
//   response = await axios.get(`https://registry.npmjs.org/${package_name}`);
//   version = response.data['dist-tags'].latest;
//   tarballUrl = response.data.versions[version].dist.tarball

// }

// //convert tarball response to zip
// const tarballResponse = await axios.get(tarballUrl, { responseType: 'stream' });
// const zipStream = tarToZip(tarballResponse.data);
// const content = await zipStreamToBase64(zipStream);
// const tarballResponse_2 = await axios.get(tarballUrl, { responseType: 'stream' });
// const stream = tarToZip(tarballResponse_2.data);
// const writableStream = fs.createWriteStream('test2.zip');
// // Pipe the zip stream into the writable stream
// stream.pipe(writableStream);

const zipUrl = "https://github.com/DefinitelyTyped/DefinitelyTyped/zipball/master"
const zipStreamResponse = await axios.get(zipUrl, { responseType: "stream" });
const zipArrayBuffer = await axios.get(zipUrl, { responseType: "arraybuffer" });
const content = Buffer.from(zipArrayBuffer.data).toString('base64');
// console.log(content)