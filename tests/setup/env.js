// tests/setup/env.js
require('dotenv').config({ path: '.env.test' });
const logger = require('../../src/utils/logger');

// Store the original console methods
const originalConsoleLog = logger.info;
const originalConsoleError = console.error;
process.env.NODE_ENV = 'test';

beforeAll(() => {
  handleError = () => {};

    // Disable logger during tests
    logger.info = jest.fn();
    logger.error = jest.fn();
    logger.warn = jest.fn();
    logger.debug = jest.fn();
    logger.log = jest.fn();
  
    // Disable console outputs during tests
    global.console.log = jest.fn();
    global.console.error = jest.fn();
    global.console.warn = jest.fn();
    global.console.info = jest.fn();
    global.console.debug = jest.fn();
});

afterAll(() => {
  logger.info = originalConsoleLog;
  handleError = originalConsoleError;
});

global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

const winston = require('winston');
winston.configure({
  transports: [
    new winston.transports.Console({ silent: true }),
  ],
});