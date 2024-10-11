import fetch from 'node-fetch';

export class GitHubClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async request<T>(query: string, variables?: Record<string, any>, stats?: any): Promise<T> {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}
