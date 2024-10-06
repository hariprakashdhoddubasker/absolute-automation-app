const winston = require('winston');
require('winston-daily-rotate-file'); // If you want to use log rotation

// Define the custom log format to apply the timestamp before the message
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'DD-MM-YYYY hh:mm:ss A' }), // Custom timestamp format
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] : ${message}`;

    // Check if there are any additional metadata (like errorMessage and stack)
    if (meta && Object.keys(meta).length) {
      logMessage += ` { errorMessage: ${meta.errorMessage || 'N/A'}, stack: ${meta.stack || 'N/A'} }`;
    }

    return logMessage;
  })
);

// Configure log transports (console, file, etc.)
const transports = [
  new winston.transports.Console({
    format: logFormat, // Correctly apply the custom format to the console transport
  }),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error', // Only log errors to this file
    format: logFormat,
  }),
  new winston.transports.File({
    filename: 'logs/combined.log', // Log everything to this file
    format: logFormat,
  }),
  // Optional: Log rotation (daily log rotation)
  new winston.transports.DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d', // Keep logs for 14 days
    format: logFormat,
  }),
];

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug', // Set log level based on environment
  transports,
});

// Export the logger for use across the app
module.exports = logger;
