// tests/services/bulkMessageService.test.js

const bulkMessageService = require('../../src/services/bulkMessageService');

// Mock dependencies
const whatsappMessagingService = require('../../src/services/whatsappMessagingService');
const waTrackingService = require('../../src/services/waTrackingService');
const whatsappQueueService = require('../../src/services/whatsappQueueService');
const { handleError } = require('../../src/utils/responseHelpers');

jest.mock('../../src/services/whatsappMessagingService');
jest.mock('../../src/services/waTrackingService');
jest.mock('../../src/services/whatsappQueueService');
jest.mock('../../src/utils/responseHelpers');

describe('Bulk Message Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
  });

  /**
   * Test Suite for processBulkMessages function
   */
  describe('processBulkMessages', () => {
    /**
     * Test Case: Successful processing of bulk messages
     * Ensures that messages are processed when there are available numbers and messages
     */
    it('should process messages when available numbers and messages exist', async () => {
      // Arrange

      // Mock available numbers from waTrackingService
      const availableNumbers = [
        {
          phone_number: '1234567890',
          instance_id: 'instance1',
          daily_limit: 100,
          message_count: 10,
        },
      ];
      waTrackingService.getAvailableNumbers.mockResolvedValue(availableNumbers);

      // Calculate total available messages
      const totalAvailableMessages = availableNumbers.reduce(
        (total, number) => total + (number.daily_limit - number.message_count),
        0
      );

      // Mock pending messages from whatsappQueueService
      const messagesToProcess = [
        {
          id: 1,
          name: 'John Doe',
          phone: '0987654321',
          message: 'Hello, World!',
          media_url: null,
          filename: null,
        },
      ];
      whatsappQueueService.getPendingMessages.mockResolvedValue(messagesToProcess);

      // Mock sending message
      whatsappMessagingService.sendMessage.mockResolvedValue(
        'message successfully sent to number'
      );

      // Mock updating WhatsApp tracking
      waTrackingService.updateWhatsAppTracking.mockResolvedValue();

      // Mock deleting message from queue
      whatsappQueueService.deleteMessageFromQueue.mockResolvedValue();

      // Act
      await bulkMessageService.processBulkMessages();

      // Assert
      expect(waTrackingService.getAvailableNumbers).toHaveBeenCalled();
      expect(whatsappQueueService.getPendingMessages).toHaveBeenCalledWith(
        totalAvailableMessages
      );
      expect(whatsappMessagingService.sendMessage).toHaveBeenCalled();
      expect(waTrackingService.updateWhatsAppTracking).toHaveBeenCalled();
      expect(whatsappQueueService.deleteMessageFromQueue).toHaveBeenCalled();
    });

    /**
     * Test Case: No available numbers
     * Ensures that an error is thrown when no numbers are available
     */
    it('should handle the case when no available numbers are found', async () => {
      // Arrange
      waTrackingService.getAvailableNumbers.mockResolvedValue([]);

      // Act
      await bulkMessageService.processBulkMessages();

      // Assert
      expect(waTrackingService.getAvailableNumbers).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith('All WhatsApp numbers have reached their daily limit');
      
    });

    /**
     * Test Case: No messages to process
     * Ensures that processing stops when there are no messages to process
     */
    it('should handle the case when no messages are available to process', async () => {
      // Arrange

      // Mock available numbers
      const availableNumbers = [
        {
          phone_number: '1234567890',
          instance_id: 'instance1',
          daily_limit: 100,
          message_count: 10,
        },
      ];
      waTrackingService.getAvailableNumbers.mockResolvedValue(availableNumbers);

      // Mock no pending messages
      whatsappQueueService.getPendingMessages.mockResolvedValue([]);

      // Act
      await bulkMessageService.processBulkMessages();

      // Assert
      expect(whatsappQueueService.getPendingMessages).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith('No messages found to process.');
    });

    /**
     * Test Case: Error during processing
     * Ensures that errors during processing are caught and logged
     */
    it('should catch and log errors during processing', async () => {
      // Arrange
      waTrackingService.getAvailableNumbers.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      await bulkMessageService.processBulkMessages();

      // Assert
      expect(handleError).toHaveBeenCalledWith(
        'Error in bulk message processing:',
        new Error('Database error')
      );
    });
  });
});
