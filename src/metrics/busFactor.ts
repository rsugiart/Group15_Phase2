import { logMessage } from '../../log.js';
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
  defaultBranchRef: {
    target: {
      history: {
        edges: {
          node: {
            author: {
              user: {
                login: string;
              };
            };
          };
        }[];
      };
    };
  };
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
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 50) {
              edges {
                node {
                  author {
                    user {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function metricBusFactor(variables: { owner: string, name: string }): Promise<number> {
  const stats = {
    list_commits_authors: [] as Array<string>
  };
  return client.request<RepositoryQueryResponse>(query, variables)
    .then(response => {
      if (response.data && response.data.repository) { //IF REPOSITORY DATA IS AVAILABLE
        if (response.data.repository.defaultBranchRef && response.data.repository.defaultBranchRef.target) { //IF BRANCH DATA IS AVAILABLE
          if (response.data.repository.defaultBranchRef.target.history) { //IF COMMIT HISTORY IS AVAILABLE
            response.data.repository.defaultBranchRef.target.history.edges.forEach(edge => {
              if (edge.node.author && edge.node.author.user && edge.node.author.user.login) {
                stats.list_commits_authors.push(edge.node.author.user.login); //lists_commits_authors INSERT
              }
            });
          } else {
            logMessage(2, 'BusFactor - No commit history available');
            return -1;
          }
        } else {
          logMessage(2, 'BusFactor - No branch available');
          return -1;
        }
      }
      else {
        logMessage(2, 'BusFactor - No repository data available');
        return -1;
      }
      const rateLimit = response.data.rateLimit;
      logMessage(2, `BusFactor - Rate Limit: ${rateLimit.limit}`);
      logMessage(2, `BusFactor - Cost: ${rateLimit.cost}`);
      logMessage(2, `BusFactor - Remaining: ${rateLimit.remaining}`);
      logMessage(2, `BusFactor - Reset At: ${rateLimit.resetAt}`);
      return calcBusFactor(stats);
    })
    .catch(error => {
      return -1;
      //console.error(error);
      //throw error;
    });
}

function calcBusFactor(stats: any): number {
  // BUS FACTOR: 1 if > 5 or more collaborators, 0 if 1 collaborator
  const uniqueArray = Array.from(new Set(stats.list_commits_authors));
  logMessage(1, `BusFactor - Authors: ${uniqueArray.length}`);
  let mBusFactor: number = clampAndFit01(uniqueArray.length, 1, 5);
  return mBusFactor;
}





// HELPER FUNCTIONS 

function clampAndFit01(value: number, in_min: number, in_max: number): number {
  const clampedValue = Math.min(Math.max(value, in_min), in_max);
  return ((clampedValue - in_min) / (in_max - in_min));
}