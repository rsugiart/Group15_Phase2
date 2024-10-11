import { logMessage } from '../../log.js';
import { GitHubClient } from '../githubClient.js';
import * as dotenv from 'dotenv';
dotenv.config();
const token = process.env.GITHUB_TOKEN;
if (!token) {
    throw new Error("GitHub token is not defined in environment variables");
}
const client = new GitHubClient(token);
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
            tree {
              entries {
                name
                type
                object {
                  ... on Blob {
                    byteSize
                  }
                  ... on Tree {
                    entries {
                      name
                      type
                      object {
                        ... on Blob {
                          byteSize
                        }
                        ... on Tree {
                          entries {
                            name
                            type
                            object {
                              ... on Blob {
                                byteSize
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
          }
        }
      }
    }
  }
`;
const stats = {
    amt_files: 0,
    list_files: []
};
export async function metricRampUpTime(variables) {
    return client.request(query, variables)
        .then(response => {
        if (response.data && response.data.repository) { //IF REPOSITORY DATA IS AVAILABLE
            if (response.data.repository.defaultBranchRef.target.tree.entries) { //IF FILES ARE AVAILABLE
                response.data.repository.defaultBranchRef.target.tree.entries.forEach(entry => {
                    if (entry.type === 'blob') {
                        stats.amt_files++; //amt_files INCREMENT
                        if (entry.object && 'byteSize' in entry.object) {
                            stats.list_files.push(entry.object.byteSize); //list_files INSERT
                        }
                    }
                    else if (entry.type === 'tree' && entry.object.entries) {
                        entry.object.entries.forEach(subEntry => {
                            if (subEntry.type === 'blob') {
                                stats.amt_files++; //amt_files INCREMENT
                                if (subEntry.object && 'byteSize' in subEntry.object) {
                                    stats.list_files.push(subEntry.object.byteSize); //list_files INSERT
                                }
                            }
                            else if (subEntry.type === 'tree' && 'entries' in subEntry.object) {
                                subEntry.object.entries.forEach(subSubEntry => {
                                    if (subSubEntry.type === 'blob') {
                                        stats.amt_files++; //amt_files INCREMENT
                                        if (subSubEntry.object && 'byteSize' in subSubEntry.object) {
                                            stats.list_files.push(subSubEntry.object.byteSize); //list_files INSERT
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else {
                logMessage(2, 'RampUpTime - No files available');
                return -1;
            }
        }
        else {
            logMessage(2, 'RampUpTime - No repository data available');
            return -1;
        }
        const rateLimit = response.data.rateLimit;
        logMessage(2, `RampUpTime - Rate Limit: ${rateLimit.limit}`);
        logMessage(2, `RampUpTime - Cost: ${rateLimit.cost}`);
        logMessage(2, `RampUpTime - Remaining: ${rateLimit.remaining}`);
        logMessage(2, `RampUpTime - Reset At: ${rateLimit.resetAt}`);
        return calcRampUpTime(stats);
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
function calcRampUpTime(stats) {
    //RAMP UP TIME: (views first 2 levels of files)
    //50% NUM FILES: 1 if < 5 files, 0 if > 300
    //50% FILE SIZE: 1 if avg file size < 10KB, 0 if > 1000KB
    logMessage(1, `RampUpTime - Files: ${stats.amt_files}`);
    let files = 1 - clampAndFit01(stats.amt_files, 5, 300); //fit files 0-1 from 5-300
    let avg_file_size = stats.list_files.reduce((acc, num) => acc + num, 0) / stats.list_files.length;
    logMessage(1, `RampUpTime - Average file size: ${Math.round(avg_file_size / 1000)}KB`);
    avg_file_size = 1 - clampAndFit01(avg_file_size, 10000, 1000000); //fit file size 0-1 from 10KB-1000KB
    logMessage(2, `RampUpTime - Files scaled (0-1): ${files}`);
    logMessage(2, `RampUpTime - Average file size scaled (0-1): ${avg_file_size}`);
    let mRampUpTime = (0.5 * files) + (0.5 * avg_file_size);
    return mRampUpTime;
}
// HELPER FUNCTIONS 
function clampAndFit01(value, in_min, in_max) {
    const clampedValue = Math.min(Math.max(value, in_min), in_max);
    return ((clampedValue - in_min) / (in_max - in_min));
}
