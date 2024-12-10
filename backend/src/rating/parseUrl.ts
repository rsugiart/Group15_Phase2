/**
 * Parses a given URL to extract the owner and repository/package name.
 * 
 * Supports GitHub and npm URLs:
 * - For GitHub URLs, extracts the `owner` and `repo` name.
 * - For npm URLs, extracts the package name as `repo` (owner is empty).
 * 
 * @param {string} url - The URL to parse (GitHub repository or npm package URL).
 * 
 * @returns {{ owner: string, repo: string }} - An object containing the `owner` and `repo` (or package name for npm).
 * 
 * @throws {Error} - If the URL format is invalid.
 * 
 * Example Usage:
 * ```typescript
 * parseUrl('https://github.com/example/repo'); 
 * // Returns: { owner: 'example', repo: 'repo' }
 * 
 * parseUrl('https://www.npmjs.com/package/example-package');
 * // Returns: { owner: '', repo: 'example-package' }
 * ```
 */

export function parseUrl(url: string) {
    if (url.includes('github.com')) {
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    } else if (url.includes('npmjs.com')) {
      const match = url.match(/npmjs\.com\/package\/([^\/]+)/);
      if (match) {
        return { owner: '', repo: match[1] }; // For npm packages, repo is the package name
      }
    }
    throw new Error(`Invalid URL format: ${url}`);
  }
  