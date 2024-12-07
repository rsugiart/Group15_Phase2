import { logMessage } from '../log.js';
import { GitHubClient } from '../githubClient.js';
import * as dotenv from 'dotenv';
dotenv.config();

const token = process.env.GITHUB_TOKEN;
if (!token) {
  throw new Error("GitHub token is not defined in environment variables");
}
const client = new GitHubClient(token);

export interface RepositoryQueryResponse {
  data: {
    repository: Repository,
    rateLimit: RateLimit;
  };
}

export interface RateLimit {
  limit: number;
  cost: number;
  remaining: number;
  resetAt: string;
}

export interface Repository {
  license: {
    text: string;
  }
  license2: {
      text: string;
  }
  readme: {
      text: string;
  }
  readme2: {
      text: string;
  }
}

const query = `
  query GetRepoDetails($owner: String!, $name: String!) {
    rateLimit {
      limit
      cost
      remaining
      resetAt
    }
    repository(owner: $owner, name: $name) {
      readme: object(expression: "main:README.md") {
        ... on Blob {
          text
        }
      }
      readme2: object(expression: "master:README.md") {
        ... on Blob {
          text
        }
      }
      license: object(expression: "main:LICENSE") {
        ... on Blob {
          text
        }
      }
      license2: object(expression: "master:LICENSE") {
        ... on Blob {
          text
        }
      } 
    }
  }
`;

const stats = {
  amt_files: 0 as number,
  list_files: [] as Array<number>
};

export async function analyzeLicense(variables: { owner: string, name: string }): Promise<number> {
  return client.request<RepositoryQueryResponse>(query, variables)
    .then(response => {
      if (response.data && response.data.repository) { //IF REPOSITORY DATA IS AVAILABLE
        var licenseText;
        if (response.data.repository.license || response.data.repository.license2) { //IF LICENSE FILES ARE AVAILABLE
          logMessage(1, 'License - Reading license from LICENSE file');
          if(response.data.repository.license) {
            licenseText = response.data.repository.license;
          } else {
            licenseText = response.data.repository.license2;
          }
        } 
        else if (response.data.repository.readme || response.data.repository.readme2) {
          logMessage(1, 'License - Reading license from README file');
          if(response.data.repository.readme) {
            licenseText = response.data.repository.readme;
          } else {
            licenseText = response.data.repository.readme2;
          }
          licenseText = extractLicenseFromReadme(String(licenseText));
        } 
        else {
          logMessage(2, 'License - No files available');
          return -1;
        }
      }
      else {
        logMessage(2, 'License - No repository data available');
        return -1;
      }

      const rateLimit = response.data.rateLimit;
      logMessage(2, `License - Rate Limit: ${rateLimit.limit}`);
      logMessage(2, `License - Cost: ${rateLimit.cost}`);
      logMessage(2, `License - Remaining: ${rateLimit.remaining}`);
      logMessage(2, `License - Reset At: ${rateLimit.resetAt}`);
      console.log("License text",licenseText);
      // Determine if the license is compatible with LGPLv2.1
      if (licenseText && isLicenseCompatibleWithLGPLv21(String(licenseText))) {
        logMessage(2, 'License - License is compatible with LGPLv2.1');
        return 1; // License is compatible
      }
      logMessage(2, 'License - License is not compatible with LGPLv2.1');
      return 0; //License is not compatible
    })
    .catch(error => {
      return -1;
      // console.error('Error fetching repository data:', error);
      // if (error.response) {
      //   console.error('Response data:', error.response.data);
      // }
      // throw error;
    });
}

// HELPER FUNCTIONS 

function clampAndFit01(value: number, in_min: number, in_max: number): number {
  const clampedValue = Math.min(Math.max(value, in_min), in_max);
  return ((clampedValue - in_min) / (in_max - in_min));
}

// Utility function to check if a license is compatible with LGPLv2.1
export function isLicenseCompatibleWithLGPLv21(licenseText: string): boolean {
  const compatibleLicenses = [
    'LGPL-2.1',
    'LGPL-2.1-only',
    'LGPL-2.1-or-later',
    'MIT',
    'BSD-3-Clause',
    'BSD-2-Clause',
    'Apache-2.0',
    'GPL-2.0-or-later',
    'GPL-3.0-or-later'
  ];

  return compatibleLicenses.some((license) => licenseText.includes(license));
}

// Extract license from README using regex
function extractLicenseFromReadme(readmeContent: string): string | null {
  logMessage(2, 'License - Extracting license from README.md');
  const licenseRegex = /##\s*License\s*\n+([^#]+)/i;
  const match = readmeContent.match(licenseRegex);
  return match ? match[1].trim() : null;
}