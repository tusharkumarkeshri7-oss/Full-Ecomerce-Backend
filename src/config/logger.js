import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { env } from './env.js';

// Ensure logs directory exists if not in test environment
const logDir = path.resolve('logs');
if (!env.isTest && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.printf(({ level, message, timestamp, stack, requestId, ...meta }) => {
  const reqPart = requestId ? `[req-id: ${requestId}] ` : '';
  const metaPart = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level.toUpperCase()}] ${reqPart}${message}${stack ? `\n${stack}` : ''}${metaPart}`;
});

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
    silent: env.isTest
  })
];

if (!env.isTest) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json())
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: winston.format.combine(winston.format.timestamp(), winston.format.json())
    })
  );
}

export const logger = winston.createLogger({
  level: env.isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat()
  ),
  transports
});

/**
 * Morgan stream interface to pipe HTTP request logs into Winston
 */
export const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};
