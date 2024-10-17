// tests/integrations/pingerApiClient.test.js

const axios = require('axios');
const pingerApiClient = require('../../../src/integrations/pingerApiClient');
const logger = require('../../../src/utils/logger');

// Mock axios and logger to prevent real HTTP requests and to spy on logging
jest.mock('axios');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('Pinger API Client', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Test Suite for sendMessage method
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
        type: 'text',
        message: 'Hello, World!',
        mediaUrl: null,
        instanceId: 'instance123',
        accessToken: 'access123',
      };

      const mockResponse = {
        data: {
          message: {
            key: {
              remoteJid: '1234567890@s.whatsapp.net',
            },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await pingerApiClient.sendMessage(params);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(
        'https://pingerbot.in/api/send',
        {
          number: '1234567890',
          type: 'text',
          message: 'Hello, World!',
          instance_id: 'instance123',
          access_token: 'access123',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toBe(
        'Text message successfully sent to number : 1234567890@s.whatsapp.net'
      );
    });

    /**
     * Test Case: Successful Media Message Sending
     * Ensures that a media message is sent successfully and the correct response is returned.
     */
    it('should send a media message successfully', async () => {
      // Arrange
      const params = {
        name: 'John Doe',
        number: '1234567890',
        type: 'media',
        message: 'Check out this image',
        mediaUrl: 'http://example.com/image.jpg',
        instanceId: 'instance123',
        accessToken: 'access123',
        filename: 'image.jpg',
      };

      const mockResponse = {
        data: {
          message: {
            key: {
              remoteJid: '1234567890@s.whatsapp.net',
            },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await pingerApiClient.sendMessage(params);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(
        'https://pingerbot.in/api/send',
        {
          number: '1234567890',
          type: 'media',
          message: 'Check out this image',
          instance_id: 'instance123',
          access_token: 'access123',
          media_url: 'http://example.com/image.jpg',
          filename: 'image.jpg',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toBe(
        'Media message successfully sent to number : 1234567890@s.whatsapp.net'
      );
    });

    /**
     * Test Case: Handle API Error Response
     * Ensures that the function handles API errors without throwing, and logs the error.
     */
    it('should handle error when API returns an error response', async () => {
      // Arrange
      const params = {
        name: 'John Doe',
        number: '1234567890',
        type: 'text',
        message: 'Hello, World!',
        mediaUrl: null,
        instanceId: 'instance123',
        accessToken: 'access123',
      };

      const apiError = {
        response: {
          data: {
            error: 'Invalid access token',
          },
        },
      };

      axios.post.mockRejectedValue(apiError);

      // Act
      const result = await pingerApiClient.sendMessage(params);

      // Assert
      expect(axios.post).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Error: Failed to send text message',
        expect.objectContaining({ error: apiError })
      );
      expect(result).toBeUndefined();
    });

    /**
     * Test Case: Handle Network Error
     * Ensures that the function handles network errors without throwing, and logs the error.
     */
    it('should handle error when a network error occurs', async () => {
      // Arrange
      const params = {
        name: 'John Doe',
        number: '1234567890',
        type: 'text',
        message: 'Hello, World!',
        mediaUrl: null,
        instanceId: 'instance123',
        accessToken: 'access123',
      };

      const networkError = new Error('Network Error');
      axios.post.mockRejectedValue(networkError);

      // Act
      const result = await pingerApiClient.sendMessage(params);

      // Assert
      expect(axios.post).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Error: Failed to send text message',
        expect.objectContaining({ error: networkError })
      );
      expect(result).toBeUndefined();
    });
  });

  /**
   * Test Suite for sendMessageToGroup method
   * This suite tests sending messages to groups,
   * ensuring that the payload is correctly constructed and errors are handled.
   */
  describe('sendMessageToGroup', () => {
    /**
     * Test Case: Successful Text Message Sending to Group
     * Ensures that a text message is sent successfully to a group and the correct response is returned.
     */
    it('should send a text message to group successfully', async () => {
      // Arrange
      const params = {
        groupId: 'group123',
        type: 'text',
        message: 'Hello, Group!',
        instanceId: 'instance123',
        accessToken: 'access123',
      };

      const mockResponse = {
        data: {
          message: {
            key: {
              remoteJid: 'group123@g.us',
            },
          },
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await pingerApiClient.sendMessageToGroup(params);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(
        'https://pingerbot.in/api/send_group',
        {
          group_id: 'group123',
          type: 'text',
          message: 'Hello, Group!',
          instance_id: 'instance123',
          access_token: 'access123',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toBe(
        'Text message successfully sent to group : group123@g.us'
      );
    });

    /**
     * Test Case: Handle API Error Response for Group Message
     * Ensures that the function handles API errors without throwing, and logs the error.
     */
    it('should handle error when API returns an error response for group message', async () => {
      // Arrange
      const params = {
        groupId: 'group123',
        type: 'text',
        message: 'Hello, Group!',
        instanceId: 'instance123',
        accessToken: 'access123',
      };

      const apiError = {
        response: {
          data: {
            error: 'Invalid group ID',
          },
        },
      };

      axios.post.mockRejectedValue(apiError);

      // Act
      const result = await pingerApiClient.sendMessageToGroup(params);

      // Assert
      expect(axios.post).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Error: Failed to send text message',
        expect.objectContaining({ error: apiError })
      );
      expect(result).toBeUndefined();
    });

    /**
     * Test Case: Handle Network Error During Group Message
     * Ensures that the function handles network errors without throwing, and logs the error.
     */
    it('should handle error when a network error occurs during group message', async () => {
      // Arrange
      const params = {
        groupId: 'group123',
        type: 'text',
        message: 'Hello, Group!',
        instanceId: 'instance123',
        accessToken: 'access123',
      };

      const networkError = new Error('Network Error');
      axios.post.mockRejectedValue(networkError);

      // Act
      const result = await pingerApiClient.sendMessageToGroup(params);

      // Assert
      expect(axios.post).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Error: Failed to send text message',
        expect.objectContaining({ error: networkError })
      );
      expect(result).toBeUndefined();
    });
  });
});
