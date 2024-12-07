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
  updatedAt: Date;
  createdAt: Date
  defaultBranchRef: {
    target: {
      history: {
        totalcount: number;
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
      updatedAt
      createdAt
      defaultBranchRef {
        target {
          ... on Commit {
            history {
              totalCount
            }
          }
        }
      }
    }
  }
`;

const stats = {
  list_commits_dates: [] as Array<Date>,
};

export async function calculateCAD(variables: { owner: string, name: string }): Promise<number> {
  return client.request<RepositoryQueryResponse>(query, variables, stats)
    .then(response => {
      if (response.data && response.data.repository) { //IF REPOSITORY DATA IS AVAILABLE
        if (response.data.repository.defaultBranchRef && response.data.repository.defaultBranchRef.target) { //IF BRANCH DATA IS AVAILABLE
          if (response.data.repository.defaultBranchRef.target.history) { //IF COMMIT HISTORY IS AVAILABLE
            var days = getDaysBetweenDates(response.data.repository.createdAt, response.data.repository.updatedAt);
            var commits = response.data.repository.defaultBranchRef.target.history.totalcount;
          } else {
            logMessage(2, 'Correctness - Commit number unavailable');
            return -1;
          }
        } else {
          logMessage(2, 'Correctness - No branch available');
          return -1;
        }
      }
      else {
        logMessage(2, 'Correctness - No repository data available');
        return -1;
      }
      const rateLimit = response.data.rateLimit;
      logMessage(2, `Correctness - Rate Limit: ${rateLimit.limit}`);
      logMessage(2, `Correctness - Cost: ${rateLimit.cost}`);
      logMessage(2, `Correctness - Remaining: ${rateLimit.remaining}`);
      logMessage(2, `Correctness - Reset At: ${rateLimit.resetAt}`);
      console.log(commits,days)
      return Math.min(commits / days, 1);
    })
    .catch(error => {
      return -1;
      // console.error(error);
      // throw error;
    });
}

// HELPER FUNCTIONS

function getDaysBetweenDates(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

