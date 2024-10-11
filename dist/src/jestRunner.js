import { exec } from 'child_process';
export function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // Error: reject the promise with stderr and exit code
                reject({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: error.code || 1 });
            }
            else {
                // Resolve with stdout and exit code 0
                resolve({ stdout: stdout.trim(), exitCode: 0 });
            }
        });
    });
}
