export function parseUrl(url) {
    if (url.includes('github.com')) {
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            return { owner: match[1], repo: match[2] };
        }
    }
    else if (url.includes('npmjs.com')) {
        const match = url.match(/npmjs\.com\/package\/([^\/]+)/);
        if (match) {
            return { owner: '', repo: match[1] }; // For npm packages, repo is the package name
        }
    }
    throw new Error(`Invalid URL format: ${url}`);
}
