import * as git from 'isomorphic-git';
import { logMessage } from '../../log.js';
import fs from 'fs';
// Analyze Commit Activity Density (CAD)
export async function calculateCAD(localPath) {
    try {
        // Get commit history
        const log = await git.log({ fs, dir: localPath });
        if (log.length === 0) {
            logMessage(2, 'Correctness - No commits found');
            return 0; // No commits, so CAD is 0
        }
        // Get the date of the first and last commit
        const firstCommitDate = new Date(log[log.length - 1].commit.author.timestamp * 1000);
        const lastCommitDate = new Date(log[0].commit.author.timestamp * 1000);
        logMessage(2, `Correctness - First commit: ${firstCommitDate.toISOString()}`);
        logMessage(2, `Correctness -Last commit: ${lastCommitDate.toISOString()}`);
        // Calculate the repository age in days
        const repoAgeInDays = Math.max((lastCommitDate.getTime() - firstCommitDate.getTime()) / (1000 * 60 * 60 * 24), 1); // To avoid division by zero
        logMessage(2, `Correctness - Repository age: ${repoAgeInDays} days`);
        // Calculate commits per day
        const commitsPerDay = log.length / repoAgeInDays;
        logMessage(2, `Correctness - Commits per day: ${commitsPerDay}`);
        // Normalize the CAD
        const maxCAD = 5;
        const normalizedCAD = Math.min(commitsPerDay / maxCAD, 1);
        return normalizedCAD;
    }
    catch (error) {
        logMessage(2, 'Correctness -Failed to calculate CAD');
        return -1;
        //console.error(`Failed to calculate CAD:`, error);
        //throw error;
    }
}
