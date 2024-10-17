// tests/services/bulkMessageService.test.js

const bulkMessageService = require('../../../src/services/bulkMessageService');

// Mock dependencies
const whatsappMessagingService = require('../../../src/services/whatsappMessagingService');
const waTrackingService = require('../../../src/services/waTrackingService');
const whatsappQueueService = require('../../../src/services/whatsappQueueService');
const { handleError } = require('../../../src/utils/responseHelpers');
const logger = require('../../../src/utils/logger');

jest.mock('../../../src/services/whatsappMessagingService');
jest.mock('../../../src/services/waTrackingService');
jest.mock('../../../src/services/whatsappQueueService');
jest.mock('../../../src/utils/responseHelpers');
jest.mock('../../../src/utils/logger');

describe('Bulk Message Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
    process.env.NODE_ENV = 'test'; // Set the environment to 'test'
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

      // Mock high-priority messages from whatsappQueueService
      const highPriorityMessages = [
        {
          id: 1,
          name: 'John Doe',
          phone: '0987654321',
          message: 'Hello, High Priority!',
          media_url: null,
          filename: null,
        },
      ];
      whatsappQueueService.getHighPriorityQueuedMessages.mockResolvedValue(
        highPriorityMessages
      );

      // Mock normal-priority messages
      const normalPriorityMessages = [
        {
          id: 2,
          name: 'Jane Smith',
          phone: '1234567890',
          message: 'Hello, Normal Priority!',
          media_url: null,
          filename: null,
        },
      ];
      // Assume we need to fetch normal priority messages
      whatsappQueueService.getPendingQueuedMessagesWithLimit.mockResolvedValue(
        normalPriorityMessages
      );

      // Mock processMessageQueue
      const messageSummary = 'Messages processed';
      jest
        .spyOn(bulkMessageService, 'processMessageQueue')
        .mockResolvedValue(messageSummary);

      // Mock sending message
      whatsappMessagingService.getDefaultInstanceId.mockResolvedValue(
        'instance1'
      );
      whatsappMessagingService.sendMessage.mockResolvedValue(
        'message successfully sent to number'
      );

      // Act
      await bulkMessageService.processBulkMessages();

      // Assert
      expect(waTrackingService.getAvailableNumbers).toHaveBeenCalled();
      expect(
        whatsappQueueService.getHighPriorityQueuedMessages
      ).toHaveBeenCalled();

      expect(
        whatsappQueueService.getPendingQueuedMessagesWithLimit
      ).toHaveBeenCalledWith(
        'normal',
        totalAvailableMessages - highPriorityMessages.length
      );

      expect(bulkMessageService.processMessageQueue).toHaveBeenCalledWith(
        highPriorityMessages.concat(normalPriorityMessages),
        availableNumbers
      );

      expect(whatsappMessagingService.sendMessage).toHaveBeenCalledTimes(1);
      expect(whatsappMessagingService.sendMessage).toHaveBeenCalledWith({
        number: '8089947074',
        type: 'text',
        message: messageSummary,
        instanceId: 'instance1',
      });
    });

    /**
     * Test Case: No available numbers
     * Ensures that an error is thrown when no numbers are available
     */
    it('should handle the case when no available numbers are found', async () => {
      // Arrange
      waTrackingService.getAvailableNumbers.mockResolvedValue([]);
      handleError.mockImplementation(() => {});

      // Act
      await bulkMessageService.processBulkMessages();

      // Assert
      expect(waTrackingService.getAvailableNumbers).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        'All WhatsApp numbers have reached their daily limit'
      );
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

      // Mock high-priority messages to return empty array
      whatsappQueueService.getHighPriorityQueuedMessages.mockResolvedValue([]);

      // Mock normal-priority messages to return empty array
      whatsappQueueService.getPendingQueuedMessagesWithLimit.mockResolvedValue(
        []
      );

      // Mock handleError
      handleError.mockImplementation(() => {});

      // Act
      await bulkMessageService.processBulkMessages();

      // Assert
      expect(
        whatsappQueueService.getHighPriorityQueuedMessages
      ).toHaveBeenCalled();
      expect(
        whatsappQueueService.getPendingQueuedMessagesWithLimit
      ).toHaveBeenCalled();

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
      handleError.mockImplementation(() => {});

      // Act
      await bulkMessageService.processBulkMessages();

      // Assert
      expect(handleError).toHaveBeenCalledWith(
        'Error in bulk message processing:',
        expect.any(Error)
      );
    });
  });
});
