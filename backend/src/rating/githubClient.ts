/**
 * A GitHub GraphQL API Client.
 * 
 * This class provides an interface for making requests to the GitHub GraphQL API using a personal access token.
 * It allows sending queries with optional variables and additional parameters to interact with GitHub repositories,
 * issues, pull requests, and more.
 * 
 * Constructor:
 * - `GitHubClient(token: string)`: Initializes the client with a personal access token.
 * 
 * Methods:
 * - `async request<T>(query: string, variables?: Record<string, any>, adj?: any): Promise<T>`:
 *    - Sends a GraphQL query to the GitHub API and retrieves the response.
 *    - Parameters:
 *      - `query` (string): The GraphQL query string.
 *      - `variables` (optional, Record<string, any>): A map of variables to use in the query.
 *      - `adj` (optional, any): Additional data that might be needed for certain requests.
 *    - Returns:
 *      - A promise resolving to the parsed JSON response from the API.
 *    - Throws:
 *      - An error if the API request fails, with details about the failure.
 * 
 * Usage:
 * 1. Instantiate the client with a valid GitHub personal access token:
 *    ```typescript
 *    const client = new GitHubClient('your_token_here');
 *    ```
 * 2. Use the `request` method to send GraphQL queries:
 *    ```typescript
 *    const query = `
 *      query GetRepository($owner: String!, $name: String!) {
 *        repository(owner: $owner, name: $name) {
 *          name
 *          owner {
 *            login
 *          }
 *        }
 *      }
 *    `;
 *    const variables = { owner: 'octocat', name: 'Hello-World' };
 *    const response = await client.request(query, variables);
 *    console.log(response);
 *    ```
 * 
 * Dependencies:
 * - `node-fetch`: Used for making HTTP requests to the GitHub GraphQL API.
 * 
 */

import fetch from 'node-fetch';

export class GitHubClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async request<T>(query: string, variables?: Record<string, any>, adj?: any): Promise<T> {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ query, variables, adj }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}
