import { exec } from 'child_process';
import { processUrlFile } from './main.js';

/**
 * Executes a shell command and returns the output.
 * 
 * @param {string} command - The shell command to execute.
 * @returns {Promise<{ stdout: string; exitCode: number }>} 
 * - Resolves with an object containing:
 *   - `stdout` (string): The command's standard output.
 *   - `exitCode` (number): The exit code (0 indicates success).
 * - Rejects with an object containing:
 *   - `stdout` (string): Standard output (if any).
 *   - `stderr` (string): Error output (if any).
 *   - `exitCode` (number): Exit code of the command.
 * 
 * Example:
 * ```
 * runCommand('ls -la')
 *   .then(result => console.log(result.stdout))
 *   .catch(error => console.error(error.stderr));
 * ```
 */

export function runCommand(command: string): Promise<{ stdout: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // Error: reject the promise with stderr and exit code
        reject({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: error.code || 1 });
      } else {
        // Resolve with stdout and exit code 0
        resolve({ stdout: stdout.trim(), exitCode: 0 });
      }
    });
  });
}