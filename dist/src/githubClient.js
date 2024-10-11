import fetch from 'node-fetch';
export class GitHubClient {
    token;
    constructor(token) {
        this.token = token;
    }
    async request(query, variables, stats) {
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
        return response.json();
    }
}
