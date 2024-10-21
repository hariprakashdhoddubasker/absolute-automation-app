// src/utils/responseHelpers.js

const whatsappMessagingService = require('../services/whatsappMessagingService');
const logger = require('./logger'); // Use a logger like Winston or Bunyan

/**
 * Sends a success response.
 * @param {object} res - The Express response object.
 * @param {any} data - The data to send in the response.
 * @param {string} message - A message describing the success.
 * @param {number} [statusCode=200] - The HTTP status code for the response.
 */
const successResponse = (
  res,
  data = null,
  message = 'Operation successful',
  statusCode = 200
) => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

/**
 * Sends an error response.
 * @param {object} res - The Express response object.
 * @param {string} message - The error message to send.
 * @param {number} [statusCode=500] - The HTTP status code for the response.
 * @param {any} [errors] - Additional error details, if any.
 */

/**
 * Sends an error response to the client and optionally handles WhatsApp notifications and error throwing.
 * This is intended for use in the controller layer.
 */
const errorResponse = async (
  res,
  message = 'An error occurred',
  statusCode = 500,
  errors = null,
  shouldThrow = false
) => {
  // Send the error response to the client
  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errors,
  });
};

/**
 * Error handler for logging, sending notifications, and optionally throwing errors.
 * This is used across all layers except the controller.
 */
const handleError = async (
  message = 'An error occurred',
  error = null,
  sendToWhatsApp = true,
  shouldThrow = false,
  isRecursive = false,
  forceNoThrow = false
) => {
  const env = process.env.NODE_ENV || 'development';

  // Log the error unless it's a recursive error
  if (!isRecursive) {
    logger.error(`Error: ${message}`, {
      errorMessage: error ? error.message : 'No error message provided',
      stack: error ? error.stack : 'No stack trace available',
    });
  }

  // If recursive, avoid further error handling
  if (isRecursive) return;

  // Log detailed error information
  logger.error(`Error: ${message}`, {
    errorMessage: error ? error.message : 'No error message provided',
    stack: error ? error.stack : 'No stack trace available',
  });

  // Send WhatsApp message to management if enabled and in production
  if (sendToWhatsApp && env === 'production') {
    try {
      const errorDetails = error ? `${message}: ${error.message}` : message;
      await whatsappMessagingService.sendMessageToManagement(
        `Error in Node.js App: ${errorDetails}`
      );
    } catch (error) {
      await handleError(
        'Failed to send WhatsApp notification',
        error,
        false,
        false,
        true
      );
    }
  }

  // Throw the error in development environments
  if (!forceNoThrow && (env === 'development')) {
    throw error || new Error(message);
  }

  // In production, throw the error only if shouldThrow is true
  if (shouldThrow && env === 'production') {
    throw error || new Error(message);
  }
};

module.exports = {
  successResponse,
  errorResponse,
  handleError,
};
