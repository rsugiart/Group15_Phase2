import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { userInfo } from "os";

// ====================================================================
//
// dynamodb setup
//
// ====================================================================
const docClient = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || "UsersTable";

// export const authenticate = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
export const authenticate = async (username: string, password: string): Promise<boolean> => {
    const params = {
        TableName: USERS_TABLE,
        Key: {
            username,
        },
    };
    const result = await docClient.get(params).promise();
    if (result.Item) {
        return result.Item.password === password;
    }
    return false;

    // compare passwords
    const hashedPassword = result.Item.password;
    return password === hashedPassword;
};

// ====================================================================
//
// authentication functions
//
// ====================================================================
export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const body = JSON.parse(event.body as string);
    const { username, password } = body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const params = {
        TableName: USERS_TABLE,
        Item: {
            username,
            password: hashedPassword,
            role: "user", // default role
        },
    };

    await docClient.put(params).promise();

    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: "User created",
            },
            null,
            2
        ),
    };
};

// ====================================================================
//
// add role-based access control
//
// ====================================================================
// const access_token = jwt.sign(
//     {
//         username, 
//         role: user.Item.role 
//     },
//     process.env.JWT_ACCESS_SECRET || "defaultSecret",
// );
export const verifyToken = async (event: APIGatewayProxyEvent, requiredRole?: string): Promise<APIGatewayProxyResult> => {
    const body = JSON.parse(event.body as string);
    const username = body.username;
    const password = body.password;
    const authenticated = await authenticate(username, password);
    // const event.headers.Authorization?.split(" ")[1];
    if (!authenticated) {
        return {
            statusCode: 401,
            body: JSON.stringify(
                {
                    message: "User Not Found",
                },
                null,
                2
            ),
        };
    }
    const access_token = jwt.sign(username, process.env.JWT_ACCESS_SECRET || "defaultSecret");
    if (requiredRole) {
        const user = await docClient.get({
            TableName: USERS_TABLE,
            Key: {
                username,
            },
        }).promise();
        if (user.Item.role !== requiredRole) {
            return {
                statusCode: 403,
                body: JSON.stringify(
                    {
                        message: "Forbidden",
                    },
                    null,
                    2
                ),
            };
        };
    };
    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                accessToken: access_token,
            }
        ),
    };
};

// export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {  
//     const body = JSON.parse(event.body as string);
//     const username = body.username;
//     const password = body.password;
//     const authenticated = await authenticate(username,password);
//     if (!authenticated) {
//         return {
//             statusCode: 401,
//             body: JSON.stringify(
//               {
//                 message: "User Not Found"
//               },
//               null,
//               2,
//             ),
//         }
//     }
//     const access_token = jwt.sign(username, process.env.JWT_ACCESS_SECRET || "defaultSecret");
//     return {
//       statusCode: 200,
//       body: JSON.stringify(
//         {
//           accessToken: access_token
//         }
//       )
//     };
//   };


// const authenticate = async (login:string,password:string) => {

//     return true
// }
