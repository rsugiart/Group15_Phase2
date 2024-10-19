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
  dependencyGraphManifests: {
    edges: {
      node: {
        dependencies: {
          totalCount: number;
          nodes: {
            packageName: string;
            requirements: string;
          }[];
        };
      };
    }[];
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
        dependencyGraphManifests {
            edges {
                node {
                    dependencies {
                        totalCount
                        nodes {
                            packageName
                            requirements
                        }
                    }
                }
            }
        }
    }
  }
`;

export async function dependFrac(variables: { owner: string, name: string }): Promise<number> {
  const pattern = /^[~^=] \d+\.\d+/
  const stats = {
    total: 0 as number,
    majmin: 0 as number
  };
  return client.request<RepositoryQueryResponse>(query, variables)
    .then(response => {
      if (response.data && response.data.repository) { //IF REPOSITORY DATA IS AVAILABLE
        if (response.data.repository.dependencyGraphManifests && response.data.repository.dependencyGraphManifests.edges) { //IF DEPENDENCY GRAPH IS AVAILABLE
          response.data.repository.dependencyGraphManifests.edges.forEach(edge => {
            if (edge.node && edge.node.dependencies && edge.node.dependencies.nodes) { //IF SPECIFIC DEPENDENCY INFO IS AVAILABLE
                stats.total += edge.node.dependencies.totalCount; //adding up the total dependencies
                edge.node.dependencies.nodes.forEach(node => {
                  if (node.packageName && node.requirements) {
                    if(pattern.test(node.requirements)) {
                        stats.majmin += 1; //checks that there is major/minor versioning
                    }
                  }
                });
            } else {
              logMessage(2, 'DependFrac - Specific dependency info is unavailable');
              return -1;
            }
          });
        } else {
          logMessage(2, 'DependFrac - No dependency graph available');
          return -1;
        }
      }
      else {
        logMessage(2, 'DependFrac - No repository data available');
        return -1;
      }
      const rateLimit = response.data.rateLimit;
      logMessage(2, `DependFrac - Rate Limit: ${rateLimit.limit}`);
      logMessage(2, `DependFrac - Cost: ${rateLimit.cost}`);
      logMessage(2, `DependFrac - Remaining: ${rateLimit.remaining}`);
      logMessage(2, `DependFrac - Reset At: ${rateLimit.resetAt}`);
      return calcDependFrac(stats);
    })
    .catch(error => {
      return -1;
      //console.error(error);
      //throw error;
    });
}

function calcDependFrac(stats: any): number {
  // Dependency Fraction: # of dependencies with major and minor versioning / total dependencies
  logMessage(1, `DependFrac: ${stats.majmin} out of ${stats.total}`);
  if(stats.total == 0) {
    return 0; // ensure no divide by 0
  }
  return stats.majmin / stats.total;
}