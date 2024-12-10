//UNTESTED !!!!
import { stat } from 'node:fs/promises';
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
  pullRequests: {
    totalCount: number;
    nodes: {
        reviews: {
            totalCount: number;
        };
    }[];
  };
}

const query1 = `
  query GetRepoDetails($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      pullRequests {
        totalCount
      }
    }
  }
`;

/**
 * Calculates the Pull Request Fraction (PRFrac) for a GitHub repository.
 * PRFrac is the ratio of pull requests with at least one review to the total number of pull requests.
 *
 * @param {object} variables - Contains the repository's owner and name.
 * @returns {Promise<number>} - The calculated PRFrac (0 to 1) or -1 if an error occurs.
 */
export async function prFrac(variables: { owner: string, name: string }): Promise<number> {
    const stats = {
        reviewed: 0 as number,
        total: 100 as number //await calctotal(variables) as number//separate api request
        
    };
    console.log(stats.total);
    if(stats.total == -1) {
      return -1;
    }
    const query2 = `
  query GetRepoDetails($owner: String!, $name: String!) {
    rateLimit {
    limit
    cost
    remaining
    resetAt
    }  
    repository(owner: $owner, name: $name) {
      pullRequests(last: ${stats.total}) {
        totalCount
        nodes {
            reviews {
            totalCount
            }
        }
      }
    }
  }
`;

      return client.request<RepositoryQueryResponse>(query2, variables)
        .then(response => {
          // console.log(response);
          if (response.data && response.data.repository) { //IF REPOSITORY DATA IS AVAILABLE
            if (response.data.repository.pullRequests && response.data.repository.pullRequests.nodes) { //IF PULL REQUEST INFO IS AVAILABLE
              response.data.repository.pullRequests.nodes.forEach(node => {
                if (node.reviews && node.reviews.totalCount) {
                  if(node.reviews.totalCount > 0) {
                    stats.reviewed += 1 //count number with reviews
                  }
                }
              });
            } else {
              logMessage(2, 'PRFrac - No PR history available');
              return -1;
            }
          }
          else {
            logMessage(2, 'PRFrac - No repository data available');
            console.log("erro");
            return -1;
          }
          const rateLimit = response.data.rateLimit;
          logMessage(2, `PRFrac - Rate Limit: ${rateLimit.limit}`);
          logMessage(2, `PRFrac - Cost: ${rateLimit.cost}`);
          logMessage(2, `PRFrac - Remaining: ${rateLimit.remaining}`);
          logMessage(2, `PRFrac - Reset At: ${rateLimit.resetAt}`);
          console.log(stats.reviewed);
          return calcprFrac(stats);
        })
        .catch(error => {
          console.log("erro");
          return -1;
          //console.error(error);
          //throw error;
        });
}

/**
 * Helper function to calculate PRFrac.
 * PRFrac = (# of PRs with reviews) / (total PRs).
 *
 * @param {object} stats - Contains `reviewed` (count of PRs with reviews)
 *                         and `total` (total PRs).
 * @returns {number} - The calculated PRFrac or 0 if there are no PRs.
 */
function calcprFrac(stats: any): number {
    // prFrac: # prs with review / total prs
    logMessage(1, `PRFrac: ${stats.reviewed} out of ${stats.total}`);
    if(stats.total == 0) {
      return 0; // ensure no divide by 0
    }
    console.log(stats.reviewed / stats.total)
    return stats.reviewed / stats.total;
}

/**
 * Fetches the total number of pull requests for a GitHub repository.
 *
 * @param {object} variables - Contains the repository's owner and name.
 * @returns {Promise<number>} - The total number of pull requests or -1 if an error occurs.
 */
async function calctotal(variables: { owner: string, name: string }): Promise<number> {
  return client.request<RepositoryQueryResponse>(query1, variables)
    .then(response => {
      if (response.data && response.data.repository) { //IF REPOSITORY DATA IS AVAILABLE
        if (response.data.repository.pullRequests) { //IF PULL REQUEST INFO IS AVAILABLE
          console.log(response.data.repository.pullRequests.totalCount);
          return response.data.repository.pullRequests.totalCount
        } else {
          logMessage(2, 'PRFrac - No PR history available');
          console.log("error");
          return -1;
        }
      }
      else {
        logMessage(2, 'PRFrac - No repository data available');
        return -1;
      }
    })
    .catch(error => {
      return -1;
      //console.error(error);
      //throw error;
    });
}

/**
 * Main function to test the `prFrac` functionality with a specific repository.
 */
async function main() {
  await prFrac({owner:"lodash",name:"lodash"});
}

main();