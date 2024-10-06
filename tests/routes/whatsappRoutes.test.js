// tests/routes/whatsappRoutes.test.js

const request = require('supertest');
const express = require('express');
const whatsappRoutes = require('../../src/routes/whatsappRoutes');
const whatsappController = require('../../src/controllers/whatsappController');
const validateAccessToken = require('../../src/middlewares/validateAccessToken');

// Mock the controller methods and middleware
jest.mock('../../src/controllers/whatsappController');
jest.mock('../../src/middlewares/validateAccessToken', () =>
  jest.fn((req, res, next) => next())
);

describe('WhatsApp Routes', () => {
  let app;

  beforeAll(() => {
    // Create an Express app and use the WhatsApp routes
    app = express();
    app.use(express.json());
    app.use('/whatsapp', whatsappRoutes);
  });

  beforeEach(() => {
    // Clear call history before each test
    jest.clearAllMocks();
  });

  /**
   * Test Suite for POST /whatsapp/send-message
   * This suite tests sending a WhatsApp message (text or media).
   */
  describe('POST /whatsapp/send-message', () => {
    /**
     * Test Case: Successful message sending
     * Ensures that the controller's sendWhatsappMessage method is called and a success response is returned.
     */
    it('should send a WhatsApp message and return a success response', async () => {
      // Arrange
      const messageData = {
        number: '1234567890',
        message: 'Hello, World!',
      };

      // Mock the controller method to send a success response
      whatsappController.sendWhatsappMessage.mockImplementation((req, res) => {
        res
          .status(200)
          .json({ success: true, message: 'Message sent successfully' });
      });

      // Act
      const response = await request(app)
        .post('/whatsapp/send-message')
        .send(messageData);

      // Assert
      expect(validateAccessToken).toHaveBeenCalled();
      expect(whatsappController.sendWhatsappMessage).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Message sent successfully',
      });
    });

    /**
     * Test Case: Missing access token
     * Ensures that the middleware handles missing access tokens.
     */
    it('should return status 401 when access token is missing', async () => {
      // Arrange
      const messageData = {
        number: '1234567890',
        message: 'Hello, World!',
      };

      // Mock the middleware to send a 401 response
      validateAccessToken.mockImplementationOnce((req, res) => {
        res
          .status(401)
          .json({ success: false, message: 'Access token missing or invalid' });
      });

      // Act
      const response = await request(app)
        .post('/whatsapp/send-message')
        .send(messageData);

      // Assert
      expect(validateAccessToken).toHaveBeenCalled();
      expect(whatsappController.sendWhatsappMessage).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Access token missing or invalid',
      });
    });
  });

  /**
   * Test Suite for POST /whatsapp/send-queued-messages
   * This suite tests sending queued WhatsApp messages.
   */
  describe('POST /whatsapp/send-queued-messages', () => {
    /**
     * Test Case: Successful sending of queued messages
     * Ensures that the controller's sendQueuedWhatsAppMessages method is called and a success response is returned.
     */
    it('should send queued WhatsApp messages and return a success response', async () => {
      // Arrange

      // Mock the controller method to send a success response
      whatsappController.sendQueuedWhatsAppMessages.mockImplementation(
        (req, res) => {
          res
            .status(200)
            .json({
              success: true,
              message: 'Queued messages sent successfully',
            });
        }
      );

      // Act
      const response = await request(app)
        .post('/whatsapp/send-queued-messages')
        .send();

      // Assert
      expect(validateAccessToken).toHaveBeenCalled();
      expect(whatsappController.sendQueuedWhatsAppMessages).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Queued messages sent successfully',
      });
    });
  });

  /**
   * Test Suite for POST /whatsapp/create-message-queue
   * This suite tests creating message queue entries.
   */
  describe('POST /whatsapp/create-message-queue', () => {
    /**
     * Test Case: Successful creation of message queue entries
     * Ensures that the controller's createMessageQueueEntries method is called and a success response is returned.
     */
    it('should create message queue entries and return a success response', async () => {
      // Arrange
      const requestData = {
        message: 'Hello, this is a bulk message',
        audienceType: 'Both',
      };

      // Mock the controller method to send a success response
      whatsappController.createMessageQueueEntries.mockImplementation(
        (req, res) => {
          res
            .status(200)
            .json({
              success: true,
              message: 'Message queue created successfully',
            });
        }
      );

      // Act
      const response = await request(app)
        .post('/whatsapp/create-message-queue')
        .send(requestData);

      // Assert
      expect(whatsappController.createMessageQueueEntries).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Message queue created successfully',
      });
    });
  });
});
