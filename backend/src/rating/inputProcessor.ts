/**
 * URL Processor Script
 * 
 * This script processes a text file containing URLs, validates them against 
 * specific criteria (npm package or GitHub repository URLs), and outputs the valid URLs.
 * 
 * Functions:
 * - `readURLs(filePath: string): string[]`:
 *    - Reads URLs from a file, one per line.
 *    - Parameters:
 *      - `filePath` (string): Path to the file containing URLs.
 *    - Returns:
 *      - An array of URLs read from the file.
 *    - Throws:
 *      - Error if the file does not exist or cannot be read.
 * 
 * - `isValidURL(url: string): boolean`:
 *    - Validates a URL to check if it is an npm package or GitHub repository URL.
 *    - Parameters:
 *      - `url` (string): The URL to validate.
 *    - Returns:
 *      - `true` if the URL matches the criteria, `false` otherwise.
 * 
 * - `processURLs(urls: string[]): string[]`:
 *    - Filters an array of URLs, retaining only the valid ones.
 *    - Parameters:
 *      - `urls` (string[]): Array of URLs to process.
 *    - Returns:
 *      - Array of valid URLs.
 * 
 * - `main()`:
 *    - Entry point for the script.
 *    - Reads the file path from command-line arguments, processes URLs, and prints valid ones.
 *    - Handles errors and prints appropriate messages if no valid URLs are found.
 * 
 * Usage:
 * 1. Compile or execute the script using `ts-node`:
 *    ```bash
 *    ts-node inputProcessor.ts <URL_FILE>
 *    ```
 *    - Replace `<URL_FILE>` with the path to a file containing URLs, one per line.
 * 2. Example input file content:
 *    ```
 *    https://www.npmjs.com/package/example
 *    https://github.com/user/repo
 *    invalid-url
 *    ```
 * 3. Output:
 *    - Logs all URLs found in the file.
 *    - Prints only valid npm or GitHub URLs.
 * 
 * Example Output:
 * ```
 * URLs found in file: [
 *   'https://www.npmjs.com/package/example',
 *   'https://github.com/user/repo',
 *   'invalid-url'
 * ]
 * Valid URLs:
 * https://www.npmjs.com/package/example
 * https://github.com/user/repo
 * ```
 * 
 * Error Handling:
 * - Throws an error if the file does not exist.
 * - Displays an error message if no valid URLs are found.
 * 
 * Dependencies:
 * - `fs` (Node.js module): For file system operations.
 * 
 */

import * as fs from 'fs';

// Function to read URLs from a file
function readURLs(filePath: string): string[] {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return data.split(/\r?\n/).filter(line => line.trim() !== '');  // Handle both \n and \r\n line endings
}

// Function to check if a URL is valid (npm or GitHub)
function isValidURL(url: string): boolean {
    const npmRegex = /^https:\/\/www\.npmjs\.com\/package\/.+$/;
    const githubRegex = /^https:\/\/github\.com\/.+\/.+$/;
    return npmRegex.test(url) || githubRegex.test(url);
}

// Function to process URLs and filter valid ones
function processURLs(urls: string[]): string[] {
    return urls.filter(isValidURL);
}

// Main function to run the script
function main() {
    const args = process.argv.slice(2);  // Get command line arguments
    if (args.length < 1) {
        console.error("Usage: ts-node inputProcessor.ts <URL_FILE>");
        process.exit(1);
    }

    const urlFilePath = args[0];  // Get the file path from arguments
    try {
        const urls = readURLs(urlFilePath);  // Read URLs from the file
        console.log("URLs found in file:", urls);  // Debug: Log all URLs

        const validURLs = processURLs(urls);  // Process and filter valid URLs
        console.log("Valid URLs:");
        validURLs.forEach(url => console.log(url));  // Print valid URLs

        // If no valid URLs found, log a message
        if (validURLs.length === 0) {
            console.error("No valid URLs found.");
        }
    } catch (error) {
        const err = error as Error;  // Type assertion
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}

main();  // Run the main function
