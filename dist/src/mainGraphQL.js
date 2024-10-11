import { metricResponsiveness } from './metrics/responsiveness.js';
import { metricRampUpTime } from './metrics/rampUpTime.js';
import { exec } from 'child_process';
let url = 'https://github.com/Samojo3303/461Project';
//url = 'https://github.com/cloudinary/cloudinary_npm';
//url = 'https://github.com/nullivex/nodist';
url = 'https://github.com/lodash/lodash';
//url = 'https://www.npmjs.com/package/express';
//url = 'https://www.npmjs.com/package/browserify';
let loc = checkURL(url);
if (loc == 'npm') {
    const packageName = parseNpmLink(url);
    await getGitHubFromNpm(packageName)
        .then(repoUrl => {
        url = repoUrl;
        loc = 'Run';
    })
        .catch(error => console.error(error));
}
if (loc == 'npm' || loc == 'Run') {
    const { owner, name } = parseGitHubLink(url);
    const variables = {
        owner, name
    };
    const responsiveness = await metricResponsiveness(variables);
    const rampUpTime = await metricRampUpTime(variables);
    console.log('-----------');
    console.log(`Responsiveness: ${responsiveness.toFixed(2)}`);
    console.log(`Ramp-up time: ${rampUpTime.toFixed(2)}`);
    console.log('-----------');
}
else {
    console.log('Invalid URL');
}
//HELPER FUNCTIONS
function parseGitHubLink(link) {
    // Remove any ".git" at the end of the link
    link = link.replace(/\.git$/, '');
    const match = link.match(/.*github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
        throw new Error('Invalid GitHub link');
    }
    return { owner: match[1], name: match[2] };
}
function parseNpmLink(link) {
    const match = link.match(/npmjs\.com\/package\/([^\/]+)/);
    if (!match) {
        throw new Error('Invalid npm link');
    }
    return match[1];
}
async function getGitHubFromNpm(packageName) {
    return new Promise((resolve, reject) => {
        // Run the `npm view` command to get the repository field of the package
        exec(`npm view ${packageName} repository.url`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`Error: ${stderr}`);
                return;
            }
            const repoUrl = stdout.trim();
            if (repoUrl) {
                resolve(repoUrl);
            }
            else {
                resolve(`No GitHub repository link found for package: ${packageName}`);
            }
        });
    });
}
function checkURL(link) {
    try {
        const url = new URL(link);
        const hostname = url.hostname.toLowerCase();
        if (hostname.includes('github.com')) {
            return 'Run';
        }
        else if (hostname.includes('npmjs.com')) {
            return 'npm';
        }
        else {
            return 'Unknown Source';
        }
    }
    catch (error) {
        return 'Invalid URL';
    }
}
