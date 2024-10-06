// tests/controllers/whatsappController.test.js

const whatsappController = require('../../src/controllers/whatsappController');
const {
  successResponse,
  errorResponse,
} = require('../../src/utils/responseHelpers');
const { validateRequiredFields } = require('../../src/utils/validationHelpers');

// Mock the utility functions
jest.mock('../../src/utils/responseHelpers');
jest.mock('../../src/utils/validationHelpers');

// Mock the services that are lazily loaded in the controller
jest.mock('../../src/services/whatsappQueueService', () => ({
  createQueueEntries: jest.fn(),
}));

jest.mock('../../src/services/whatsappMessagingService', () => ({
  getDefaultInstanceId: jest.fn(),
  sendMessage: jest.fn(),
}));

jest.mock('../../src/services/bulkMessageService', () => ({
  processBulkMessages: jest.fn(),
}));

// Import the mocked services
const whatsappQueueService = require('../../src/services/whatsappQueueService');
const whatsappMessagingService = require('../../src/services/whatsappMessagingService');
const bulkMessageService = require('../../src/services/bulkMessageService');

describe('WhatsApp Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks before each test to prevent interference
    jest.resetAllMocks();

    // Mock Express.js request and response objects
    req = {
      body: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  /**
   * Test Suite for the createMessageQueueEntries method
   * This suite tests the creation of message queue entries,
   * ensuring that required fields are validated and errors are handled.
   */
  describe('createMessageQueueEntries', () => {
    /**
     * Test Case: Missing Required Fields
     * Validates that if required fields are missing,
     * the controller responds with an error and does not proceed.
     */
    it('should return an error if required fields are missing', async () => {
      // Arrange
      req.body = {}; // Missing 'message' and 'audienceType'
      validateRequiredFields.mockReturnValue(false);

      // Act
      await whatsappController.createMessageQueueEntries(req, res);

      // Assert
      expect(validateRequiredFields).toHaveBeenCalledWith(
        { message: undefined, audienceType: undefined },
        res
      );
      expect(whatsappQueueService.createQueueEntries).not.toHaveBeenCalled();
    });

    /**
     * Test Case: Successful Creation of Message Queue Entries
     * Ensures that when required fields are provided,
     * the controller creates queue entries and responds with success.
     */
    it('should create message queue entries and return success response', async () => {
      // Arrange
      req.body = {
        message: 'Hello World',
        mediaUrl: 'http://example.com/media.jpg',
        audienceType: 'all',
      };
      validateRequiredFields.mockReturnValue(true);
      const serviceResult = { success: true, count: 100 };
      whatsappQueueService.createQueueEntries.mockResolvedValue(serviceResult);

      // Act
      await whatsappController.createMessageQueueEntries(req, res);

      // Assert
      expect(validateRequiredFields).toHaveBeenCalledWith(
        { message: 'Hello World', audienceType: 'all' },
        res
      );
      expect(whatsappQueueService.createQueueEntries).toHaveBeenCalledWith(
        'Hello World',
        'http://example.com/media.jpg',
        'all'
      );
      expect(successResponse).toHaveBeenCalledWith(res, serviceResult, '', 201);
    });

    /**
     * Test Case: Error During Queue Entry Creation
     * Tests that if the service layer throws an error,
     * the controller handles it and responds with an error message.
     */
    it('should handle errors and return error response', async () => {
      // Arrange
      req.body = {
        message: 'Hello World',
        audienceType: 'all',
      };
      validateRequiredFields.mockReturnValue(true);
      const error = new Error('Service error');
      whatsappQueueService.createQueueEntries.mockRejectedValue(error);

      // Act
      await whatsappController.createMessageQueueEntries(req, res);

      // Assert
      expect(whatsappQueueService.createQueueEntries).toHaveBeenCalledWith(
        'Hello World',
        undefined,
        'all'
      );
      expect(errorResponse).toHaveBeenCalledWith(
        res,
        'Failed to create message queue entries.',
        500,
        error
      );
    });
  });

  /**
   * Test Suite for the sendWhatsappMessage method
   * This suite tests sending a WhatsApp message,
   * ensuring that required fields are validated and errors are handled.
   */
  describe('sendWhatsappMessage', () => {
    /**
     * Test Case: Missing Required Fields
     * Validates that if required fields are missing,
     * the controller responds with an error and does not proceed.
     */
    it('should return an error if required fields are missing', async () => {
      // Arrange
      req.body = {}; // Missing 'number', 'message', and 'accessToken'
      validateRequiredFields.mockReturnValue(false);

      // Act
      await whatsappController.sendWhatsappMessage(req, res);

      // Assert
      expect(validateRequiredFields).toHaveBeenCalledWith(
        { number: undefined, message: undefined, accessToken: undefined },
        res
      );
      expect(
        whatsappMessagingService.getDefaultInstanceId
      ).not.toHaveBeenCalled();
    });

    /**
     * Test Case: Successful Message Sending
     * Ensures that when required fields are provided,
     * the controller sends the message and responds with success.
     */
    it('should send WhatsApp message and return success response', async () => {
      // Arrange
      req.body = {
        number: '1234567890',
        message: 'Hello World',
        accessToken: 'valid_token',
        type: 'text',
        mediaUrl: null,
        filename: null,
      };
      validateRequiredFields.mockReturnValue(true);
      whatsappMessagingService.getDefaultInstanceId.mockResolvedValue(
        'instance_id'
      );
      whatsappMessagingService.sendMessage.mockResolvedValue(
        'message successfully sent to number'
      );

      // Act
      await whatsappController.sendWhatsappMessage(req, res);

      // Assert
      expect(validateRequiredFields).toHaveBeenCalledWith(
        {
          number: '1234567890',
          message: 'Hello World',
          accessToken: 'valid_token',
        },
        res
      );
      expect(
        whatsappMessagingService.getDefaultInstanceId
      ).toHaveBeenCalledWith(res);
      expect(whatsappMessagingService.sendMessage).toHaveBeenCalledWith({
        number: '1234567890',
        type: 'text',
        message: 'Hello World',
        mediaUrl: null,
        instanceId: 'instance_id',
        filename: null,
      });
      expect(successResponse).toHaveBeenCalledWith(
        res,
        'message successfully sent to number'
      );
    });

    /**
     * Test Case: Failed Message Sending
     * Tests that if sending the message fails,
     * the controller responds with an error message.
     */
    it('should return error if message sending fails', async () => {
      // Arrange
      req.body = {
        number: '1234567890',
        message: 'Hello World',
        accessToken: 'valid_token',
      };
      validateRequiredFields.mockReturnValue(true);
      whatsappMessagingService.getDefaultInstanceId.mockResolvedValue(
        'instance_id'
      );
      whatsappMessagingService.sendMessage.mockResolvedValue(
        'failed to send message'
      );

      // Act
      await whatsappController.sendWhatsappMessage(req, res);

      // Assert
      expect(whatsappMessagingService.sendMessage).toHaveBeenCalled();
      expect(errorResponse).toHaveBeenCalledWith(
        res,
        'Failed to send WhatsApp message.',
        500,
        'failed to send message'
      );
    });

    /**
     * Test Case: Error During Message Sending
     * Tests that if the service layer throws an error,
     * the controller handles it and responds with an error message.
     */
    it('should handle errors and return error response', async () => {
      // Arrange
      req.body = {
        number: '1234567890',
        message: 'Hello World',
        accessToken: 'valid_token',
      };
      validateRequiredFields.mockReturnValue(true);
      whatsappMessagingService.getDefaultInstanceId.mockResolvedValue(
        'instance_id'
      );
      const error = new Error('Service error');
      whatsappMessagingService.sendMessage.mockRejectedValue(error);

      // Act
      await whatsappController.sendWhatsappMessage(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(
        res,
        'Failed to send WhatsApp message.',
        500,
        error
      );
    });
  });

  /**
   * Test Suite for the sendQueuedWhatsAppMessages method
   * This suite tests processing of bulk messages,
   * ensuring that the process is initiated and errors are handled.
   */
  describe('sendQueuedWhatsAppMessages', () => {
    /**
     * Test Case: Successful Initiation of Bulk Message Processing
     * Ensures that the bulk message processing is initiated
     * and the controller responds with success.
     */
    it('should initiate bulk message processing and return success response', async () => {
      // Arrange
      // No specific setup needed as no parameters are required

      // Act
      await whatsappController.sendQueuedWhatsAppMessages(req, res);

      // Assert
      expect(successResponse).toHaveBeenCalledWith(res, {
        status: 'Processing Bulk Messages Started',
        timestamp: expect.any(String),
      });
      expect(bulkMessageService.processBulkMessages).toHaveBeenCalledWith(res);
    });

    /**
     * Test Case: Error During Bulk Message Processing
     * Tests that if the service layer throws an error,
     * the controller handles it and responds with an error message.
     */
    it('should handle errors and return error response', async () => {
      // Arrange
      const error = new Error('Service error');
      bulkMessageService.processBulkMessages.mockImplementation(() => {
        throw error;
      });

      // Act
      await whatsappController.sendQueuedWhatsAppMessages(req, res);

      // Assert
      expect(errorResponse).toHaveBeenCalledWith(
        res,
        'Failed to send bulk messages.',
        500,
        error
      );
    });
  });
});
