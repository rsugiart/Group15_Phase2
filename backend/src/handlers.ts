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

const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });
const client = new DynamoDBClient({ region: 'us-east-1' });
const tableName = "PackagesTable";
const docClient = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || "UsersTable";


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

async function isUrlValid(url:string) {
  try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok; // true if status is in the 200-299 range
  } catch (error) {
      console.error('Error checking URL:', error);
      return false; // Invalid URL or network error
  }
}

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


export const upload_package = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  try {

    const body = JSON.parse(event.body as string);
    const package_name = body.Name;
    console.log(body)
    const auth_header = event.headers["x-authorization"];
    const [success,message] = await verify_token(auth_header,"upload") || [];
    if (!success) {
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json"
      },
        body: JSON.stringify(
          {
            message: auth_header
          })
      }
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

      }
      else {
        version = body.Version;
      }

      
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
          response = await axios.get(`https://registry.npmjs.org/${package_name}`);
          version = response.data['dist-tags'].latest;
          tarballUrl = response.data.versions[version].dist.tarball

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
    
    // const result = await analyzeURL("https://github.com/lodash/lodash");
    // if (!result) {
    //   throw new Error("Erro");
    // }
    // console.log(result);
    // if (url.includes("npmjs.com/package")) {
    //   if (result.BusFactor <0.6 || result.ResponsiveMaintainer <0.6 || result.RampUp <0.6 || result.Correctness <0.6 || result.License <0.6 || result.GoodPinningPractice <0.6 || result.PullRequest <0.6 || result.NetScore <0.6) {
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
      "LicenseScore": 0.6,
      "LicenseScoreLatency": 0.6,
      "GoodPinningPractice": 0.6,
      "GoodPinningPracticeLatency": 0.6,
      "PullRequest": 0.6,
      "PullRequestLatency": 0.6,
      "NetScore": 0.6,
      "NetScoreLatency": 0.6
    }

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
    const rating_result = JSON.stringify(rating);
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

export const update_package = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
try {
  const id = event.pathParameters?.id as string;
  const body = JSON.parse(event.body as string);
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
      response = await axios.get(`https://registry.npmjs.org/${package_name}`);
      version = response.data['dist-tags'].latest;
      tarballUrl = response.data.versions[version].dist.tarball

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
        "N": "0"
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
function compareVersions(v1: string, v2: string): number {
  const [major1, minor1, patch1] = v1.split(".").map(Number);
  const [major2, minor2, patch2] = v2.split(".").map(Number);

  if (major1 !== major2) return major1 - major2;
  if (minor1 !== minor2) return minor1 - minor2;
  return (patch1 || 0) - (patch2 || 0);
}

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

export const get_cost = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string
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


    const input = {
      "ExpressionAttributeValues": {
        ":v1": {"S":package_name},
        ":v2": {"S":version}
      },
      "TableName": tableName,
      "KeyConditionExpression": "packageName = :v1 AND version = :v2",
      "ProjectionExpression": "packageCost"
    };
    const db_command = new QueryCommand(input)
    const db_response = await client.send(db_command)

    if (!db_response.Items) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          {
            Error: "Package not found"
          })
      }
    }
    if (db_response.Items.length== 0) {  
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
        {
          Error: "Package Not Found"
        })
      };
    }
  
    const cost = db_response.Items[0].packageCost.N
    if (!cost) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          {
            Error: "There is missing field(s) in the PackageID"
          })
      };
    }
    let response:any = {}
    response[id] = {
      "totalCost": parseFloat(cost)
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

