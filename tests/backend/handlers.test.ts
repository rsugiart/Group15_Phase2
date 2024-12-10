// // test cases for retrieving packages
// import { test, expect } from '@playwright/test';
// import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
// import { CodeartifactClient, GetPackageVersionAssetCommand } from '@aws-sdk/client-codeartifact';
// import { before } from 'node:test';

// test.describe('API Tests with AWS Integration', () => {
//     test.beforeAll(async() => {
//         const codeartifact_client = new CodeartifactClient({ region: 'us-east-2' });
//         const client = new DynamoDBClient({ region: 'us-east-1' });
//         const tableName = "PackagesTable";        
//     });
//     test('Upload package successfully', async ({ request }) => {
//         const response = await request.post('/upload_package', {
//             data: {
//                 Name: 'new-package',
//                 Version: '1.0.0',
//                 Content: 'base64encodedcontent'
//             }
//         });

//         expect(response.status()).toBe(200);

//         const responseBody = await response.json();
//         expect(responseBody.message).toBe('Package uploaded successfully');
//         expect(responseBody.metadata.Name).toBe('my-package');
//         expect(responseBody.metadata.Version).toBe('1.0.0');
//         expect(responseBody.data.Content).toBeDefined();
//     });
//     test('Test existence of package', async ({request}) => {
//         const response = await request.post('/upload_package', {
//             data: {
//                 Name: 'new-package',
//                 Version: '1.0.0',
//                 Content: 'base64encodedcontent'
//             }
//         });
//         const package_response = await request.post('/package_exists');
//         expect(response.status()).toBe(true);
        
//     });
// });