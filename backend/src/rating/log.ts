import { appendFileSync, existsSync, writeFileSync } from "fs";
import path from "path";

// const logLevel = parseInt(process.env.LOG_LEVEL as string, 10);
// const logFile = process.env.LOG_FILE;

/**
 * Logs a message to a file if the specified log level meets the configured threshold.
 * 
 * This function writes log messages to a file specified by the `LOG_FILE` environment variable.
 * The message is logged only if its severity level is greater than or equal to the configured
 * `LOG_LEVEL` environment variable.
 * 
 * @param {number} level - The severity level of the log message. Lower values indicate higher severity.
 * @param {string} message - The log message to write to the file.
 * 
 * Environment Variables:
 * - `LOG_LEVEL` (number): The minimum severity level required to log messages. Example: 1 (Error), 2 (Warning), etc.
 * - `LOG_FILE` (string): The path to the log file where messages should be written.
 * 
 * Behavior:
 * - If the log file does not exist, it is created.
 * - Log messages are appended to the file, including a timestamp, severity level, and message content.
 * - The message is ignored if `LOG_LEVEL` or `LOG_FILE` is not properly configured.
 * 
 * Example Usage:
 * ```typescript
 * import { logMessage } from './log.js';
 * 
 * logMessage(1, 'This is a critical error message.');
 * logMessage(2, 'This is a warning message.');
 * ```
 */

export function logMessage(level: number, message: string): void {
  const logLevel = parseInt(process.env.LOG_LEVEL as string, 10);
  const logFile = process.env.LOG_FILE;

  if (logLevel >= level && logFile) {
    const logPath = path.resolve(logFile);
    const logEntry = `${new Date().toISOString()} [${level}] ${message}\n`;

    if (!existsSync(logPath)) {
      writeFileSync(logPath, '');
    }
    appendFileSync(logPath, logEntry, `utf-8`);
  }
}

/*
IMPLEMENTATION

import { logMessage } from './log.js';

logMessage(1, message);

*/