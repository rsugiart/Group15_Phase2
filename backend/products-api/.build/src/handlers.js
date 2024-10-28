"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_rating = exports.upload_package = exports.health = void 0;
// import * as dotenv from 'dotenv';
// dotenv.config();
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const client_codeartifact_1 = require("@aws-sdk/client-codeartifact");
const axios_1 = __importDefault(require("axios"));
const stream_1 = require("stream");
const jszip_1 = __importDefault(require("jszip"));
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const codeartifact_client = new client_codeartifact_1.CodeartifactClient({ region: 'us-east-2' });
const client = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
const tableName = "Packages";
function packPackage(package_name) {
    const result = (0, child_process_1.execSync)(`npm pack ${package_name}`, { encoding: 'utf-8' }).trim(); // Get the .tgz file name
    console.log(`Package created: ${result}`);
    return result; // This returns the file name (e.g., lodash-4.17.21.tgz)
}
// Function to find the full path of the file
function getPackagePath(fileName) {
    const currentDir = process.cwd(); // Get current working directory
    const fullPath = path.join(currentDir, fileName); // Create full path to the .tgz file
    return fullPath;
}
async function get_package_json(base64Zip) {
    try {
        // Decode Base64 to binary data in a Uint8Array
        const binaryString = atob(base64Zip);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        // Load zip data using JSZip
        const zip = await jszip_1.default.loadAsync(bytes);
        // Search for package.json in the ZIP contents
        let packageFile;
        zip.forEach((relativePath, file) => {
            if (relativePath.endsWith("package.json")) {
                packageFile = file;
            }
        });
        // Check if package.json was found
        if (!packageFile) {
            console.log("package.json not found in the ZIP file.");
            return;
        }
        // Read and print the contents of package.json
        const content = await packageFile.async("string");
        return content;
        console.log("Contents of package.json:", content);
    }
    catch (error) {
        console.error("Error reading package.json from ZIP:", error);
    }
}
async function calculateSHA256AndBuffer(stream) {
    return new Promise((resolve, reject) => {
        const hash = (0, crypto_1.createHash)("sha256");
        const chunks = [];
        stream.on("data", (chunk) => {
            hash.update(chunk);
            chunks.push(chunk); // Store chunks for later
        });
        stream.on("end", () => {
            const buffer = Buffer.concat(chunks); // Combine chunks into a single Buffer
            const hashValue = hash.digest("hex"); // Calculate the hash
            resolve({ hash: hashValue, buffer }); // Return hash and buffer
        });
        stream.on("error", reject);
    });
}
const health = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Go Serverless v1.0! Your function executed successfully!",
            input: event,
        }, null, 2),
    };
};
exports.health = health;
const upload_package = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const package_name = body.Name;
        var version;
        var stream;
        if (body.hasOwnProperty('Content')) {
            const zipBuffer = Buffer.from(body.Content, 'base64');
            const zipStream = stream_1.Readable.from(zipBuffer);
            stream = zipStream;
            const package_json = await get_package_json(body.Content);
            if (!package_json) {
                throw new Error("Error");
            }
            const info = JSON.parse(package_json);
            version = info.version;
        }
        else {
            const url = body.url;
            const mod = url.substring(19);
            const sep = mod.indexOf('/');
            const owner = mod.substring(0, sep);
            const name = mod.substring(sep + 1);
            if (url.includes("github.com")) {
                const api_url = `https://api.github.com/repos/${owner}/${name}`;
                const response = await axios_1.default.get(api_url);
                const tarballUrl = `${url}/zipball/${response.data.default_branch}`;
                const package_json_info = await axios_1.default.get(`https://raw.githubusercontent.com/${owner}/${name}/${response.data.default_branch}/package.json`);
                version = package_json_info.data.version;
                const tarballResponse = await axios_1.default.get(tarballUrl, { responseType: "stream" });
                stream = tarballResponse.data;
            }
            else if (url.includes("npmjs.com/package")) {
                const specificVersionRegex = /\/v\/\d+\.\d+\.\d+/;
                const match = url.match(specificVersionRegex);
                let response = undefined;
                let tarballUrl;
                if (match) {
                    version = match[1];
                    response = await axios_1.default.get(`https://registry.npmjs.org/${package_name}/${version}`);
                    response.data.dist.tarball;
                }
                else {
                    response = await axios_1.default.get(`https://registry.npmjs.org/${package_name}`);
                    version = response.data['dist-tags'].latest;
                    tarballUrl = response.data.versions[version].dist.tarball;
                }
                const tarballResponse = await axios_1.default.get(tarballUrl, { responseType: 'stream' });
                stream = tarballResponse.data;
            }
        }
        const { hash: assetSHA256, buffer: assetContent } = await calculateSHA256AndBuffer(stream);
        const input = {
            domain: "group15",
            repository: "SecurePackageRegistry", // required
            format: client_codeartifact_1.PackageFormat.GENERIC, // required
            namespace: "my-ns",
            package: package_name, // required
            packageVersion: version, // required
            assetContent: assetContent, // see \@smithy/types -> StreamingBlobPayloadInputTypes // required
            assetName: `${package_name}-${version}.zip`, // required
            assetSHA256: assetSHA256 // required
        };
        const command = new client_codeartifact_1.PublishPackageVersionCommand(input);
        let response = await codeartifact_client.send(command);
        const db_input = {
            "TableName": tableName,
            "Item": {
                "Name": {
                    "S": package_name
                },
                "Version": {
                    "S": version
                },
                "Rating": {
                    "S": "0.5"
                },
                "productID": {
                    "S": package_name
                }
            },
            "ReturnConsumedCapacity": client_dynamodb_1.ReturnConsumedCapacity.TOTAL,
        };
        const db_command = new client_dynamodb_1.PutItemCommand(db_input);
        const db_response = await client.send(db_command);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: response,
                input: event,
            }, null, 2),
        };
    }
    catch (error) {
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: String(error),
                input: event,
            }, null, 2),
        };
    }
};
exports.upload_package = upload_package;
const get_rating = async (event) => {
    var _a;
    try {
        const id = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.id;
        const input = {
            "Key": {
                "productID": {
                    "S": id
                }
            },
            "TableName": tableName
        };
        const command = new client_dynamodb_1.GetItemCommand(input);
        const response = await client.send(command);
        if (!(response && response.Item)) {
            throw new Error("Failed");
        }
        const rating = response.Item.rating;
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "5",
                input: event,
            }, null, 2),
        };
    }
    catch (error) {
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: String(error),
                input: event,
            }, null, 2),
        };
    }
};
exports.get_rating = get_rating;
//# sourceMappingURL=handlers.js.map