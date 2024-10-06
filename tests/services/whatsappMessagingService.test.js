// tests/services/whatsappMessagingService.test.js

const whatsappMessagingService = require('../../src/services/whatsappMessagingService');
const pingerApiClient = require('../../src/integrations/pingerApiClient');
const waTrackingService = require('../../src/services/waTrackingService');
const { handleError } = require('../../src/utils/responseHelpers');

// Mock the dependencies
jest.mock('../../src/integrations/pingerApiClient');
jest.mock('../../src/services/waTrackingService');
jest.mock('../../src/utils/responseHelpers');

describe('WhatsApp Messaging Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test to ensure test isolation
    jest.resetAllMocks();
  });

  /**
   * Test Suite for sendMessage function
   * This suite tests sending messages to individual numbers,
   * ensuring that the payload is correctly constructed and errors are handled.
   */
  describe('sendMessage', () => {
    /**
     * Test Case: Successful Text Message Sending
     * Ensures that a text message is sent successfully and the correct response is returned.
     */
    it('should send a text message successfully', async () => {
      // Arrange
      const params = {
        name: 'John Doe',
        number: '1234567890',
        message: 'Hello, {Name}!',
        instanceId: 'instance123',
      };

      const expectedNumber = '911234567890'; // Number prefixed with '91'
      const expectedMessage = 'Hello, John Doe!'; // {Name} replaced

      process.env.PINGER_ACCESS_TOKEN = 'access123';

      pingerApiClient.sendMessage.mockResolvedValue(
        'Message sent successfully'
      );

      // Act
      const result = await whatsappMessagingService.sendMessage(params);

      // Assert
      expect(pingerApiClient.sendMessage).toHaveBeenCalledWith({
        name: 'John Doe',
        number: expectedNumber,
        type: 'text',
        message: expectedMessage,
        mediaUrl: undefined,
        instanceId: 'instance123',
        accessToken: 'access123',
        filename: undefined,
      });
      expect(result).toBe('Message sent successfully');
    });

    /**
     * Test Case: Missing Required Fields
     * Ensures that an error is thrown when required fields are missing.
     */
    it('should throw an error if required fields are missing', async () => {
      // Arrange
      const params = {
        name: 'John Doe',
        message: 'Hello, {Name}!',
        instanceId: 'instance123',
      };

      // Act & Assert
      await expect(
        whatsappMessagingService.sendMessage(params)
      ).rejects.toThrow('Missing required fields');
    });

    /**
     * Test Case: API Client Failure
     * Ensures that an error is thrown when the API client fails.
     */
    it('should throw an error if pingerApiClient fails', async () => {
      // Arrange
      const params = {
        name: 'John Doe',
        number: '1234567890',
        message: 'Hello, {Name}!',
        instanceId: 'instance123',
      };

      process.env.PINGER_ACCESS_TOKEN = 'access123';

      pingerApiClient.sendMessage.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(
        whatsappMessagingService.sendMessage(params)
      ).rejects.toThrow('Failed to send text message: API Error');
    });
  });

  /**
   * Test Suite for sendGroupMessage function
   * This suite tests sending messages to groups,
   * ensuring that the payload is correctly constructed and errors are handled.
   */
  describe('sendGroupMessage', () => {
    /**
     * Test Case: Successful Group Message Sending
     * Ensures that a group message is sent successfully and the correct response is returned.
     */
    it('should send a group message successfully', async () => {
      // Arrange
      const params = {
        groupId: 'group123',
        message: 'Hello, Group!',
        instanceId: 'instance123',
      };

      process.env.PINGER_ACCESS_TOKEN = 'access123';

      pingerApiClient.sendMessageToGroup.mockResolvedValue(
        'Group message sent successfully'
      );

      // Act
      const result = await whatsappMessagingService.sendGroupMessage(params);

      // Assert
      expect(pingerApiClient.sendMessageToGroup).toHaveBeenCalledWith({
        groupId: 'group123',
        type: 'text',
        message: 'Hello, Group!',
        instanceId: 'instance123',
        accessToken: 'access123',
      });
      expect(result).toBe('Group message sent successfully');
    });

    /**
     * Test Case: Missing Group ID
     * Ensures that the function logs an error and does not proceed when the group ID is missing or empty.
     */
    it('should not proceed if groupId is null or empty', async () => {
      // Arrange
      const params = {
        groupId: '',
        message: 'Hello, Group!',
        instanceId: 'instance123',
      };

      // Mock handleError
      handleError.mockResolvedValue();

      // Act
      const result = await whatsappMessagingService.sendGroupMessage(params);

      // Assert
      expect(handleError).toHaveBeenCalledWith('Group ID is null or empty');
      expect(pingerApiClient.sendMessageToGroup).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    /**
     * Test Case: Missing Required Fields
     * Ensures that an error is thrown when required fields are missing.
     */
    it('should throw an error if required fields are missing', async () => {
      // Arrange
      const params = {
        message: 'Hello, Group!',
        instanceId: 'instance123',
      };

      // Act & Assert
      await expect(
        whatsappMessagingService.sendGroupMessage(params)
      ).rejects.toThrow('Missing required fields');
    });

    /**
     * Test Case: API Client Failure
     * Ensures that an error is thrown when the API client fails.
     */
    it('should throw an error if pingerApiClient fails', async () => {
      // Arrange
      const params = {
        groupId: 'group123',
        message: 'Hello, Group!',
        instanceId: 'instance123',
      };

      process.env.PINGER_ACCESS_TOKEN = 'access123';

      pingerApiClient.sendMessageToGroup.mockRejectedValue(
        new Error('API Error')
      );

      // Act & Assert
      await expect(
        whatsappMessagingService.sendGroupMessage(params)
      ).rejects.toThrow('Failed to send text message: API Error');
    });
  });

  /**
   * Test Suite for getDefaultInstanceId function
   * This suite tests the retrieval of the default WhatsApp instance ID.
   */
  describe('getDefaultInstanceId', () => {
    /**
     * Test Case: Successful Retrieval of Instance ID
     * Ensures that the instance ID is returned when available.
     */
    it('should return the default instance ID', async () => {
      // Arrange
      process.env.DEFAULT_WHATSAPP_NUMBER = '1234567890';

      const instanceDetails = {
        instance_id: 'instance123',
      };

      waTrackingService.getInstanceDetailsByPhoneNumber.mockResolvedValue(
        instanceDetails
      );

      // Act
      const result = await whatsappMessagingService.getDefaultInstanceId();

      // Assert
      expect(
        waTrackingService.getInstanceDetailsByPhoneNumber
      ).toHaveBeenCalledWith('1234567890');
      expect(result).toBe('instance123');
    });

    /**
     * Test Case: Instance Details Missing
     * Ensures that null is returned and an error is logged when instance details are missing.
     */
    it('should return null and log error if instanceDetails is missing', async () => {
      // Arrange
      process.env.DEFAULT_WHATSAPP_NUMBER = '1234567890';

      waTrackingService.getInstanceDetailsByPhoneNumber.mockResolvedValue(null);

      // Mock handleError
      handleError.mockResolvedValue();

      // Act
      const result = await whatsappMessagingService.getDefaultInstanceId();

      // Assert
      expect(handleError).toHaveBeenCalledWith(
        'Failed to retrieve WhatsApp instance ID from the database.'
      );
      expect(result).toBeNull();
    });

    /**
     * Test Case: Error During Retrieval
     * Ensures that null is returned and an error is logged when an exception occurs.
     */
    it('should return null and log error if an exception occurs', async () => {
      // Arrange
      process.env.DEFAULT_WHATSAPP_NUMBER = '1234567890';

      const testError = new Error('Database Error');
      waTrackingService.getInstanceDetailsByPhoneNumber.mockRejectedValue(
        testError
      );

      // Mock handleError
      handleError.mockResolvedValue();

      // Act
      const result = await whatsappMessagingService.getDefaultInstanceId();

      // Assert
      expect(handleError).toHaveBeenCalledWith(
        'Error retrieving instance ID:',
        testError
      );
      expect(result).toBeNull();
    });
  });

  /**
   * Test Suite for sendMessageToManagement function
   * This suite tests sending messages to the management number or group.
   */
  describe('sendMessageToManagement', () => {
    /**
     * Test Case: Send Message to Management Number
     * Ensures that a message is sent to the management number when sendToGroup is false.
     */
    it('should send a message to management number', async () => {
      // Arrange
      const message = 'Important message';
      process.env.MANAGEMENT_WHATSAPP_NUMBER = '0987654321';

      jest
        .spyOn(whatsappMessagingService, 'getDefaultInstanceId')
        .mockResolvedValue('instance123');
      jest
        .spyOn(whatsappMessagingService, 'sendMessage')
        .mockResolvedValue('Message sent');

      // Act
      await whatsappMessagingService.sendMessageToManagement(message);

      // Assert
      expect(whatsappMessagingService.getDefaultInstanceId).toHaveBeenCalled();
      expect(whatsappMessagingService.sendMessage).toHaveBeenCalledWith({
        number: '0987654321',
        message: 'Important message',
        instanceId: 'instance123',
      });
    });

    /**
     * Test Case: Send Message to Management Group
     * Ensures that a message is sent to the management group when sendToGroup is true.
     */
    it('should send a message to management group when sendToGroup is true', async () => {
      // Arrange
      const message = 'Important group message';
      process.env.MANAGEMENT_WHATSAPP_GROUP = 'group123';

      jest
        .spyOn(whatsappMessagingService, 'getDefaultInstanceId')
        .mockResolvedValue('instance123');
      jest
        .spyOn(whatsappMessagingService, 'sendGroupMessage')
        .mockResolvedValue('Group message sent');

      // Act
      await whatsappMessagingService.sendMessageToManagement(message, true);

      // Assert
      expect(whatsappMessagingService.getDefaultInstanceId).toHaveBeenCalled();
      expect(whatsappMessagingService.sendGroupMessage).toHaveBeenCalledWith({
        groupId: 'group123',
        message: 'Important group message',
        instanceId: 'instance123',
      });
    });

    /**
     * Test Case: Instance ID Not Available
     * Ensures that the function returns early if the instance ID is not available.
     */
    it('should return early if instanceId is not available', async () => {
      // Arrange
      const message = 'Important message';

      jest
        .spyOn(whatsappMessagingService, 'getDefaultInstanceId')
        .mockResolvedValue(null);

      // Act
      await whatsappMessagingService.sendMessageToManagement(message);

      // Assert
      expect(whatsappMessagingService.getDefaultInstanceId).toHaveBeenCalled();
      expect(whatsappMessagingService.sendMessage).not.toHaveBeenCalled();
    });
  });
});
