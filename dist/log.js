import { appendFileSync, existsSync, writeFileSync } from "fs";
import path from "path";
// const logLevel = parseInt(process.env.LOG_LEVEL as string, 10);
// const logFile = process.env.LOG_FILE;
export function logMessage(level, message) {
    const logLevel = parseInt(process.env.LOG_LEVEL, 10);
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
