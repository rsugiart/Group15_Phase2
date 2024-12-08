import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import jwt from "jsonwebtoken";

export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {  
    const body = JSON.parse(event.body as string);
    const username = body.username;
    const password = body.password;
    const authenticated = await authenticate(username,password);
    if (!authenticated) {
        return {
            statusCode: 401,
            body: JSON.stringify(
              {
                message: "User Not Found"
              },
              null,
              2,
            ),
        }
    }
    const access_token = jwt.sign(username, process.env.JWT_ACCESS_SECRET || "defaultSecret");
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          accessToken: access_token
        }
      )
    };
  };


export const authenticate = async (login:string,password:string) => {

    return true
}
