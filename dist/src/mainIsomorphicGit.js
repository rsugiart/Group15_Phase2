import * as git from 'isomorphic-git';
import fs from 'fs';
import http from 'isomorphic-git/http/node';
import path from 'path';
import { analyzeContributors } from './metrics/busFactor';
import { analyzeLicense } from './metrics/licenseCompatability';
import { calculateCAD } from './metrics/correctness';
// Delete the existing repository directory if it exists
function cleanDirectory(localPath) {
    if (fs.existsSync(localPath)) {
        fs.rmSync(localPath, { recursive: true, force: true }); // Remove the directory
    }
}
// Clone the repository with force checkout
async function cloneRepository(gitUrl, localPath) {
    cleanDirectory(localPath);
    try {
        await git.clone({
            fs,
            http,
            dir: localPath,
            url: gitUrl,
            singleBranch: true,
            depth: 1, // Shallow clone to get the latest commit only
        });
        console.log(`Repository cloned to ${localPath}`);
    }
    catch (error) {
        console.error(`Failed to clone repository ${gitUrl}:`, error);
        throw error;
    }
}
// Main function to analyze the repository
async function analyzeRepo(gitUrl) {
    const localPath = path.join('./temp-repo');
    // Clone the repository
    await cloneRepository(gitUrl, localPath);
    // Analyze contributors
    const contributorScore = await analyzeContributors(localPath);
    console.log(`Contributor Score: ${contributorScore}`);
    // Analyze license
    const licenseScore = await analyzeLicense(localPath);
    console.log(`License Score: ${licenseScore}`);
    // Calculate Commit Activity Density (CAD)
    const cadScore = await calculateCAD(localPath);
    console.log(`Commit Activity Density (CAD) Score: ${cadScore.toFixed(2)}`);
    // Clean up the repository after analysis
    cleanDirectory(localPath);
    // Weights for each factor in the correctness score
    const weights = { contributor: 0.3, license: 0.3, cad: 0.4 };
    // Calculate overall correctness score
    const correctnessScore = (contributorScore * weights.contributor) +
        (licenseScore * weights.license) +
        (cadScore * weights.cad);
    console.log(`Overall Correctness Score: ${correctnessScore.toFixed(2)} (0 = low, 1 = high)`);
}
// Example usage
const gitUrl = 'https://github.com/lodash/lodash'; // Replace with the actual URL
analyzeRepo(gitUrl).catch(err => console.error(err));
