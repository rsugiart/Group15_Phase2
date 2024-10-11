import * as fs from 'fs';
// Function to read URLs from a file
function readURLs(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return data.split(/\r?\n/).filter(line => line.trim() !== ''); // Handle both \n and \r\n line endings
}
// Function to check if a URL is valid (npm or GitHub)
function isValidURL(url) {
    const npmRegex = /^https:\/\/www\.npmjs\.com\/package\/.+$/;
    const githubRegex = /^https:\/\/github\.com\/.+\/.+$/;
    return npmRegex.test(url) || githubRegex.test(url);
}
// Function to process URLs and filter valid ones
function processURLs(urls) {
    return urls.filter(isValidURL);
}
// Main function to run the script
function main() {
    const args = process.argv.slice(2); // Get command line arguments
    if (args.length < 1) {
        console.error("Usage: ts-node inputProcessor.ts <URL_FILE>");
        process.exit(1);
    }
    const urlFilePath = args[0]; // Get the file path from arguments
    try {
        const urls = readURLs(urlFilePath); // Read URLs from the file
        console.log("URLs found in file:", urls); // Debug: Log all URLs
        const validURLs = processURLs(urls); // Process and filter valid URLs
        console.log("Valid URLs:");
        validURLs.forEach(url => console.log(url)); // Print valid URLs
        // If no valid URLs found, log a message
        if (validURLs.length === 0) {
            console.error("No valid URLs found.");
        }
    }
    catch (error) {
        const err = error; // Type assertion
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}
main(); // Run the main function
