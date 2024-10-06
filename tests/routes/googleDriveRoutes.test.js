// tests/routes/googleDriveRoutes.test.js

const request = require('supertest');
const express = require('express');
const googleDriveRoutes = require('../../src/routes/googleDriveRoutes');
const googleDriveController = require('../../src/controllers/googleDriveController');

// Mock the controller methods
jest.mock('../../src/controllers/googleDriveController');

describe('Google Drive Routes', () => {
  let app;

  beforeAll(() => {
    // Create an Express app and use the Google Drive routes
    app = express();
    app.use(express.json());
    app.use('/google-drive', googleDriveRoutes);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  /**
   * Test Suite for GET /google-drive/auth
   * This suite tests initiating the Google Drive authentication flow.
   */
  describe('GET /google-drive/auth', () => {
    /**
     * Test Case: Successful initiation of auth flow
     * Ensures that the controller's startAuthFlow method is called and redirects to the auth URL.
     */
    it('should initiate the auth flow and redirect to the auth URL', async () => {
      // Arrange
      const authUrl = 'http://accounts.google.com/auth';

      // Mock the controller method to redirect to the auth URL
      googleDriveController.startAuthFlow.mockImplementation((req, res) => {
        res.redirect(authUrl);
      });

      // Act
      const response = await request(app).get('/google-drive/auth');

      // Assert
      expect(googleDriveController.startAuthFlow).toHaveBeenCalled();
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(authUrl);
    });
  });

  /**
   * Test Suite for GET /google-drive/oauth2callback
   * This suite tests handling the OAuth2 callback.
   */
  describe('GET /google-drive/oauth2callback', () => {
    /**
     * Test Case: Successful handling of OAuth2 callback
     * Ensures that the controller's handleOAuthCallback method is called and a success message is returned.
     */
    it('should handle OAuth2 callback and return a success response', async () => {
      // Arrange
      const query = {
        code: 'auth_code',
      };

      // Mock the controller method to send a success response
      googleDriveController.handleOAuthCallback.mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'Authentication successful' });
      });

      // Act
      const response = await request(app)
        .get('/google-drive/oauth2callback')
        .query(query);

      // Assert
      expect(googleDriveController.handleOAuthCallback).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, message: 'Authentication successful' });
    });
  });

  /**
   * Test Suite for POST /google-drive/daily-call-report
   * This suite tests generating the daily call report.
   */
  describe('POST /google-drive/daily-call-report', () => {
    /**
     * Test Case: Successful generation of daily call report
     * Ensures that the controller's generateDailyCallReport method is called and a success message is returned.
     */
    it('should generate the daily call report and return a success response', async () => {
      // Arrange
      const requestBody = {
        userId: 'user123',
        folderId: 'folder123',
      };

      // Mock the controller method to send a success response
      googleDriveController.generateDailyCallReport.mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'Daily call report generated' });
      });

      // Act
      const response = await request(app)
        .post('/google-drive/daily-call-report')
        .send(requestBody);

      // Assert
      expect(googleDriveController.generateDailyCallReport).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, message: 'Daily call report generated' });
    });

    /**
     * Test Case: Missing required parameters
     * Ensures that a 400 status is returned when required parameters are missing.
     */
    it('should return status 400 when required parameters are missing', async () => {
      // Arrange
      const requestBody = {
        // Missing userId and folderId
      };

      // Mock the controller method to send an error response
      googleDriveController.generateDailyCallReport.mockImplementation((req, res) => {
        res.status(400).json({ success: false, message: 'userId and folderId are required' });
      });

      // Act
      const response = await request(app)
        .post('/google-drive/daily-call-report')
        .send(requestBody);

      // Assert
      expect(googleDriveController.generateDailyCallReport).toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ success: false, message: 'userId and folderId are required' });
    });
  });
});
