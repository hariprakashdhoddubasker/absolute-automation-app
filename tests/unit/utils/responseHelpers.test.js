// tests/unit/utils/responseHelpers.test.js

const {
  successResponse,
  errorResponse,
  handleError,
} = require('../../../src/utils/responseHelpers');
const whatsappMessagingService = require('../../../src/services/whatsappMessagingService');
const logger = require('../../../src/utils/logger');

jest.mock('../../../src/services/whatsappMessagingService');
jest.mock('../../../src/utils/logger');

describe('Response Helpers', () => {
  let res;

  beforeEach(() => {
    // Mock the Express response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Test Suite for successResponse function
   * This suite tests sending successful responses.
   */
  describe('successResponse', () => {
    /**
     * Test Case: Send success response with data and message
     * Ensures that the response is sent with the correct status code, data, and message.
     */
    it('should send a success response with data and message', () => {
      // Arrange
      const data = { id: 1 };
      const message = 'Operation successful';
      const statusCode = 200;

      // Act
      successResponse(res, data, message, statusCode);

      // Assert
      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message,
      });
    });

    /**
     * Test Case: Send success response with default values
     * Ensures that the response is sent with default status code and message when not provided.
     */
    it('should send a success response with default values', () => {
      // Arrange
      const data = { id: 1 };

      // Act
      successResponse(res, data);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Operation successful',
      });
    });
  });

  /**
   * Test Suite for errorResponse function
   * This suite tests sending error responses.
   */
  describe('errorResponse', () => {
    /**
     * Test Case: Send error response with message and status code
     * Ensures that the response is sent with the correct status code and error message.
     */
    it('should send an error response with message and status code', async () => {
      // Arrange
      const message = 'An error occurred';
      const statusCode = 500;

      // Act
      await errorResponse(res, message, statusCode);

      // Assert
      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message,
        errors: null,
      });
    });

    /**
     * Test Case: Send error response with default values
     * Ensures that the response is sent with default status code and message when not provided.
     */
    it('should send an error response with default values', async () => {
      // Act
      await errorResponse(res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'An error occurred',
        errors: null,
      });
    });

    /**
     * Test Case: Send error response with additional errors
     * Ensures that additional error details are included when provided.
     */
    it('should send an error response with additional errors', async () => {
      // Arrange
      const message = 'Validation error';
      const statusCode = 400;
      const errors = { field: 'This field is required' };

      // Act
      await errorResponse(res, message, statusCode, errors);

      // Assert
      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message,
        errors,
      });
    });

    /**
     * Test Case: Should not send WhatsApp message or log error
     * Ensures that errorResponse does not log or send messages.
     */
    it('should not send WhatsApp message or log error', async () => {
      // Arrange
      const message = 'An error occurred';
      const statusCode = 500;

      // Act
      await errorResponse(res, message, statusCode);

      // Assert
      expect(logger.error).not.toHaveBeenCalled();
      expect(
        whatsappMessagingService.sendMessageToManagement
      ).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message,
        errors: null,
      });
    });
  });

  /**
   * Test Suite for handleError function
   * This suite tests the error handling functionality.
   */
  describe('handleError', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should log error with default parameters and throw error in development', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const message = 'An error occurred';

      // Act & Assert
      await expect(handleError()).rejects.toThrow('An error occurred');

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error: An error occurred', {
        errorMessage: 'No error message provided',
        stack: 'No stack trace available',
      });
      expect(
        whatsappMessagingService.sendMessageToManagement
      ).not.toHaveBeenCalled();

      // Clean up
      process.env.NODE_ENV = 'test';
    });

    it('should log error with custom message and error object and throw error in test', async () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      const message = 'Custom error message';
      const error = new Error('Something went wrong');

      // Act & Assert
      await expect(handleError(message, error));

      // Assert
      expect(logger.error).toHaveBeenCalledWith(`Error: ${message}`, {
        errorMessage: error.message,
        stack: error.stack,
      });
      expect(
        whatsappMessagingService.sendMessageToManagement
      ).not.toHaveBeenCalled();
    });

    it('should not throw error in production environment unless shouldThrow is true', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const message = 'Error that should not be thrown';
      const error = new Error('Do not throw me');

      // Act
      await handleError(message, error);

      // Assert
      expect(logger.error).toHaveBeenCalled();
      expect(
        whatsappMessagingService.sendMessageToManagement
      ).toHaveBeenCalled();

      // Clean up
      process.env.NODE_ENV = 'test';
    });

    it('should throw error in production environment when shouldThrow is true', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const message = 'Error that should be thrown';
      const error = new Error('Throw me');

      // Act & Assert
      await expect(handleError(message, error, true, true)).rejects.toThrow(
        error
      );

      // Assert
      expect(logger.error).toHaveBeenCalled();
      expect(
        whatsappMessagingService.sendMessageToManagement
      ).toHaveBeenCalled();

      // Clean up
      process.env.NODE_ENV = 'test';
    });

    it('should not send WhatsApp message or log error when isRecursive is true', async () => {
      // Arrange
      const message = 'Recursive error';
      const error = new Error('Recursive issue');

      // Mock the logger and WhatsApp service
      const loggerSpy = jest.spyOn(logger, 'error');
      const sendMessageSpy = jest.spyOn(
        whatsappMessagingService,
        'sendMessageToManagement'
      );

      // Act
      await handleError(message, error, true, false, true);

      // Assert
      expect(logger.error).not.toHaveBeenCalled();
      expect(
        whatsappMessagingService.sendMessageToManagement
      ).not.toHaveBeenCalled();
    });

    it('should throw new error when no error object is provided and shouldThrow is true in production', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const message = 'No error object provided';

      // Act & Assert
      await expect(
        handleError(message, null, true, true)
      ).rejects.toThrow(message);

      // Assert
      expect(logger.error).toHaveBeenCalled();
      expect(
        whatsappMessagingService.sendMessageToManagement
      ).toHaveBeenCalled();

      // Clean up
      process.env.NODE_ENV = 'test';
    });

    it('should not throw error when shouldThrow is false in production', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const message = 'Error that should not be thrown';
      const error = new Error('Do not throw me');

      // Act
      await handleError(message, error, true, false);

      // Assert
      expect(logger.error).toHaveBeenCalled();
      expect(
        whatsappMessagingService.sendMessageToManagement
      ).toHaveBeenCalled();

      // Clean up
      process.env.NODE_ENV = 'test';
    });

    it('should throw error in development environment when shouldThrow is false', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const message = 'Error to be thrown';
      const error = new Error('Throw me');

      // Act & Assert
      await expect(handleError(message, error, true, false)).rejects.toThrow(
        error
      );

      // Assert
      expect(logger.error).toHaveBeenCalled();
      expect(
        whatsappMessagingService.sendMessageToManagement
      ).not.toHaveBeenCalled();

      // Clean up
      process.env.NODE_ENV = 'test';
    });
  });
});
