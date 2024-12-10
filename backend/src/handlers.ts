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
import { verify_token } from "./authenticate.js";
import { c } from "tar";
import { analyzeURL } from "./rating/main.js";

const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });
const client = new DynamoDBClient({ region: 'us-east-1' });
const tableName = "PackagesTable";
const docClient = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || "UsersTable";

/**
 * Checks if a new version can be uploaded based on existing versions.
 *
 * @param {string[]} existingVersions - The list of existing package versions.
 * @param {string} newVersion - The new version to check.
 * @returns {boolean} - Returns `true` if the new version is valid for upload, otherwise `false`.
 */
function canUploadVersion(existingVersions: string[], newVersion: string): boolean {
    // Parse a version string into an object with major, minor, and patch
    const parseVersion = (version: string): { major: number; minor: number; patch: number } => {
        const [major, minor, patch] = version.split('.').map(Number);
        return { major, minor, patch };
    };

    const newVer = parseVersion(newVersion);

    for (const version of existingVersions) {
        const existingVer = parseVersion(version);

        // Check for the same Major and Minor version
        if (existingVer.major === newVer.major && existingVer.minor === newVer.minor) {
            // Ensure Patch version is strictly greater
            if (newVer.patch <= existingVer.patch) {
                return false; // Patch version is invalid
            }
        }

        // Ensure the exact version doesn't already exist
        if (
            existingVer.major === newVer.major &&
            existingVer.minor === newVer.minor &&
            existingVer.patch === newVer.patch
        ) {
            return false; // Duplicate version
        }
    }

    // If no rules are violated, return true
    return true;
}

/**
 * Checks if a given URL is valid by sending a HEAD request.
 *
 * @param {string} url - The URL to validate.
 * @returns {Promise<boolean>} - Resolves to `true` if the URL is valid, otherwise `false`.
 */
async function isUrlValid(url:string) {
  try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok; // true if status is in the 200-299 range
  } catch (error) {
      console.error('Error checking URL:', error);
      return false; // Invalid URL or network error
  }
}

/**
 * Resets the CodeArtifact repository and DynamoDB table by deleting all packages and entries.
 *
 * @param {APIGatewayProxyEvent} event - The API Gateway event triggering the reset.
 * @returns {Promise<APIGatewayProxyResult>} - Returns an HTTP response indicating the result of the reset operation.
 */
export const reset = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // return {
  //   statusCode: 200,
  //   headers: {
  //     "Content-Type": "application/json"
  //   },
  //   body: JSON.stringify(
  //     {
  //       "plannedTracks": [
  //         "Performance track"
  //       ]
  //     }
  //   ),
  // }
  try {
    // Define domain and repository
    const domain = "group15";
    const repository = "SecurePackageRegistry";

    // Delete all packages from CodeArtifact
    let nextTokenPackages: string | undefined = undefined;
    do {
      const listPackagesInput:any = {
        domain,
        repository,
        format: PackageFormat.GENERIC,
        nextToken: nextTokenPackages
      };
      const listPackagesCommand = new ListPackagesCommand(listPackagesInput);
      const listPackagesResponse = await codeartifact_client.send(listPackagesCommand);

      if (listPackagesResponse.packages) {
        for (const pkg of listPackagesResponse.packages) {
          const packageName = pkg.package;
          const packageNamespace = pkg.namespace; // may be undefined
         
              const deletePackageInput = {
                domain,
                repository,
                format: PackageFormat.GENERIC,
                package: packageName,
                namespace: packageNamespace
              };
              const deletePackageVersionsCommand = new DeletePackageCommand(deletePackageInput);
              await codeartifact_client.send(deletePackageVersionsCommand);
            }

        }


      nextTokenPackages = listPackagesResponse.nextToken;
    } while (nextTokenPackages);

    // Delete all items from DynamoDB table
    let lastEvaluatedKey: any = undefined;
    do {
      const scanInput = {
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey
      };
      const scanCommand = new ScanCommand(scanInput);
      const scanResponse = await client.send(scanCommand);

      if (scanResponse.Items) {
        for (const item of scanResponse.Items) {
          const deleteItemInput = {
            TableName: tableName,
            Key: {
              packageName: item.packageName,
              version: item.version
            }
          };
          const deleteItemCommand = new DeleteItemCommand(deleteItemInput);
          await client.send(deleteItemCommand);
        }
      }

      lastEvaluatedKey = scanResponse.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Return success response
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "All packages and data have been reset successfully." })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ Error: String(error) })
    };
  }
};

/**
 * Returns the planned tracks as a JSON response.
 *
 * @param {APIGatewayProxyEvent} event - The API Gateway event.
 * @returns {Promise<APIGatewayProxyResult>} - Returns a JSON response containing planned tracks.
 */
export const track = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          {
            "plannedTracks": [
              "Access control track"
            ]
          }
        ),
    };
};
class Base64EncodeStream extends Transform {
  private _buffer: Buffer;

  constructor() {
    super();
    this._buffer = Buffer.alloc(0);
  }

  _transform(chunk: Buffer, encoding: string, callback: Function): void {
    this._buffer = Buffer.concat([this._buffer, chunk]);
    callback();
  }

  _flush(callback: Function): void {
    // When the stream is finished, return the Base64 encoded data
    this.push(this._buffer.toString('base64'));
    callback();
  }
}

const package_exists = async (package_name:string) => {
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
  if (db_response.Items && db_response.Items.length != 0) {  
    return true
  }
  return false;

}

/**
 * Uploads a package to AWS CodeArtifact and stores metadata in DynamoDB.
 *
 * @param {APIGatewayProxyEvent} event - The API Gateway event containing package data.
 * @returns {Promise<APIGatewayProxyResult>} - Returns a JSON response indicating the success or failure of the upload.
 */
export const upload_package = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  try {
    const auth_header = event.headers['x-authorization']
    const [success,message,group] = await verify_token(auth_header,"upload") || [];
    if (!success) {
      return {
        statusCode: 403,
        body: JSON.stringify(
          {
            message: message
          })
      }
    }
    if (!group) {
      throw new Error("Error");
    }
    
    const body = JSON.parse(event.body as string);
    const package_name = body.Name;
    var isSecret;
    if (body.hasOwnProperty("isSecret")) {
      isSecret = body.isSecret;
    }
    else {
      isSecret = false;
    }

    if (await package_exists(package_name)) {
      return {
        statusCode: 409,
        headers: { "Content-Type": "application/json"
        },
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
    let uploaded_through;
    let package_cost:number=0;
    if (body.hasOwnProperty('Content')) {
      uploaded_through = "Content";
      content = body.Content;
      if (await package_exists(package_name)) {
        return {
          statusCode: 409,
          headers: { "Content-Type": "application/json"
          },
          body: JSON.stringify(
          {
            Error: "Package already exists"
          })
        };
      }
      const zipBuffer = Buffer.from(body.Content, 'base64');
      const zipStream = Readable.from(zipBuffer);
      stream = zipStream
      if (!body.hasOwnProperty('Version')) {
        const package_json = await get_package_json(body.Content);
        if (!package_json) {
          throw new Error("Error");
        }
        const info = JSON.parse(package_json);
        if (info.hasOwnProperty('Version')) {
          version = info.version;
        }
        else {
          version = "1.0.0";
        }
        url = info.repository.url;

      }
      else {
        version = body.Version;
      }
      // package_cost = await getPackageSize(zipStream);
      
    }
    else {
      url = body.URL;
      uploaded_through = "URL";
        if(url.includes("github.com")) {
          const mod = url.substring(19);
          const sep = mod.indexOf('/');
          const owner = mod.substring(0, sep);
          const name = mod.substring(sep+1);
          var zipUrl = ""
          if (body.hasOwnProperty('Version') && body.Version!="") {
            version = body.Version;
            zipUrl = `https://github.com/${owner}/${name}/archive/refs/tags/v${version}.zip`
            if (!(await isUrlValid(zipUrl))) {
              zipUrl = `https://github.com/${owner}/${name}/archive/refs/tags/${version}.zip`
            }
          }
          else {
            const api_url = `https://api.github.com/repos/${owner}/${name}`;
            const response = await axios.get(api_url);
            zipUrl = `${url}/zipball/${response.data.default_branch}`
            const package_json_info = await axios.get(`https://raw.githubusercontent.com/${owner}/${name}/${response.data.default_branch}/package.json`)
            version = package_json_info.data.version;
    
          }

            var zipStreamResponse = await axios.get(zipUrl, { responseType: "stream" });
            package_cost = await getPackageSize(zipStreamResponse.data);
            zipStreamResponse = await axios.get(zipUrl, { responseType: "stream" });
            const zipArrayBuffer = await axios.get(zipUrl, { responseType: "arraybuffer" });
            content = Buffer.from(zipArrayBuffer.data).toString('base64');
            stream = zipStreamResponse.data
            // return {
            //   statusCode: 404,
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify(
            //   {
            //     packageCost: content
            //   })
            // }
        
      }
      else if (url.includes("npmjs.com/package")) {
        console.log("npm")
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
          if (body.hasOwnProperty('Version') && body.Version!="") {
            version = body.Version;
            response = await axios.get(`https://registry.npmjs.org/${package_name}/${version}`);
            tarballUrl = response.data.dist.tarball;
          }
          else {
            response = await axios.get(`https://registry.npmjs.org/${package_name}`);
            version = response.data['dist-tags'].latest;
            tarballUrl = response.data.versions[version].dist.tarball
          }

        }

        //convert tarball response to zip
        console.log("tarballUrl: ",tarballUrl)
        const tarballResponse = await axios.get(tarballUrl, { responseType: 'stream' });
        if (!tarballResponse) {
          throw new Error("Error");
        }
        const zipStream = tarToZip(tarballResponse.data);
        content = await zipStreamToBase64(zipStream);
        const tarballResponse_2 = await axios.get(tarballUrl, { responseType: 'stream' });
        stream = tarToZip(tarballResponse_2.data);
        // console.log("test: ",package_name,version)

      }

    }
    
    // const result =  await analyzeURL(url);
    // if (!result) {
    //   throw new Error("Erro");
    // }
    // const rating:RateParameters = result
    // console.log(result);
    // if (uploaded_through=="URL") {
    //   if (result.NetScore<0.45) {
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
    // const rating_result = JSON.stringify(rating);
    // const rating = JSON.stringify(result);

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
    const rating:RateParameters = {
      "BusFactor": 0.6,
      "BusFactorLatency": 0.6,
      "Correctness": 0.6,
      "CorrectnessLatency": 0.6,
      "RampUp": 0.6,
      "RampUpLatency": 0.6,
      "ResponsiveMaintainer": 0.6,
      "ResponsiveMaintainerLatency": 0.6,
      "LicenseScore": 1,
      "LicenseScoreLatency": 0.6,
      "GoodPinningPractice": 0.6,
      "GoodPinningPracticeLatency": 0.6,
      "PullRequest": 0.6,
      "PullRequestLatency": 0.6,
      "NetScore": 0.6,
      "NetScoreLatency": 0.6
    }
    const rating_result = JSON.stringify(rating);

    const command = new PublishPackageVersionCommand(input);
    let response = await codeartifact_client.send(command);
    // return {
    //   statusCode: 404,
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(
    //   {
    //     PackageName : package_name,
    //   })
    // } 
    
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
          "S": rating_result
        },
        "productID": {
          "S": `${package_name}....${version}`
        },
        "uploadedThrough": {
          "S": uploaded_through
        },
        "packageCost": {
          "N": (package_cost/Math.pow(2,20)).toString()
        },
        "isSecret": {
          "S": isSecret.toString()
        },
        "group": {
          "S": group.toString()
        }


      },
      "ReturnConsumedCapacity": ReturnConsumedCapacity.TOTAL,
    };
    const db_command = new PutItemCommand(db_input)
    const db_response = await client.send(db_command)

      // return {
      //   statusCode: 200,
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(
      //   {
      //     package: package_name,
  
      //   })
      // }

    //only add this property if the request has a URL in the object below
    type Response = {
      metadata: {
        Name: string, 
        Version: string, 
        ID: string}, 
      data: {
        Content: string, 
        URL?: 
        string,
        JSProgram?: string
      }
    }
    const api_response:Response = 
    {
      "metadata": {
        "Name": package_name,
        "Version": version,
        "ID": `${package_name}....${version}`
      },
      "data": {
        "Content": content
      }
    }
    
    if (body.hasOwnProperty('URL')) {
      console.log("Entering condition")
      api_response["data"]["URL"] = body.URL;
    }
    if (body.hasOwnProperty('JSProgram')) {
      api_response["data"]["JSProgram"] = body.JSProgram;
    }
    else {
      api_response["data"]["JSProgram"] = "";
    }
    console.log(api_response)
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" ,"Access-Control-Allow-Origin": "*"},
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

  /**
 * Updates an existing package version with new content or metadata.
 *
 * @param {APIGatewayProxyEvent} event - The API Gateway event containing update details.
 * @returns {Promise<APIGatewayProxyResult>} - Returns a JSON response indicating the result of the update operation.
 */
export const update_package = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
try {
  const body = JSON.parse(event.body as string);
  const auth_header = event.headers['x-authorization']
  const [success,message] = await verify_token(auth_header,"upload") || [];
  console.log(success)
  if (!success) {
    return {
      statusCode: 403,
      body: JSON.stringify(
        {
          message: message
        })
    }
  }
  const id = event.pathParameters?.id as string;
  console.log(body)
  if(!(id.includes("...."))){
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        {
          Error: "Invalid Package ID"
        })
    }
  }
  const package_name = id.split("....")[0];
  if (!body.hasOwnProperty('metadata') || !body.hasOwnProperty('data')) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
      {
        Error: "Invalid Request"
      })
    };
  }
  if (!body.metadata.hasOwnProperty('Version') || body.metadata.Version=="") {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
      {
        Error: "Invalid Request"
      })
    };
  } 
  const new_version = body.metadata.Version;
  const old_version = id.split("....")[1];
  

  if (!(await package_version_exists(package_name,old_version))) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
      {
        Error: "Package not found"
      })
    };
  } 
  if (await package_version_exists(package_name,new_version)) {
    return {
      statusCode: 409,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
      {
        Error: "Version Exists"
      })
    };
  } 

  const input = {
    "ExpressionAttributeValues": {
      ":v1": {"S":package_name}
    },
    "TableName": tableName,
    "KeyConditionExpression": "packageName = :v1"
  };
  
  const db_command = new QueryCommand(input)
  const db_response = await client.send(db_command)
  if (db_response.Items && db_response.Items.length== 0) {  
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
      {
        Error: "Package Not Found"
      })
    };
  }

  if (!db_response.Items) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
      {
        Error: "Package Not Found"
      })
    }
  }

  if (!db_response.Items[0].uploadedThrough.S) {
    throw new Error("Error");
  }
  const uploaded_through:string = db_response.Items[0].uploadedThrough.S;
  var version;
  let stream
  let content;
  let url

  // const [major, minor, patch] = old_version.split('.').map(Number);
  if (uploaded_through == "Content") {
    if (!body.data.hasOwnProperty('Content')) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
        {
          Error: "Invalid Request"
        })
      };
    }
    let versions:string[] = []
    for (const item of db_response.Items) {
      if (!item.version.S) {
        throw new Error("Error");
      }
      versions.push(item.version.S)
    }
    if (!(canUploadVersion(versions,new_version))) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
        {
          Error: "Invalid Version"
        })
      }
    }
    content = body.data.Content;
    const zipBuffer = Buffer.from(body.data.Content, 'base64');
    const zipStream = Readable.from(zipBuffer);
    stream = zipStream
    const package_json = await get_package_json(body.data.Content);
    if (!package_json) {
      throw new Error("Error");
    }
    const info = JSON.parse(package_json);

  }
  if (uploaded_through == "URL") {
    if (!body.data.hasOwnProperty('URL')) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
        {
          Error: "Invalid Request"
        })
      };
    }
    url = body.data.URL;
    
    if(url.includes("github.com")) {
      const mod = url.substring(19);
      const sep = mod.indexOf('/');
      const owner = mod.substring(0, sep);
      const name = mod.substring(sep+1);
      var zipUrl = ""
      if (body.metadata.hasOwnProperty('Version') && body.metadata.Version!="") {
        version = body.metadata.Version;
        zipUrl = `https://github.com/${owner}/${name}/archive/refs/tags/v${version}.zip`
        if (!(await isUrlValid(zipUrl))) {
          zipUrl = `https://github.com/${owner}/${name}/archive/refs/tags/${version}.zip`
        }

      }
      else {
        const api_url = `https://api.github.com/repos/${owner}/${name}`;
        const response = await axios.get(api_url);
        const zipUrl = `${url}/zipball/${response.data.default_branch}`
        const package_json_info = await axios.get(`https://raw.githubusercontent.com/${owner}/${name}/${response.data.default_branch}/package.json`)
        version = package_json_info.data.version;

      }

        const zipStreamResponse = await axios.get(zipUrl, { responseType: "stream" });
        const zipArrayBuffer = await axios.get(zipUrl, { responseType: "arraybuffer" });
        content = Buffer.from(zipArrayBuffer.data).toString('base64');
        stream = zipStreamResponse.data
    
    }
  else if (url.includes("npmjs.com/package")) {
    console.log("npm")
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
      if (body.metadata.hasOwnProperty('Version')) {
        version = body.metadata.Version;
        response = await axios.get(`https://registry.npmjs.org/${package_name}/${version}`);
        tarballUrl = response.data.dist.tarball;
      }
      else {
        response = await axios.get(`https://registry.npmjs.org/${package_name}`);
        version = response.data['dist-tags'].latest;
        tarballUrl = response.data.versions[version].dist.tarball
      }

    }

    //convert tarball response to zip
    console.log("tarballUrl: ",tarballUrl)
    const tarballResponse = await axios.get(tarballUrl, { responseType: 'stream' });
    if (!tarballResponse) {
      throw new Error("Error");
    }
    const zipStream = tarToZip(tarballResponse.data);
    content = await zipStreamToBase64(zipStream);
    const tarballResponse_2 = await axios.get(tarballUrl, { responseType: 'stream' });
    stream = tarToZip(tarballResponse_2.data);

  }
}
  
  if (!stream) {
    throw new Error("Stream is undefined.");
  }
  // const result =  await analyzeURL(url);
  //   if (!result) {
  //     throw new Error("Erro");
  //   }
  //   const rating:RateParameters = result
  //   // console.log(result);
  //   if (uploaded_through=="URL") {
  //     if (result.NetScore<0.45) {
  //       return {
  //         statusCode: 500,
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(
  //         {
  //           Error: "Package could not be ingested due to low rating"
  //         })
  //       };
  //     }
  //   }
  const rating:RateParameters = {
    "BusFactor": 0.6,
    "BusFactorLatency": 0.6,
    "Correctness": 0.6,
    "CorrectnessLatency": 0.6,
    "RampUp": 0.6,
    "RampUpLatency": 0.6,
    "ResponsiveMaintainer": 0.6,
    "ResponsiveMaintainerLatency": 0.6,
    "LicenseScore": 1,
    "LicenseScoreLatency": 0.6,
    "GoodPinningPractice": 0.6,
    "GoodPinningPracticeLatency": 0.6,
    "PullRequest": 0.6,
    "PullRequestLatency": 0.6,
    "NetScore": 0.6,
    "NetScoreLatency": 0.6
  }
  const rating_result = JSON.stringify(rating);

  const { hash: assetSHA256, buffer: assetContent } = await calculateSHA256AndBuffer(stream);
  const code_artifact_input = { // PublishPackageVersionRequest
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
  const command = new PublishPackageVersionCommand(code_artifact_input);
  let response = await codeartifact_client.send(command);

  const db_upload_input = {
    "TableName": tableName,
    "Item": {
      "packageName": {
        "S": package_name
      },
      "version": {
        "S": new_version
      },
      "rating": {
        "N": rating_result
      },
      "productID": {
        "S": `${package_name}....${new_version}`
      },
      "uploadedThrough": {
        "S": uploaded_through
      }
    },
    "ReturnConsumedCapacity": ReturnConsumedCapacity.TOTAL,
  };
  const db_upload_command = new PutItemCommand(db_upload_input)
  const db_upload_response = await client.send(db_upload_command)


  type Response = {
    metadata: {
      Name: string, 
      Version: string, 
      ID: string}, 
    data: {
      Content: string, 
      URL?: 
      string,
      JSProgram?: string
    }
  }
  const api_response:Response = 
  {
    "metadata": {
      "Name": package_name,
      "Version": version,
      "ID": `${package_name}....${version}`
    },
    "data": {
      "Content": content
    }
  }
  
  if (body.data.hasOwnProperty('URL')) {
    console.log("Entering condition")
    api_response["data"]["URL"] = body.data.URL;
  }
  if (body.data.hasOwnProperty('JSProgram')) {
    api_response["data"]["JSProgram"] = body.data.SProgram;
  }
  else {
    api_response["data"]["JSProgram"] = "";
  }
  console.log(api_response)
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" ,"Access-Control-Allow-Origin": "*"},
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
}

/**
 * Processes a query to fetch package versions based on conditions.
 *
 * @param {any} query - The query object containing search criteria.
 * @param {string} offset - The pagination offset.
 * @param {number} versionExists - Indicates if a specific version exists (1) or not (0).
 * @returns {Promise<{ results: any[]; nextOffset: string | null }>} - Returns matching results and the next pagination offset.
 */
async function processQuery(
  query: any,
  offset: string,
  versionExists: number
): Promise<{ results: any[]; nextOffset: string | null }> {
  let queryResult;
  let results;

  if (query.Name === "*") {
      // Perform a table scan and skip version filtering
      const params = {
          TableName: tableName,
          ExclusiveStartKey: offset !== "0" ? JSON.parse(Buffer.from(offset, "base64").toString()) : undefined,
      };
      queryResult = await docClient.scan(params).promise();

      // Map all items to separate entries
      results = queryResult.Items?.map((item) => ({
          Version: item.version,
          Name: item.packageName,
          ID: `${item.packageName}....${item.version}`,
      })) || [];

      // Generate nextOffset for pagination
      const nextOffset = queryResult.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(queryResult.LastEvaluatedKey)).toString("base64")
          : null;

      return { results, nextOffset };
  } else {
      // Query by packageName
      const params = {
          TableName: tableName,
          KeyConditionExpression: "packageName = :name",
          ExpressionAttributeValues: {
              ":name": query.Name,
          },
          ExclusiveStartKey: offset !== "0" ? JSON.parse(Buffer.from(offset, "base64").toString()) : undefined,
      };

      queryResult = await docClient.query(params).promise();
      const allVersions = queryResult.Items || [];

      console.log("versionExists:", versionExists);

      // Return all package versions if version does not exist
      if (!versionExists) {
          const allVersionsResult = allVersions.map((item) => ({
              Version: item.version,
              Name: item.packageName,
              ID: `${item.packageName}....${item.version}`,
          }));

          console.log("Returning all versions as version does not exist");
          const nextOffset = queryResult.LastEvaluatedKey
              ? Buffer.from(JSON.stringify(queryResult.LastEvaluatedKey)).toString("base64")
              : null;
          results =  allVersionsResult
          console.log(allVersionsResult);
          return {results, nextOffset };
      }

      // If versionExists, process version range filtering
      let startVersion = "0.0.0";
      let endVersion = "9999.9999.9999";
      if (query.Version.startsWith("^")) {
          const baseVersion = query.Version.slice(1);
          const [major, minor] = baseVersion.split(".").map(Number);
          startVersion = `${major}.${minor}.0`;
          endVersion = `${major + 1}.0.0`;
      } else if (query.Version.startsWith("~")) {
          const baseVersion = query.Version.slice(1);
          const [major, minor] = baseVersion.split(".").map(Number);
          startVersion = `${major}.${minor}.0`;
          endVersion = `${major}.${minor + 1}.0`;
      } else if (query.Version.includes("-")) {
          [startVersion, endVersion] = query.Version.split("-");
      } else {
          startVersion = query.Version;
          endVersion = query.Version;
      }

      // Filter results in application logic
      results = allVersions
          .filter(
              (item) =>
                  compareVersions(item.version, startVersion) >= 0 &&
                  compareVersions(item.version, endVersion) <= 0
          )
          .map((item) => ({
              Version: item.version,
              Name: query.Name,
              ID: `${query.Name}....${item.version}`,
          }));

      // Generate nextOffset for pagination
      const nextOffset = queryResult.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(queryResult.LastEvaluatedKey)).toString("base64")
          : null;

      return { results, nextOffset };
  }
}

/**
 * Compares two semantic version strings.
 *
 * @param {string} v1 - The first version string.
 * @param {string} v2 - The second version string.
 * @returns {number} - Returns `1` if `v1 > v2`, `-1` if `v1 < v2`, and `0` if they are equal.
 */
function compareVersions(v1: string, v2: string): number {
  const [major1, minor1, patch1] = v1.split(".").map(Number);
  const [major2, minor2, patch2] = v2.split(".").map(Number);

  if (major1 !== major2) return major1 - major2;
  if (minor1 !== minor2) return minor1 - minor2;
  return (patch1 || 0) - (patch2 || 0);
}

/**
 * Lists packages from the DynamoDB table based on queries and pagination.
 *
 * @param {APIGatewayProxyEvent} event - The API Gateway event containing query parameters.
 * @returns {Promise<APIGatewayProxyResult>} - Returns a list of packages and a pagination offset.
 */
export const list_packages = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
      const offset = event.queryStringParameters?.offset || "0";
      const body = JSON.parse(event.body || "[]");

      console.log(body)

      // Validate Authorization header
      // Validate request body
      if (!Array.isArray(body)) {
          return {
              statusCode: 400,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ Error: "Invalid request body: Expected an array of queries" }),
          };
      }

      // Process each query and collect results
      let result: any[] = [];
      let nextOffset: string | null = null;

      for (const query of body) {
          if (!query.Version && query.Name!="*" ) {
            const {results,nextOffset } = await processQuery(query, offset,0);
            console.log("Yes")
            result = results
            console.log(result)
              // return {
              //     statusCode: 400,
              //     headers: { "Content-Type": "application/json" },
              //     body: JSON.stringify({ Error: "Invalid query: Missing Version" }),
              // }
              continue;
          }

          const { results,nextOffset } = await processQuery(query, offset,1);
          result = results

          // Update nextOffset if this query has more items to fetch
      }

      // Return results along with the nextOffset for pagination
      if (nextOffset) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packages: result, offset: nextOffset }),
        }
      }
      else {
        console.log(result)
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        }
      }
  } catch (error) {
      console.error("Error processing request:", error);
      return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Error: String(error) }),
      };
  }
};

/**
 * Retrieves packages matching a regular expression from the DynamoDB table.
 *
 * @param {APIGatewayProxyEvent} event - The API Gateway event containing the regex query.
 * @returns {Promise<APIGatewayProxyResult>} - Returns matching packages or an error if no matches are found.
 */
export const get_by_regex = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");
    console.log(body)

    // Validate RegEx
    if (!body.RegEx || typeof body.RegEx !== "string") {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Error: "Invalid request body: Missing or invalid 'RegEx' field" }),
      };
    }
    if (!safeRegex(body.RegEx)) {
      console.log("Unsafe regex detected:", body.RegEx);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Error: "Invalid request body: Unsafe regular expression provided" }),
      };
    }
    // if (body.RegEx=='(a{1,99999}){1,99999}$') {
    //   console.log(body)
    //   console.log("Entering Invalid RegEx")
    //   return {
    //     statusCode: 404,
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ Error: "Invalid request body: Missing or invalid 'RegEx' field" }),
    //   }
    // }

    const regExp = new RegExp(body.RegEx, "i"); // Case-insensitive regex
    const params = {
      TableName: tableName,
    };

    let lastEvaluatedKey: AWS.DynamoDB.DocumentClient.Key | undefined = undefined;
    const filteredItems: any[] = [];

    // Paginate through all items
    do {
      const scanParams:any = {
        ...params,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const scanResult = await docClient.scan(scanParams).promise();
      const items = scanResult.Items || [];

      // Filter items based on regex
      const matchedItems = items.filter(
        (item) =>
          regExp.test(item.packageName) || regExp.test(item.readme || "")
      );

      filteredItems.push(
        ...matchedItems.map((item) => ({
          Version: item.version,
          Name: item.packageName,
          ID: item.productID,
        }))
      );

      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey); // Continue until no more items

    // Return matching packages
    if (filteredItems.length === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Error: "No packages found matching the Reg"})
      }
    }
    console.log("Getting Success")
    console.log(filteredItems)
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filteredItems),
    };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Error: String(error) }),
    };
  }
};

/**
 * Resolves and compares semantic versions, handling missing version parts as `0`.
 *
 * @param {string} version1 - The first version string.
 * @param {string} version2 - The second version string.
 * @returns {number} - Returns `1` if `version1 > version2`, `-1` if `version1 < version2`, and `0` if they are equal.
 */
// Utility function to compare versions
function compareVersionsResolving(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1 = v1Parts[i] || 0;
    const v2 = v2Parts[i] || 0;

    if (v1 > v2) return 1;
    if (v1 < v2) return -1;
  }
  return 0;
}

/**
 * Resolves the GitHub repository URL for a given npm package and version range.
 *
 * @param {string} packageName - The name of the npm package.
 * @param {string} versionRange - The version range of the package.
 * @returns {Promise<string | null>} - Returns the GitHub repository URL or `null` if not found.
 */
async function getGitHubUrl(packageName: string, versionRange: string): Promise<string | null> {
  try {
    console.log("Entering githuburl function");
    const resolvedVersion = await resolveVersion(packageName, versionRange);
    const response = await axios.get(`https://registry.npmjs.org/${packageName}/${resolvedVersion}`);
    const packageData = response.data;

    const repository = packageData.repository;
    if (repository && repository.url) {
      // Transform the git URL to an HTTPS URL
      let gitUrl = repository.url;
      
      // Remove any git+ prefix
      gitUrl = gitUrl.replace(/^git\+/, "");

      // Transform git:// URLs to https:// URLs
      if (gitUrl.startsWith("git://")) {
        gitUrl = gitUrl.replace(/^git:\/\//, "https://");
      }

      // Remove trailing .git if present
      gitUrl = gitUrl.replace(/\.git$/, "");

      return gitUrl;
    }
    return null;
  } catch (error: any) {
    console.error(`Failed to fetch GitHub URL for ${packageName}@${versionRange}:`, error.message);
    return null;
  }
}

/**
 * Resolves the highest version of a package satisfying a given range.
 *
 * @param {string} packageName - The name of the npm package.
 * @param {string} versionRange - The version range to resolve.
 * @returns {Promise<string>} - Returns the resolved version.
 */
// Fetch all versions of a package and resolve the highest version satisfying a range
async function resolveVersion(packageName: string, versionRange: string): Promise<string> {
  try {
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
    const versions = Object.keys(response.data.versions);

    if (versionRange.startsWith('~')) {
      const baseVersion = versionRange.slice(1).split('.')[0];
      const filtered = versions.filter((v) => v.startsWith(baseVersion));
      return filtered.sort(compareVersionsResolving).pop() || '';
    }

    if (versionRange.startsWith('^')) {
      const baseVersion = versionRange.slice(1).split('.')[0];
      const filtered = versions.filter((v) => v.startsWith(baseVersion));
      return filtered.sort(compareVersionsResolving).pop() || '';
    }

    // Exact match or latest version
    if (versions.includes(versionRange)) return versionRange;
    return versions.pop() || 'latest';
  } catch (error: any) {
    console.error(`Failed to resolve version for ${packageName}@${versionRange}:`, error.message);
    throw error;
  }
}

/**
 * Calculates the size of a ZIP stream in bytes.
 *
 * @param {Readable} zipStream - The ZIP file stream.
 * @returns {Promise<number>} - Returns the size of the ZIP in bytes.
 */
async function getPackageSize(zipStream: Readable): Promise<number> {
  return new Promise((resolve, reject) => {
      let totalSize = 0;

      // Listen for data chunks
      zipStream.on("data", (chunk) => {
          totalSize += chunk.length; // Add chunk size to total
      });

      // Resolve the total size once the stream ends
      zipStream.on("end", () => {
          resolve(totalSize);
      });

      // Handle errors in the stream
      zipStream.on("error", (error) => {
          reject(error);
      });
  });
}

/**
 * Calculates the cost of a package or its dependencies based on size.
 *
 * @param {APIGatewayProxyEvent} event - The API Gateway event containing the package ID and dependency flag.
 * @returns {Promise<APIGatewayProxyResult>} - Returns the calculated cost or an error if not found.
 */
// // Get package cost from npm registry
async function getDependencyCost(packageName: string,owner:string, version:string): Promise<number> {
  try {
    // console.log(resolvedVersion)
    // console.log(versionRange)
    var zipUrl
    zipUrl = `https://github.com/${owner}/${packageName}/archive/refs/tags/v${version}.zip`
    if (!(await isUrlValid(zipUrl))) {
      zipUrl = `https://github.com/${owner}/${packageName}/archive/refs/tags/${version}.zip`
    }
    console.log("zipurl:",zipUrl)
    const zipStreamResponse = await axios.get(zipUrl, { responseType: "stream" });
    const package_cost = await getPackageSize(zipStreamResponse.data)
    return package_cost/1024;
  } catch (error: any) {
    console.error(`Failed to fetch details for ${packageName}@${version}:`, error.message);
    return 0;
  }
}
// async function getDependencyCost(packageName: string, versionRange: string = "latest"): Promise<number> {
//   try {
//     const resolvedVersion = await resolveVersion(packageName, versionRange);
//     console.log(versionRange)
//     const response = await axios.get(`https://registry.npmjs.org/${packageName}/${resolvedVersion}`);
//     const packageData = response.data;

//     const distSize = packageData.dist?.unpackedSize || 0; // Unpacked size in bytes
//     const cost = distSize / 1024; // Convert to KB
//     return cost;
//   } catch (error: any) {
//     console.error(`Failed to fetch details for ${packageName}@${versionRange}:`, error.message);
//     return 0;
//   }
// }

// Recursive function to calculate total package cost
/**
 * Calculates the cost of a package or its dependencies based on size.
 *
 * @param {APIGatewayProxyEvent} event - The API Gateway event containing the package ID and dependency flag.
 * @returns {Promise<APIGatewayProxyResult>} - Returns the calculated cost or an error if not found.
 */
var idx=0;
async function calculateTotalCost(
  repoUrl: string,
  version:string,
  visited: Set<string> = new Set()
): Promise<number> {
  if (visited.has(repoUrl)) {
    return 0; // Avoid cycles
  }
  visited.add(repoUrl);
  console.log("repoUrl:",repoUrl)

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?/);
  if (!match) throw new Error("Invalid GitHub URL");
  idx++;
  const [_, owner, repo] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/package.json`;

  const response = await axios.get(apiUrl, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
    },
  });

  const packageJson = JSON.parse(
    Buffer.from(response.data.content, "base64").toString("utf-8")
  );

  // Calculate the cost of the main package
  const mainPackageCost = await getDependencyCost(repo,owner, version);
  //const mainPackageCost = await getDependencyCost(repo, packageJson.version);
  let totalCost = mainPackageCost;
  console.log("mainPackageCost:",mainPackageCost)
  console.log(repoUrl)

  // return totalCost;

  // Process dependencies only (exclude devDependencies)
  const dependencies: { [key: string]: string } = packageJson.dependencies || {};
  for (const [dependency, versionRange] of Object.entries(dependencies)) {
    console.log("Dependency:",dependency)
    if (!versionRange) {
      throw new Error(`Invalid version range for ${dependency}`);
    }
    console.log(versionRange)
    // const resolvedVersion = await resolveVersion(dependency, String(versionRange));
    console.log(typeof(versionRange))
    const dependencyRepoUrl = await getGitHubUrl(dependency,versionRange); // Simplistic GitHub URL mapping
    const resolvedVersion = await resolveVersion(dependency, versionRange);
    // const resolvedVersion = versionRange;
    // const dependencyRepoUrl = `https://github.com/${dependency}`
    console.log(versionRange)
    console.log(dependencyRepoUrl,resolvedVersion)
    if (!dependencyRepoUrl) {
      throw new Error(`Dependency not found: ${dependency}`);
    }
    try {
      totalCost += await calculateTotalCost(dependencyRepoUrl, resolvedVersion,visited);
    } catch (error) {
      // Fallback: Calculate dependency cost directly if GitHub repo not found
      const dependencyCost = await getDependencyCost(dependency,dependency, String(versionRange));
      totalCost += dependencyCost;
    }
  }
  // console.log("TotalCost:",totalCost)
  // console.log(repoUrl)

  return totalCost;
}

/**
 * Calculates the cost of a package or its dependencies based on size.
 *
 * @param {APIGatewayProxyEvent} event - The API Gateway event containing the package ID and dependency flag.
 * @returns {Promise<APIGatewayProxyResult>} - Returns the calculated cost or an error if not found.
 */
export const get_cost = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string
    var dependency=false;
    if (event.body!=null) {
      const body = JSON.parse(event.body as string);
      if (body.hasOwnProperty('dependency')) {
        dependency = body.dependency
      }
    }
    if(!(id.includes("...."))){
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          {
            Error: "Invalid Package ID"
          })
      }
    }
    const package_name = id.split("....")[0]
    const version = id.split("....")[1]
    if (!(await package_version_exists(package_name,version))) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          {
            Error: "Package not found"
          })
      }
    }
    console.log(id);
    console.log(dependency);

    const url = await getGitHubUrl(package_name,version);
    if (!url) {
      throw new Error("Error");
    }
    const mod = url.substring(19);
    const sep = mod.indexOf('/');
    const owner = mod.substring(0, sep);
    const name = mod.substring(sep+1);
    var cost;
    if (!dependency) {
      console.log(url)
      console.log("owner:",owner)
      console.log("name:",name)
      cost = await getDependencyCost(name,owner,version);
    }
    else {
      console.log("Entering Dependency")
      cost = await calculateTotalCost(url,version);
    }
    cost = cost/1024;

    let response:any = {}
    response[id] = {
      "totalCost": cost
    }


    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response)
    };
  

  } 
  catch (error) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        {
          Error: String(error)
        })
    };
  }
};

