// tests/controllers/googleDriveController.test.js

const googleDriveService = require('../../../src/services/googleDriveService');
const googleDriveController = require('../../../src/controllers/googleDriveController');

// Mock dependencies to isolate controller logic
jest.mock('../../../src/services/googleDriveService');
jest.mock('../../../src/utils/responseHelpers');
jest.mock('../../../src/utils/validationHelpers');

// Import the mocked responseHelpers module
const responseHelpers = require('../../../src/utils/responseHelpers');
const validationHelpers = require('../../../src/utils/validationHelpers');

describe('Google Drive Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks before each test to prevent test interference
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
   * Test Suite for the startAuthFlow method
   * This suite tests the initiation of the authentication flow,
   * ensuring that an authentication URL is generated and errors are handled.
   */
  describe('startAuthFlow', () => {
    /**
     * Test Case: Successful Auth URL Generation
     * Verifies that when the initiateAuthFlow method succeeds,
     * the controller responds with a success message and the auth URL.
     */
    it('should return auth URL when initiateAuthFlow succeeds', async () => {
      // Arrange
      const authUrl = 'https://example.com/auth';
      googleDriveService.initiateAuthFlow.mockResolvedValue(authUrl);

      // Act
      await googleDriveController.startAuthFlow(req, res);

      // Assert
      expect(googleDriveService.initiateAuthFlow).toHaveBeenCalled();
      expect(responseHelpers.successResponse).toHaveBeenCalledWith(
        res,
        { authUrl },
        'Authentication URL generated successfully.',
        200
      );
    });

    /**
     * Test Case: Error Handling During Auth Flow Initiation
     * Ensures that if initiateAuthFlow throws an error,
     * the controller handles it and responds with an error message.
     */
    it('should handle errors and return error response', async () => {
      // Arrange
      const error = new Error('Failed to initiate auth flow');
      googleDriveService.initiateAuthFlow.mockRejectedValue(error);

      // Act
      await googleDriveController.startAuthFlow(req, res);

      // Assert
      expect(googleDriveService.initiateAuthFlow).toHaveBeenCalled();
      expect(responseHelpers.errorResponse).toHaveBeenCalledWith(
        res,
        'Failed to initiate authentication flow.',
        500
      );
    });
  });


  /**
   * Test Suite for the handleOAuthCallback method
   * This suite tests the handling of the OAuth callback,
   * ensuring that authentication succeeds and errors are handled.
   */
  describe('handleOAuthCallback', () => {
    /**
     * Test Case: Missing Authorization Code
     * Validates that if the 'code' query parameter is missing,
     * the controller responds with an appropriate error message.
     */
    it('should return error if code is missing', async () => {
      // Arrange
      req.query = {}; // No code provided

      // Act
      await googleDriveController.handleOAuthCallback(req, res);

      // Assert
      expect(responseHelpers.errorResponse).toHaveBeenCalledWith(
        res,
        'Authorization code is missing.',
        400
      );
      expect(googleDriveService.authenticateAndStoreTokens).not.toHaveBeenCalled();
    });

    /**
     * Test Case: Successful Authentication and Token Storage
     * Ensures that when a valid 'code' is provided,
     * the controller authenticates and stores tokens successfully.
     */
    it('should authenticate and store tokens when code is present', async () => {
      // Arrange
      req.query = { code: 'auth_code' };
      googleDriveService.authenticateAndStoreTokens.mockResolvedValue();

      // Act
      await googleDriveController.handleOAuthCallback(req, res);

      // Assert
      expect(googleDriveService.authenticateAndStoreTokens).toHaveBeenCalledWith(
        'auth_code'
      );
      expect(responseHelpers.successResponse).toHaveBeenCalledWith(
        res,
        null,
        'Authentication successful. Tokens stored for future use.',
        200
      );
    });

    /**
     * Test Case: Error During Authentication
     * Tests that if authenticateAndStoreTokens throws an error,
     * the controller responds with an appropriate error message.
     */
    it('should handle errors during authentication', async () => {
      // Arrange
      req.query = { code: 'auth_code' };
      const error = new Error('Authentication failed');
      googleDriveService.authenticateAndStoreTokens.mockRejectedValue(error);

      // Act
      await googleDriveController.handleOAuthCallback(req, res);

      // Assert
      expect(googleDriveService.authenticateAndStoreTokens).toHaveBeenCalledWith(
        'auth_code'
      );
      expect(responseHelpers.errorResponse).toHaveBeenCalledWith(
        res,
        'Failed to authenticate and store tokens.',
        500
      );
    });
  });

  /**
   * Test Suite for the generateDailyCallReport method
   * This suite tests the daily call report generation,
   * ensuring that required fields are validated and errors are handled.
   */
  describe('generateDailyCallReport', () => {
    /**
     * Test Case: Missing Required Fields
     * Validates that if 'userId' is missing in the request body,
     * the controller does not proceed and responds with an error.
     */
    it('should return error if required fields are missing', async () => {
      // Arrange
      req.body = {}; // Missing userId
      validationHelpers.validateRequiredFields.mockReturnValue(false);

      // Act
      await googleDriveController.generateDailyCallReport(req, res);

      // Assert
      expect(validationHelpers.validateRequiredFields).toHaveBeenCalledWith(
        req.body.userId,
        res
      );
      expect(
        googleDriveService.generateDailyReportService
      ).not.toHaveBeenCalled();
    });


    /**
     * Test Case: Successful Report Generation
     * Ensures that when required fields are present,
     * the controller generates the report and responds with success.
     */
    it('should generate report and return success response', async () => {
      // Arrange
      req.body = { userId: 'user123', folderId: 'folder456' };
      validationHelpers.validateRequiredFields.mockReturnValue(true);
      googleDriveService.generateDailyReportService.mockResolvedValue(true);

      // Act
      await googleDriveController.generateDailyCallReport(req, res);

      // Assert
      expect(validationHelpers.validateRequiredFields).toHaveBeenCalledWith(
        req.body.userId,
        res
      );
      expect(googleDriveService.generateDailyReportService).toHaveBeenCalledWith(
        'user123',
        'folder456'
      );
      expect(responseHelpers.successResponse).toHaveBeenCalledWith(
        res,
        null,
        'Daily report generated and sent to WhatsApp successfully.',
        200
      );
    });

    /**
     * Test Case: Error During Report Generation
     * Tests that if generateDailyReportService throws an error,
     * the controller handles it and responds with an error message.
     */
    it('should handle errors during report generation', async () => {
      // Arrange
      req.body = { userId: 'user123', folderId: 'folder456' };
      validationHelpers.validateRequiredFields.mockReturnValue(true);
      const error = new Error('Report generation failed');
      googleDriveService.generateDailyReportService.mockRejectedValue(error);

      // Act
      await googleDriveController.generateDailyCallReport(req, res);

      // Assert
      expect(validationHelpers.validateRequiredFields).toHaveBeenCalledWith(
        req.body.userId,
        res
      );
      expect(googleDriveService.generateDailyReportService).toHaveBeenCalledWith(
        'user123',
        'folder456'
      );
      expect(responseHelpers.errorResponse).toHaveBeenCalledWith(
        res,
        'Failed to generate daily call report.',
        500
      );
    });
  });
});
