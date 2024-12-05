import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { CodeartifactClient, PackageFormat, PublishPackageVersionCommand, GetPackageVersionAssetCommand, ListPackagesCommand,ListPackageVersionsCommand, DeletePackageVersionsCommand,DeletePackageCommand} from "@aws-sdk/client-codeartifact";
import { Readable, Transform } from "stream";
import { DynamoDBClient, PutItemCommand, ReturnConsumedCapacity,GetItemCommand, QueryCommand,ScanCommand,DeleteItemCommand} from "@aws-sdk/client-dynamodb";
import { calculateSHA256AndBuffer,tarToZip,zipStreamToBase64,get_package_json } from "./helpers.js";
// import { analyzeURL } from "./rating/main.js";
import AWS from "aws-sdk";
import axios from "axios";

const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });
const client = new DynamoDBClient({ region: 'us-east-1' });
const tableName = "PackagesTable";
// const docClient = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || "UsersTable";

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
              "Performance track"
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
    // const auth_header = event.headers["x-authorization"];
    // const [success,message] = await verify_token(auth_header,"upload") || [];
    // if (!success) {
    //   return {
    //     statusCode: 403,
    //     headers: {
    //       "Content-Type": "application/json"
    //   },
    //     body: JSON.stringify(
    //       {
    //         message: auth_header
    //       })
    //   }
    // }
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
    if (body.hasOwnProperty('Content')) {
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
        // console.log("test: ",package_name,version)

      }

    }
    
    // const result = await analyzeURL("https://github.com/lodash/lodash");
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
          "N": "0"
        },
        "productID": {
          "S": `${package_name}-${version}`
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

