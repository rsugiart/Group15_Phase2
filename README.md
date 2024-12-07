# Group15_Phase2
Repository Inherited from: Sydney Chang, Sam Johnson, Harrison Smith, Doha Hafez, Jana Gamal
Contributors: Areej Mirani, Ethan Hunt, Yingchen Jin, Varun Venkatesh, Ruth Sugiarto




Welcome to Group 15's Package Registry Webservice!!




## Introduction
Group 15 aims to develop a package registry for companies such as ACME to view and determine what packages to use in their software projects. Keep reading to find out how to put this repo to work!


## AWS Tech Stack


see documentation [here](docs/API_DOCS.md)




### General Overview:


##### General Overview:
**Code Implementation**
AWS Lambda
- creates serverless REST API
- move functions from GitHub to Lambda
- dynamically change if function doesn't work properly
- performance analysis easy to generate


**Storage**
Amazon Code Artifact
- store packages in registry
- CodeArtifact tailored to store big software packages
DynamoDB
- used to store metadata of package


**Deployment**
AWS EC2
-  create instances that will run all code


---


## Frontend


**Frontend Requirements**


see documentation [here](docs/SYSTEM_DEPLOYMENT.md)
![Image of landing page](images/frontend.png)
video of demo


---


## Backend


**Backend Requirements**


see documentation [here](docs/SYSTEM_DEPLOYMENT.md)
database image ?


---


## Cybersecurity


**Keeping your packages Secure**


see documentation [here](docs/THREAT_MODEL.md)
threatmodeler image ?


---


## Trustworthy Module Registry: Detailed Use Case


### Actors
1. **ACME Corporation Developers**: Engineers responsible for module integration in company projects.
2. **System Administrator**: Oversees registry operations, manages user access, and monitors security.
3. **External Collaborators**: Vendors or external developers with restricted access to specific modules.


### Goal
To provide a robust, secure, and efficient module registry tailored for ACME Corporation’s needs, ensuring reliable module usage, streamlined vetting processes, and secure internal storage.


---


### Primary Scenario


#### 1. Module Upload and Rating
- **Trigger**: A developer creates a new npm package to share within ACME's internal projects.
- **Action**:
  - Developer uploads the zipped package to the registry.
  - The system evaluates the package using metrics like dependency pinning and review percentages.
  - A rating score is generated and displayed.
- **Outcome**: Package is successfully uploaded and rated for quality assurance.


#### 2. Dependency and Version Management
- **Trigger**: Developer queries for specific versions of a dependency.
- **Action**:
  - Search API fetches version ranges (e.g., exact, bounded, or semantic ranges).
  - Developer selects an appropriate version for project compatibility.
- **Outcome**: Selected dependency version is added to the project.


#### 3. Efficient Search and Retrieval
- **Trigger**: A team member needs a module with specific functionality.
- **Action**:
  - Executes a search query using regex over package names and READMEs.
  - Retrieves a subset of matching modules with details.
- **Outcome**: Relevant modules are located efficiently.


#### 4. Internal Module Storage
- **Trigger**: ACME wants to store proprietary modules securely.
- **Action**:
  - Upload modules to private storage.
  - Restrict access to authorized employees or groups.
- **Outcome**: Proprietary modules are securely stored and accessed only by intended users.


#### 5. Package Ingestion
- **Trigger**: Developers request to add a public npm package.
- **Action**:
  - System validates the package against scoring metrics.
  - If acceptable, the package is ingested and added to the registry.
- **Outcome**: Public package is successfully integrated and accessible within the system.


#### 6. Cost and Impact Analysis
- **Trigger**: A manager requests an analysis of dependency size costs.
- **Action**:
  - System computes direct and transitive size costs.
  - Generates a cumulative report for multiple dependencies.
- **Outcome**: Decision-making on dependency use is supported by quantitative data.


---


### Extended Features


#### Security and Access Control
- The system executes a JavaScript monitoring program for validation.
- Role-based permissions regulate user actions (e.g., upload, search, download).


---


### Benefits
- **Streamlined Development**: Developers spend less time vetting modules manually.
- **Security Assurance**: Controlled access and monitoring reduce risks of malicious usage.
- **Scalability**: Designed to handle large-scale queries without performance degradation.
- **Customization**: Supports both private and public modules, catering to diverse use cases.




---




This project was developed as a part of ECE 461: Software Engineering at Purdue University. If you use this code, make sure to credit the authors! Under direction of Jamie Davis.
