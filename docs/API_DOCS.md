# **Serverless Products API Documentation**


## **Overview**
This document provides detailed information about the AWS tools and REST endpoints used in the `products-api` service.


---


## **AWS Tools Used**


### **1. AWS Lambda**
- **Purpose**: Serverless compute service that runs provided functions in response to HTTP API calls.
- **Details**:
  - **Runtime**: Node.js 20.x.
  - **Lambda Hashing Version**: 20201221 for consistent deployments.
  - **Handlers**: Functions are defined to handle specific REST endpoints.


### **2. Amazon API Gateway (HTTP API)**
- **Purpose**: Routes HTTP requests to appropriate Lambda functions.
- **Details**:
  - Configured lightweight HTTP APIs for endpoints.
  - Supports methods like `GET` and `POST`.


### **3. Amazon DynamoDB**
- **Purpose**: NoSQL database service for storing user and package data.
- **Tables**:
  - **PackagesTable**: Stores package metadata.
    - **Attributes**:
      - `packageName` (HASH key).
      - `version` (RANGE key).
  - **UsersTable**: Stores user account information.
    - **Attributes**:
      - `username` (HASH key).
- **IAM Role Permissions**:
  - Allowed actions:
    - `PutItem`, `GetItem`, `DeleteItem`, and `Scan` for both tables.


### **4. AWS IAM (Identity and Access Management)**
- **Purpose**: Grants necessary permissions for Lambda functions to interact with DynamoDB.
- **Details**:
  - Role statements define least-privilege access for better security.


---


## **REST Endpoints**


### **1. GET `/health`**
- **Handler**: `src/handlers.health`
- **Description**: Health check endpoint to verify the API service status.
- **Responses**:
  - `200 OK`: Service is running and healthy.


---


### **2. POST `/package`**
- **Handler**: `src/handlers.upload_package`
- **Description**: Allows users to upload a package.
- **Body Parameters**:
  - `packageName`: Name of the package.
  - `version`: Version of the package.
  - `content`: Package data.
- **Responses**:
  - `200 OK`: Package uploaded successfully.
  - `400 Bad Request`: Invalid input data.


---


### **3. GET `/package/{id}/rate`**
- **Handler**: `src/handlers.get_rating`
- **Description**: Fetches the current rating of a package.
- **Path Parameters**:
  - `id`: Unique identifier of the package.
- **Responses**:
  - `200 OK`: Returns the package rating as a JSON object.
  - `404 Not Found`: Package with the specified `id` does not exist.


---


### **4. GET `/package/{id}`**
- **Handler**: `src/download.get_package`
- **Description**: Retrieves metadata or details of a specific package.
- **Path Parameters**:
  - `id`: Unique identifier of the package.
- **Responses**:
  - `200 OK`: Package details returned successfully.
  - `404 Not Found`: Package with the specified `id` does not exist.


---


### **5. POST `/package/download`**
- **Handler**: `src/download.download_package`
- **Description**: Initiates the download of a package.
- **Body Parameters**:
  - `packageName`: Name of the package to download.
  - `version`: Specific version to retrieve.
- **Responses**:
  - `200 OK`: Returns the package content.
  - `400 Bad Request`: Invalid parameters provided.
  - `404 Not Found`: Specified package/version not found.


---


### **6. POST `/login`**
- **Handler**: `src/authenticate.login`
- **Description**: Authenticates a user and provides JWT tokens for secure access.
- **Body Parameters**:
  - `username`: User's login identifier.
  - `password`: User's password.
- **Responses**:
  - `200 OK`: Authentication successful, JWT tokens returned.
  - `401 Unauthorized`: Invalid credentials.


---


## **CloudFormation Resources**


### **1. `PackagesTable`**
- **Purpose**: Stores package metadata with scalable read/write throughput.
- **Attributes**:
  - `packageName` (HASH key): Name of the package.
  - `version` (RANGE key): Package version.


### **2. `UsersTable`**
- **Purpose**: Stores user account information.
- **Attributes**:
  - `username` (HASH key): Unique username of the user.


---


## **Notes**
- All DynamoDB tables are provisioned with 1 read and 1 write capacity unit.
- Secure environment variables are used for authentication and authorization (`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`).


This documentation serves as a comprehensive reference for understanding and utilizing the `products-api` service.
