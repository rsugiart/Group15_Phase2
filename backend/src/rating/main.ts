import { metricResponsiveness } from './metrics/responsiveness.js';
import { metricRampUpTime } from './metrics/rampUpTime.js';
import { metricBusFactor } from './metrics/busFactor.js';
import { analyzeLicense } from './metrics/licenseCompatability.js';
import { calculateCAD } from './metrics/correctness.js';
import * as git from 'isomorphic-git';
import fs from 'fs';
import http from 'isomorphic-git/http/node/index.js';
import path from 'path';
import axios from 'axios';
import { logMessage } from './log.js';
import { log } from 'console';

/**
 * Analyzes a given URL (GitHub or npm) to calculate various repository quality metrics.
 * 
 * The function supports URLs pointing to GitHub repositories or npm packages. If an npm URL
 * is provided, it resolves the corresponding GitHub repository and performs the analysis.
 * Metrics include responsiveness, ramp-up time, bus factor, license compatibility, and correctness.
 * 
 * @param {string} url - The URL to analyze (GitHub repository or npm package URL).
 * 
 * @returns {Promise<object | null>} - An object containing the calculated metrics and their
 * respective latencies, or `null` if the analysis fails.
 * 
 * Metrics:
 * - NetScore: Weighted score based on individual metrics.
 * - Responsiveness, RampUpTime, BusFactor, License, Correctness: Scores between 0 and 1.
 * - Latencies: Time taken to compute each metric in seconds.
 * 
 * Example Output:
 * ```json
 * {
 *   "URL": "https://github.com/example/repo",
 *   "NetScore": 0.89,
 *   "NetScore_Latency": 0.345,
 *   "RampUp": 0.8,
 *   "RampUp_Latency": 0.234,
 *   "Correctness": 0.9,
 *   "Correctness_Latency": 0.123,
 *   "BusFactor": 0.75,
 *   "BusFactor_Latency": 0.678,
 *   "ResponsiveMaintainer": 0.85,
 *   "ResponsiveMaintainer_Latency": 0.456,
 *   "License": 1.0,
 *   "License_Latency": 0.123
 * }
 * ```
 */


// Main function to execute the metrics and repository analysis

// Check URL for GitHub or npm
export async function analyzeURL(url: string) {
  const originalUrl = url;
  const loc = checkURL(url);
  logMessage(2, `URL Location: ${loc}`);

  // If npm get github information
  if (loc === 'npm') {
    const packageName = parseNpmLink(url);
    logMessage(2, `parseNpmLink return: ${packageName}`);
    try {
      url = await getGitHubFromNpmAxios(packageName);
      logMessage(2, `getGitHubFromNpmAxios return: ${url}`);
    } catch (error) {
      console.error(error);

      return null; // Indicate failure
    }
  }

  // Run analysis on GitHub repository
  if (loc === 'npm' || loc === 'Run') {
    const { owner, name } = parseGitHubLink(url);
    const variables = { owner, name };
    logMessage(1, `Analyzing repository: ${owner}/${name}`);

    try {
      // Measure and run metrics
      const responsivenessStartTime = Date.now();
      const responsiveness: number = parseFloat((await metricResponsiveness(variables)).toFixed(3));
      const responsivenessLatency: number = parseFloat(((Date.now() - responsivenessStartTime) / 1000).toFixed(3));
      logMessage(1, `Responsiveness: ${responsiveness} (Latency: ${responsivenessLatency}s)`);


      const rampUpStartTime = Date.now();
      const rampUpTime: number = parseFloat((await metricRampUpTime(variables)).toFixed(3));
      const rampUpLatency: number = parseFloat(((Date.now() - rampUpStartTime) / 1000).toFixed(3));
      logMessage(1, `RampUpTime: ${rampUpTime} (Latency: ${rampUpLatency}s)`);

      const busFactorStartTime = Date.now();
      const busFactor: number = parseFloat((await metricBusFactor(variables)).toFixed(3));
      const busFactorLatency: number = parseFloat(((Date.now() - busFactorStartTime) / 1000).toFixed(3));
      logMessage(1, `BusFactor: ${busFactor} (Latency: ${busFactorLatency}s)`);

      const licenseScoreStartTime = Date.now();
      const licenseScore: number = parseFloat((await analyzeLicense(variables)).toFixed(3));
      const licenseScoreLatency: number = parseFloat(((Date.now() - licenseScoreStartTime) / 1000).toFixed(3));
      logMessage(1, `License: ${licenseScore} (Latency: ${licenseScoreLatency}s)`);

      const correctnessScoreStartTime = Date.now();
      const cadScore: number = parseFloat((await calculateCAD(variables)).toFixed(3));
      const correctnessScoreLatency: number = parseFloat(((Date.now() - correctnessScoreStartTime) / 1000).toFixed(3));
      logMessage(1, `Correctness: ${cadScore} (Latency: ${correctnessScoreLatency}s)`);

      // Define weights for metrics
      let weights = { rampUp: 0.15, correctness: 0.2, busFactor: 0.3, responsiveness: 0.15, license: 0.2 };
      if (rampUpTime === -1) {
        weights.rampUp = 0;
      }
      if (cadScore === -1) {
        weights.correctness = 0;
      }
      if (busFactor === -1) {
        weights.busFactor = 0;
      }
      if (responsiveness === -1) {
        weights.responsiveness = 0;
      }
      if (licenseScore === -1) {
        weights.license = 0;
      }
      const weightSum = weights.busFactor + weights.correctness + weights.rampUp + weights.responsiveness + weights.license;
      weights.rampUp = weights.rampUp / weightSum;
      logMessage(1, `RampUpTime Weight: ${JSON.stringify(weights.rampUp)}`);
      weights.correctness = weights.correctness / weightSum;
      logMessage(1, `Correctness Weight: ${JSON.stringify(weights.correctness)}`);
      weights.busFactor = weights.busFactor / weightSum;
      logMessage(1, `BusFactor Weight: ${JSON.stringify(weights.busFactor)}`);
      weights.responsiveness = weights.responsiveness / weightSum;
      logMessage(1, `Responsiveness Weight: ${JSON.stringify(weights.responsiveness)}`);
      weights.license = weights.license / weightSum;
      logMessage(1, `License Weight: ${JSON.stringify(weights.license)}`);

      // Calculate overall NetScore
      const netScore: number = parseFloat(
        (
          (rampUpTime * weights.rampUp) +
          (cadScore * weights.correctness) +
          (busFactor * weights.busFactor) +
          (responsiveness * weights.responsiveness) +
          (licenseScore * weights.license)
        ).toFixed(3)
      );
      const netScoreLatency: number = parseFloat(((Date.now() - responsivenessStartTime) / 1000).toFixed(3));
      logMessage(1, `NetScore: ${netScore} (Latency: ${netScoreLatency}s)`);

      // Output as NDJSON
      const output = {
        URL: originalUrl,
        NetScore: netScore,
        NetScore_Latency: netScoreLatency,
        RampUp: rampUpTime,
        RampUp_Latency: rampUpLatency,
        Correctness: cadScore,
        Correctness_Latency: correctnessScoreLatency,
        BusFactor: busFactor,
        BusFactor_Latency: busFactorLatency,
        ResponsiveMaintainer: responsiveness,
        ResponsiveMaintainer_Latency: responsivenessLatency,
        License: licenseScore,
        License_Latency: licenseScoreLatency
      };

      return output;
      process.exit(1);
    } catch (error) {
      console.error('Error during analysis:', error);
      return null; // Indicate failure
    }
  } else {
    console.log('Invalid URL');
    return null; // Indicate failure
  }
}

// Helper functions
function parseGitHubLink(link: string) {
  link = link.replace(/\.git$/, '');
  const match = link.match(/.*github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub link');
  }
  return { owner: match[1], name: match[2] };
}

function parseNpmLink(link: string) {
  const match = link.match(/npmjs\.com\/package\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid npm link');
  }
  return match[1];
}

async function getGitHubFromNpmAxios(packageName: string): Promise<string> {
  return axios.get(`https://registry.npmjs.com/${packageName}`)
    .then(response => {
      let repoUrl = response.data.repository.url;
      repoUrl = repoUrl.replace(/^git\+/, "");
      if (repoUrl) {
        return repoUrl;
      } else {
        return `No GitHub repository link found for package: ${packageName}`;
      }
    })
    .catch(error => {
      return `Error: ${error.message}`;
    });
}

function checkURL(link: string): 'Run' | 'npm' | 'Invalid URL' {
  try {
    logMessage(2, `Input URL: ${link}`);
    const url = new URL(link);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes('github.com')) {
      return 'Run';
    } else if (hostname.includes('npmjs.com')) {
      return 'npm';
    } else {
      return 'Invalid URL';
    }
  } catch {
    return 'Invalid URL';
  }
}

function cleanDirectory(localPath: string) {
  if (fs.existsSync(localPath)) {
    fs.rmSync(localPath, { recursive: true, force: true });
  }
}

async function cloneRepository(gitUrl: string, localPath: string) {
  cleanDirectory(localPath);

  // Replace ssh protocol with https
  if (gitUrl.startsWith('ssh://')) {
    gitUrl = gitUrl.replace(/^ssh:\/\/git@github.com\//, 'https://github.com/');
  }

  // Replace git protocol with https
  if (gitUrl.startsWith('git://')) {
    gitUrl = gitUrl.replace(/^git:\/\//, 'https://');
  }

  try {
    await git.clone({
      fs,
      http,
      dir: localPath,
      url: gitUrl,
      singleBranch: true,
      depth: 1,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to clone repository ${gitUrl}: ${error.message}`);
    } else {
      console.error(`Failed to clone repository ${gitUrl}:`, error);
    }
    throw error;
  }
}

// Process the URL_FILE and analyze each URL
export async function processUrlFile(filePath: string) {
  try {
    if (process.env.GITHUB_TOKEN === undefined) {
      console.error('GitHub token is not defined in environment variables');
      process.exit(1);
    }
    const urls = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);

    for (const url of urls) {
      const result = await analyzeURL(url);
      if (result) {
        console.log(JSON.stringify(result));
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error processing URL file:', error);
    process.exit(1);
  }
}

// Check for command-line arguments
processUrlFile("/Users/apple/Group15_Phase2/backend/src/rating/url.txt");
