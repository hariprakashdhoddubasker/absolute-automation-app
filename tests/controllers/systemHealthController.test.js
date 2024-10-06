// tests/controllers/systemHealthController.test.js

// Mock dependencies
jest.mock('../../src/utils/responseHelpers', () => ({
    successResponse: jest.fn((res, data, message, statusCode = 200) => {
      res.status(statusCode).json({
        success: true,
        data,
        message,
      });
    }),
    errorResponse: jest.fn((res, message, statusCode = 500, errors = null) => {
      res.status(statusCode).json({
        success: false,
        data: null,
        message,
        errors,
      });
    }),
  }));
  jest.mock('../../src/services/whatsappMessagingService', () => ({
    sendMessageToManagement: jest.fn(),
  }));
  
  const request = require('supertest');
  const express = require('express');
  const bodyParser = require('body-parser');
  const { successResponse, errorResponse } = require('../../src/utils/responseHelpers');
  const whatsappMessagingService = require('../../src/services/whatsappMessagingService');
  const systemHealthController = require('../../src/controllers/systemHealthController');
  
  describe('System Health Controller', () => {
    let app;
  
    beforeEach(() => {
      jest.clearAllMocks();
  
      // Set up an Express app instance for testing
      app = express();
      app.use(bodyParser.json());
  
      // Define a route for testing the controller
      app.get('/api/system-health/send-report', systemHealthController.sendSystemHealthReport);
    });
  
    it('should send a system health report successfully', async () => {
      // Mock sendMessageToManagement to resolve successfully
      whatsappMessagingService.sendMessageToManagement.mockResolvedValueOnce();
  
      const response = await request(app).get('/api/system-health/send-report');
  
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: null,
        message: 'System health report sent successfully!',
      });
  
      // Verify that sendMessageToManagement was called
      expect(whatsappMessagingService.sendMessageToManagement).toHaveBeenCalledTimes(1);
  
      // Verify that successResponse was called
      expect(successResponse).toHaveBeenCalledWith(
        expect.any(Object),
        null,
        'System health report sent successfully!',
        200
      );
  
      // Ensure errorResponse was not called
      expect(errorResponse).not.toHaveBeenCalled();
    });
  
    it('should handle errors when sending the system health report fails', async () => {
      // Mock sendMessageToManagement to reject with an error
      const errorMessage = 'WhatsApp service failed';
      const error = new Error(errorMessage);
      whatsappMessagingService.sendMessageToManagement.mockRejectedValueOnce(error);
  
      const response = await request(app).get('/api/system-health/send-report');
  
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        data: null,
        message: 'Failed to send system health report.',
        errors: expect.any(Object),
      });
  
      // Verify that sendMessageToManagement was called
      expect(whatsappMessagingService.sendMessageToManagement).toHaveBeenCalledTimes(1);
  
      // Verify that errorResponse was called
      expect(errorResponse).toHaveBeenCalledWith(
        expect.any(Object),
        'Failed to send system health report.',
        500,
        error
      );
  
      // Ensure successResponse was not called
      expect(successResponse).not.toHaveBeenCalled();
    });
  });
  