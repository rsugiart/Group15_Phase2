import { createLogger, format, transports } from 'winston';
import * as dotenv from 'dotenv';
dotenv.config();
const logFile = process.env.LOG_FILE || 'app.log';
const logLevel = process.env.LOG_LEVEL || '0';
const logger = createLogger({
    level: logLevel === '2' ? 'debug' : logLevel === '1' ? 'info' : 'error',
    format: format.combine(format.timestamp(), format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)),
    transports: [
        new transports.File({ filename: logFile })
    ],
});
export default logger;
