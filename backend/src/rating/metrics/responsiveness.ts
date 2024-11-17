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
            committedDate: string;
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
            history(first: 20) {
              edges {
                node {
                  author {
                    user {
                      login
                    }
                  }
                  committedDate
                }
              }
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

export async function metricResponsiveness(variables: { owner: string, name: string }): Promise<number> {
  return client.request<RepositoryQueryResponse>(query, variables, stats)
    .then(response => {
      if (response.data && response.data.repository) { //IF REPOSITORY DATA IS AVAILABLE
        if (response.data.repository.defaultBranchRef && response.data.repository.defaultBranchRef.target) { //IF BRANCH DATA IS AVAILABLE
          if (response.data.repository.defaultBranchRef.target.history) { //IF COMMIT HISTORY IS AVAILABLE
            response.data.repository.defaultBranchRef.target.history.edges.forEach(edge => {
              stats.list_commits_dates.push(new Date(edge.node.committedDate)); //lists_commits_dates INSERT
            });
          } else {
            logMessage(2, 'Responsiveness - No commit history available');
            return -1;
          }
        } else {
          logMessage(2, 'Responsiveness - No branch available');
          return -1;
        }
      }
      else {
        logMessage(2, 'Responsiveness - No repository data available');
        return -1;
      }
      const rateLimit = response.data.rateLimit;
      logMessage(2, `Responsiveness - Rate Limit: ${rateLimit.limit}`);
      logMessage(2, `Responsiveness - Cost: ${rateLimit.cost}`);
      logMessage(2, `Responsiveness - Remaining: ${rateLimit.remaining}`);
      logMessage(2, `Responsiveness - Reset At: ${rateLimit.resetAt}`);
      return calcResponsiveness(stats);
    })
    .catch(error => {
      return -1;
      // console.error(error);
      // throw error;
    });
}

function calcResponsiveness(stats: any): number {
  // RESPONSIVENESS:
  // 40% RECENCY: 1 if most recent commit < 2 weeks ago, 0 if > 3 years
  // 60% FREQUENCY: 1 if average commit period < 2 weeks, 0 if > 15 weeks
  const currentDate = new Date();
  let periods: Array<number> = [];
  stats.list_commits_dates.forEach((date: Date) => {
    periods.push(getDaysBetweenDates(date, currentDate));
  });
  let periods_diff: Array<number> = [];
  for (let i = 0; i < periods.length - 1; i++) {
    periods_diff.push(Math.abs(periods[i] - periods[i + 1]));
  }

  logMessage(1, `Responsiveness - Most recent commit: ${Math.min(...periods)} days ago`);

  let recency = 1 - clampAndFit01(Math.min(...periods), 14, 365 * 3); //fit most recent commit date 0-1 from 2 weeks-3 years
  let frequency = periods_diff.reduce((acc, num) => acc + num, 0) / periods_diff.length;

  logMessage(1, `Responsiveness - Avg commit period: ${Math.round(frequency)} days`);

  frequency = 1 - clampAndFit01(frequency, 7 * 2, 7 * 15); //fit average days between commits 0-1 from 2-15 weeks
  logMessage(2, `Responsiveness - Recency scaled: ${recency}`);
  logMessage(2, `Responsiveness - Frequency scaled: ${frequency}`);
  let mResponsiveness: number = (0.4 * recency) + (0.6 * frequency);

  return mResponsiveness;
}






// HELPER FUNCTIONS

function clampAndFit01(value: number, in_min: number, in_max: number): number {
  const clampedValue = Math.min(Math.max(value, in_min), in_max);
  return ((clampedValue - in_min) / (in_max - in_min));
}

function getDaysBetweenDates(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}