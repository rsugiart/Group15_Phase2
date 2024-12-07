# CI/CD Pipeline Documentation




## Overview




The **Project CI/CD Pipeline** is designed to automate the development workflow, ensurign that code changes are tested, verified, and deployed seamlessly. The pipeline is triggered on every push to the <code>main</code> branch and for all pull requests, emphasizing continuous integration and delivery.
This documentation outlines the pipeline's current setup and a future roadmap for enabling frontend deployment capabilities.


---


## Current Pipeline Design


### Trigger Conditions


The pipeline initiates under the following conditions:
- **Push Events:** Any changes pushed to the <code>main</code> branch.
- **Pull Requests:** All pull request activities.


### Jobs


#### **1. Super Lint**
This job is responsible for linting the codebase and deploying the backend services using the Serverless Framework.


##### **Steps**
1. **Checkout Code**
    '''yaml
    - uses: actions/checkout@v2


2. **Install Serverless Framework**
    '''yaml
    - name: Install Serverless Framework
    run: |
        npm install -g serverless


3. **Configure AWS Credentials**
    '''yaml
    - name: Configure AWS Credentials
    uses: aws-actions/configure-aws-credentials@v1
    with:
        aws-access-key-id: "AKIAQ6HIYJ76AI6KVVTY"
        aws-secret-access-key: "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"
        aws-region: us-east-1
   
4. **Deploy Backend Services**
    '''yaml
    - name: Deploy with Serverless
    env:
        SERVERLESS_ACCESS_KEY: "AKZZBuUhiG65YgNACJk7PoSHds2ld5qOVKlIoZoSS8Dju"
        NPM_TOKEN: "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"
    run: |
        npm set "//registry.npmjs.org/:_authToken=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"
        cd backend
        npm ci
        serverless deploy


---


## Security Considerations


##### AWS Credentials:
Ensure AWS credentials (<code>aws-access-key-id</code> and <code>aws-secret-access-key</code>) are securely stored using GitHub Secrets. Hardcoding sensitive credentials in pipeline files is discouraged for security reasons.


##### NPM Tokens:
The <code>NPM_TOKEN</code> and <code>SERVERLESS_ACCESS_KEY</code> should also be stored in GitHub Secrets and accessed dynamically.


---


## Future Plans: Frontend Deployment


To enhance the CI/CD pipeline, a future iteration will include deploying frontend assets alongside the backend.


## Benefits


- **Improved User Experience**: Deploying frontend pages ensures seamless updates for end users.
- **Streamlined Workflow**: Combines backend and frontend deployment within a unified pipeline.
- **Enhanced Scalability**: Enables deployment to CDNs for faster load times globally.


---


## Closing Thoughts


The current CI/CD pipeline effectively handles backend deployment and code linting. Moving forward, extending the pipeline for frontend deployment will enhance its capabilities, enabling full-stack continuous delivery. Adopting best practices for security and modularization will ensure a scalable and robust pipeline.


- install package
- uploads to aws backend
- need to configure frontend


once you push to github then it will deploy to aws automatically
