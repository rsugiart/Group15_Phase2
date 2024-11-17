import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, PutItemCommand, ReturnConsumedCapacity,GetItemCommand,QueryCommand} from "@aws-sdk/client-dynamodb";
import { analyzeURL } from "./rating/main.js";
import { RateParameters } from "./interfaces.js";

const client = new DynamoDBClient({ region: 'us-east-1' });
const tableName = "Packages";


export const get_rating= async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const id = event.pathParameters?.id as string
      // const input = {
      //   "Key": {
      //     "productID": {
      //       "S": id
      //     }
      //   },
      //   "TableName": tableName
      // };
      // const command = new GetItemCommand(input);
      // const response = await client.send(command);
      const package_name = id.split("-")[0]
      const version = id.split("-")[1]

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
      if (rating_object.BusFactor==-1 || rating_object.BusFactorLatency==-1 || rating_object.ResponsiveMaintainer==-1 || rating_object.ResponsiveMaintainerLatency==-1 || rating_object.RampUp==-1 || rating_object.RampUpLatency==-1 || rating_object.Correctness==-1 || rating_object.CorrectnessLatency==-1 || rating_object.License==-1 || rating_object.LicenseLatency==-1 || rating_object.GoodPinningPractice==-1 || rating_object.GoodPinningPracticeLatency==-1 || rating_object.PullRequest==-1 || rating_object.PullRequestLatency==-1 || rating_object.NetScore==-1 || rating_object.NetScoreLatency==-1) {
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
  
  