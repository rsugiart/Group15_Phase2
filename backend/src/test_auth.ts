import AWSMOCK from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import bcrypt from 'bcrypt';
import { register } from './authenticate.js';
import { authenticate } from './authenticate.js';

AWSMOCK.setSDKInstance(AWS);

AWSMOCK.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
    if (params.Key.username === 'testUser') {
        callback(null, 
            { Item: { 
                username: "testUser",
                password: "$2a$10$abcdefgHashedPassword12345", // bcrypt hashed password
                role: "user"
             },
        });
    } else {
        callback(null, {}); // no user found
    }
});

const testRegister = async () => {
    const event = {
        body: JSON.stringify({
            username: 'testUser',
            password: '$2a$10$abcdefgHashedPassword12345',
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/register',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {
            accountId: '',
            apiId: '',
            authorizer: null,
            protocol: '',
            httpMethod: 'POST',
            identity: {
                accessKey: null,
                accountId: null,
                apiKey: null,
                apiKeyId: null,
                caller: null,
                clientCert: null,
                cognitoAuthenticationProvider: null,
                cognitoAuthenticationType: null,
                cognitoIdentityId: null,
                cognitoIdentityPoolId: null,
                principalOrgId: null,
                sourceIp: '',
                user: null,
                userAgent: '',
                userArn: null,
            },
            path: '/register',
            stage: '',
            requestId: '',
            requestTimeEpoch: 0,
            resourceId: '',
            resourcePath: '',
        },
        resource: '',
    };
    const response = await register(event);
    console.log("Register response: ", response);
}

testRegister();

const testLogin = async () => {
    const event = {
        body: JSON.stringify({
            username: 'testUser',
            password: '$2a$10$abcdefgHashedPassword12345',       // must match bycrypt hashed password
        }),
    };
    const { username, password } = JSON.parse(event.body);
    const response = await authenticate(username, password);
    console.log("Login response: ", response);
}

testLogin();