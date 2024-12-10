// // test cases for authentication features on backend
// import { test, expect } from '@playwright/test';
// import { login } from '../../backend/src/authenticate.ts'
// import fs from 'fs';
// import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// const createMockEvent = (body: Record<string, unknown>): APIGatewayProxyEvent => ({
//   body: JSON.stringify(body),
//   headers: {},
//   multiValueHeaders: {},
//   httpMethod: 'POST',
//   isBase64Encoded: false,
//   path: '/login',
//   pathParameters: null,
//   queryStringParameters: null,
//   multiValueQueryStringParameters: null,
//   stageVariables: null,
//   requestContext: {} as any,
//   resource: '',
// });

// test.describe("testing authentication features", () => {
//     test.beforeAll(async() => {
        
//     });

//     test('Authenticate test user correctly.', async() => {
        
//         const test_user = createMockEvent({username: 'testuser', password: 'testpassword'});
//         const outcome: APIGatewayProxyResult = await login(test_user);
//         expect(outcome.statusCode).toBe(200); //successfully authenticated user and logged them in
//         const body = JSON.parse(outcome.body);
//         expect(body).toHaveProperty('accessToken');
//     })
    
//     test('Authentication blocks invalid user request', async() =>{
//       const test_user = createMockEvent({ username: 'wronguser', password: 'wrongpassword' });
//       const outcome: APIGatewayProxyResult = await login(test_user);
//       expect(outcome.statusCode).toBe(401); // authentication should fail
//       const body = JSON.parse(outcome.body);
//       expect(body).toHaveProperty('error');
//     });
// });