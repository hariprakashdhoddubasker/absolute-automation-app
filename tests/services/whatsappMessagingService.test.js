// tests/services/whatsappMessagingService.test.js

const whatsappMessagingService = require('../../src/services/whatsappMessagingService');
const pingerApiClient = require('../../src/integrations/pingerApiClient');
const waTrackingService = require('../../src/services/waTrackingService');

// Mock the dependencies
jest.mock('../../src/integrations/pingerApiClient');
jest.mock('../../src/services/waTrackingService');

// Start test block
describe('WhatsApp Messaging Service', () => {
  let handleErrorSpy;
  beforeEach(() => {
    jest.clearAllMocks(); // Ensure all mocks are reset before each test

    handleErrorSpy = jest
      .spyOn(whatsappMessagingService, 'handleError')
      .mockResolvedValue(); // Mock handleError

    whatsappMessagingService.resetDefaultInstanceId();
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

  // Test Suite for sendGroupMessage
  describe('sendGroupMessage', () => {
    it('should send a group message successfully', async () => {
      const params = {
        groupId: 'group123',
        message: 'Hello, Group!',
        instanceId: 'instance123',
      };

      process.env.PINGER_ACCESS_TOKEN = 'access123';

      pingerApiClient.sendMessageToGroup.mockResolvedValue(
        'Group message sent successfully'
      );

      const result = await whatsappMessagingService.sendGroupMessage(params);

      expect(pingerApiClient.sendMessageToGroup).toHaveBeenCalledWith({
        groupId: 'group123',
        type: 'text',
        message: 'Hello, Group!',
        instanceId: 'instance123',
        accessToken: 'access123',
      });
      expect(result).toBe('Group message sent successfully');
    });

    it('should not proceed if groupId is null or empty', async () => {
      const params = {
        groupId: '',
        message: 'Hello, Group!',
        instanceId: 'instance123',
      };

      const result = await whatsappMessagingService.sendGroupMessage(params);

      await expect(handleErrorSpy).toHaveBeenCalledWith(
        'Group ID is null or empty'
      );
      expect(pingerApiClient.sendMessageToGroup).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null and log error if required fields are missing', async () => {
      const params = {
        message: 'Hello, Group!',
        instanceId: 'instance123',
      };

      const result = await whatsappMessagingService.sendGroupMessage(params);

      expect(handleErrorSpy).toHaveBeenCalledWith('Group ID is null or empty');
      expect(result).toBeNull();
    });

    it('should return null and log error if pingerApiClient fails', async () => {
      const params = {
        groupId: 'group123',
        message: 'Hello, Group!',
        instanceId: 'instance123',
      };

      process.env.PINGER_ACCESS_TOKEN = 'access123';
      pingerApiClient.sendMessageToGroup.mockRejectedValue(
        new Error('API Error')
      );

      const result = await whatsappMessagingService.sendGroupMessage(params);

      expect(handleErrorSpy).toHaveBeenCalledWith(
        'Failed to send text message',
        expect.any(Error)
      );
      expect(result).toBeNull();
    });
  });

  // Test Suite for getDefaultInstanceId
  describe('getDefaultInstanceId', () => {
    it('should return the default instance ID', async () => {
      process.env.DEFAULT_WHATSAPP_NUMBER = '1234567890';

      const instanceDetails = { instance_id: 'instance123' };

      waTrackingService.getInstanceDetailsByPhoneNumber.mockResolvedValue(
        instanceDetails
      );

      const result = await whatsappMessagingService.getDefaultInstanceId();

      expect(
        waTrackingService.getInstanceDetailsByPhoneNumber
      ).toHaveBeenCalledWith('1234567890');
      expect(result).toBe('instance123');
    });

    it('should return null and log error if instanceDetails is missing', async () => {
      process.env.DEFAULT_WHATSAPP_NUMBER = '1234567890';

      waTrackingService.getInstanceDetailsByPhoneNumber.mockResolvedValue(null);
      const handleErrorSpy = jest
        .spyOn(whatsappMessagingService, 'handleError')
        .mockResolvedValue();

      const result = await whatsappMessagingService.getDefaultInstanceId();

      expect(handleErrorSpy).toHaveBeenCalledWith(
        'Failed to retrieve WhatsApp instance ID from the database.'
      );
      expect(result).toBeNull();
    });

    it('should return null and log error if an exception occurs', async () => {
      process.env.DEFAULT_WHATSAPP_NUMBER = '1234567890';
      const testError = new Error('Database Error');

      waTrackingService.getInstanceDetailsByPhoneNumber.mockRejectedValue(
        testError
      );
      const handleErrorSpy = jest
        .spyOn(whatsappMessagingService, 'handleError')
        .mockResolvedValue();

      const result = await whatsappMessagingService.getDefaultInstanceId();

      expect(handleErrorSpy).toHaveBeenCalledWith(
        'Error retrieving instance ID:',
        testError
      );
      expect(result).toBeNull();
    });
  });

  // Test Suite for sendMessageToManagement
  describe('sendMessageToManagement', () => {
    it('should send a message to management number', async () => {
      const message = 'Important message';
      process.env.MANAGEMENT_WHATSAPP_NUMBER = '0987654321';

      jest
        .spyOn(whatsappMessagingService, 'getDefaultInstanceId')
        .mockResolvedValue('instance123');
      jest
        .spyOn(whatsappMessagingService, 'sendMessage')
        .mockResolvedValue('Message sent');

      await whatsappMessagingService.sendMessageToManagement(message);

      expect(whatsappMessagingService.getDefaultInstanceId).toHaveBeenCalled();
      expect(whatsappMessagingService.sendMessage).toHaveBeenCalledWith({
        number: '0987654321',
        message: 'Important message',
        instanceId: 'instance123',
      });
    });

    it('should send a message to management group when sendToGroup is true', async () => {
      const message = 'Important group message';
      process.env.MANAGEMENT_WHATSAPP_GROUP = 'group123';

      jest
        .spyOn(whatsappMessagingService, 'getDefaultInstanceId')
        .mockResolvedValue('instance123');
      jest
        .spyOn(whatsappMessagingService, 'sendGroupMessage')
        .mockResolvedValue('Group message sent');

      await whatsappMessagingService.sendMessageToManagement(message, true);

      expect(whatsappMessagingService.getDefaultInstanceId).toHaveBeenCalled();
      expect(whatsappMessagingService.sendGroupMessage).toHaveBeenCalledWith({
        groupId: 'group123',
        message: 'Important group message',
        instanceId: 'instance123',
      });
    });

    it('should return early if instanceId is not available', async () => {
      const message = 'Important message';

      jest
        .spyOn(whatsappMessagingService, 'getDefaultInstanceId')
        .mockResolvedValue(null);

      await whatsappMessagingService.sendMessageToManagement(message);

      expect(whatsappMessagingService.getDefaultInstanceId).toHaveBeenCalled();
      expect(whatsappMessagingService.sendMessage).not.toHaveBeenCalled();
    });
  });
});
