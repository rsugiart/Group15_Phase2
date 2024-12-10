import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, PutItemCommand, ReturnConsumedCapacity,GetItemCommand,QueryCommand} from "@aws-sdk/client-dynamodb";
import { analyzeURL } from "./rating/main.js";
import { RateParameters } from "./interfaces.js";
import { package_version_exists } from "./download.js";

const client = new DynamoDBClient({ region: 'us-east-1' });
const tableName = "PackagesTable";


export const get_rating= async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
        "ProjectionExpression": "rating"
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

    
      const rating = db_response.Items[0].rating.S
      if (!rating) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            {
              Error: "There is missing field(s) in the PackageID"
            })
        };
      }
      const rating_object:RateParameters = JSON.parse(rating)
      if (rating_object.BusFactor==-1 || rating_object.BusFactorLatency==-1 || rating_object.ResponsiveMaintainer==-1 || rating_object.ResponsiveMaintainerLatency==-1 || rating_object.RampUp==-1 || rating_object.RampUpLatency==-1 || rating_object.Correctness==-1 || rating_object.CorrectnessLatency==-1 || rating_object.LicenseScore==-1 || rating_object.LicenseScoreLatency==-1 || rating_object.GoodPinningPractice==-1 || rating_object.GoodPinningPracticeLatency==-1 || rating_object.PullRequest==-1 || rating_object.PullRequestLatency==-1 || rating_object.NetScore==-1 || rating_object.NetScoreLatency==-1) {
        return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            {
              Error: "The package rating system choked on at least one of the metrics"
            })
        };
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rating_object)
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
  
  