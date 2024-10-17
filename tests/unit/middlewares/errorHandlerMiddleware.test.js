// tests/middlewares/errorHandlerMiddleware.test.js

const express = require('express');
const request = require('supertest');
const errorHandlerMiddleware = require('../../../src/middlewares/errorHandlerMiddleware');

// Mock the WhatsApp service and handleError function
jest.mock('../../../src/services/whatsappMessagingService', () => ({
  sendMessageToManagement: jest.fn(),
}));

jest.mock('../../../src/utils/responseHelpers', () => ({
  handleError: jest.fn(),
}));

const whatsappMessagingService = require('../../../src/services/whatsappMessagingService');
const { handleError } = require('../../../src/utils/responseHelpers');

describe('Error Handling Middleware', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a new express app instance for each test
    app = express();
    app.use(express.json()); // For parsing application/json

    // Add routes that will trigger errors

    // Route that will cause a SyntaxError (bad JSON)
    app.post('/bad-json', (req, res) => {
      // This route will not be reached if JSON is invalid
      res.send('This will not be called');
    });

    // Route that will throw a general error (e.g., 400 Bad Request)
    app.get('/general-error', (req, res, next) => {
      const error = new Error('General error');
      error.status = 400;
      next(error);
    });

    // Route that will throw an internal server error (500)
    app.get('/internal-error', (req, res, next) => {
      const error = new Error('Internal server error');
      error.status = 500;
      next(error);
    });

    // Use the error handler middleware
    app.use(errorHandlerMiddleware);
  });

  /**
   * Test Case: SyntaxError (Bad JSON)
   * Ensures that the middleware handles invalid JSON input correctly.
   */
  it('should send a WhatsApp message for a SyntaxError (Bad JSON)', async () => {
    const response = await request(app)
      .post('/bad-json')
      .set('Content-Type', 'application/json')
      .send('{"invalidJson":'); // Malformed JSON to trigger SyntaxError

    expect(response.status).toBe(400);
    expect(response.text).toBe('Invalid JSON format.');

    expect(handleError).toHaveBeenCalledWith(
      expect.stringContaining('Bad JSON Error')
    );

    expect(whatsappMessagingService.sendMessageToManagement).toHaveBeenCalledWith(
      expect.stringContaining('Bad JSON Error')
    );
  });

  /**
   * Test Case: General Error (e.g., 400 Bad Request)
   * Ensures that the middleware handles general errors correctly.
   */
  it('should send a WhatsApp message for a general error', async () => {
    const response = await request(app).get('/general-error');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Internal Server Error');

    expect(handleError).toHaveBeenCalledWith(
      expect.stringContaining('Error in Node.js App')
    );

    expect(whatsappMessagingService.sendMessageToManagement).toHaveBeenCalledWith(
      expect.stringContaining('Error in Node.js App')
    );
  });

  /**
   * Test Case: Internal Server Error (500)
   * Ensures that the middleware handles internal server errors correctly.
   */
  it('should send a WhatsApp message for an internal server error', async () => {
    const response = await request(app).get('/internal-error');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal Server Error');

    expect(handleError).toHaveBeenCalledWith(
      expect.stringContaining('Error in Node.js App')
    );

    expect(whatsappMessagingService.sendMessageToManagement).toHaveBeenCalledWith(
      expect.stringContaining('Error in Node.js App')
    );
  });
});
