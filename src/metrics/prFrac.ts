//UNTESTED !!!!
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

const query2 = `
  query GetRepoDetails($owner: String!, $name: String!) {
    rateLimit {
    limit
    cost
    remaining
    resetAt
    }  
    repository(owner: $owner, name: $name) {
      pullRequests(last: $adj) {
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

export async function prFrac(variables: { owner: string, name: string }): Promise<number> {
    const stats = {
        reviewed: 0 as number,
        total: await calctotal(variables) as number//separate api request
    };
    if(stats.total == -1) {
      return -1;
    }
      return client.request<RepositoryQueryResponse>(query2, variables, stats.total)
        .then(response => {
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
            return -1;
          }
          const rateLimit = response.data.rateLimit;
          logMessage(2, `PRFrac - Rate Limit: ${rateLimit.limit}`);
          logMessage(2, `PRFrac - Cost: ${rateLimit.cost}`);
          logMessage(2, `PRFrac - Remaining: ${rateLimit.remaining}`);
          logMessage(2, `PRFrac - Reset At: ${rateLimit.resetAt}`);
          return calcprFrac(stats);
        })
        .catch(error => {
          return -1;
          //console.error(error);
          //throw error;
        });
}

function calcprFrac(stats: any): number {
    // prFrac: # prs with review / total prs
    logMessage(1, `PRFrac - : ${stats.reviewed} out of ${stats.total}`);
    return stats.reviewed / stats.total;
}

async function calctotal(variables: { owner: string, name: string }): Promise<number> {
  return client.request<RepositoryQueryResponse>(query1, variables)
    .then(response => {
      if (response.data && response.data.repository) { //IF REPOSITORY DATA IS AVAILABLE
        if (response.data.repository.pullRequests) { //IF PULL REQUEST INFO IS AVAILABLE
          return response.data.repository.pullRequests.totalCount
        } else {
          logMessage(2, 'PRFrac - No PR history available');
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