# 461Project Phase 1

Group members:
Samuel Johnson,
Jana Gamal,
Doha Hafez,
Harrison Smith,
Sydney Chang

# Purpose
This project is a command line interface that scores the trustworthiness of input NPM and GitHub modules.

# Configuration
To setup this system, use the command:

./run install

This will install the required dependencies for the commands.

# Invoking
To run this system, first create an input .txt file with links to the NPM and GitHub modules to run over. It should be in this format:

https://github.com/cloudinary/cloudinary_npm
https://www.npmjs.com/package/express
https://github.com/nullivex/nodist

The system also requires a .env file with a GitHub authentication token, log file location and logging virbosity level (0 for silent, 1 for info, 2 for debugging). The file should be named ".env", and in this format:

GITHUB_TOKEN = *token here*
LOG_FILE = *path here*
LOG_LEVEL = *level here*

Next, run this command where "URL_FILE" is the path to the .txt file from the first invoking step:

./run *URL_FILE*



In order to test the system, you can also run:

./run test
