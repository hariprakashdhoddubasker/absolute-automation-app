// src/controllers/googleDriveController.js

const { successResponse, errorResponse } = require('../utils/responseHelpers');
const { validateRequiredFields } = require('../utils/validationHelpers');
const googleDriveService = require('../services/googleDriveService');

const googleDriveController = {
  /**
   * Starts the authentication flow for Google Drive.
   *
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>} - Returns a promise that resolves to a response.
   */
  startAuthFlow: async (req, res) => {
    try {
      const authUrl = await googleDriveService.initiateAuthFlow();
      return successResponse(
        res,
        { authUrl },
        'Authentication URL generated successfully.',
        200
      );
    } catch (error) {
      return errorResponse(res, 'Failed to initiate authentication flow.', 500);
    }
  },

  /**
   * Handles the OAuth2 callback and fetches files from Google Drive.
   *
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>} - Returns a promise that resolves to a response.
   */
  handleOAuthCallback: async (req, res) => {
    try {
      const { code } = req.query; // Get the authorization code from the query parameters

      // Ensure the code is present
      if (!code) {
        return errorResponse(res, 'Authorization code is missing.', 400);
      }

      // Authenticate and obtain tokens
      await googleDriveService.authenticateAndStoreTokens(code);

      // Respond with a success message
      return successResponse(
        res,
        null,
        'Authentication successful. Tokens stored for future use.',
        200
      );
    } catch (error) {
      return errorResponse(
        res,
        'Failed to authenticate and store tokens.',
        500
      );
    }
  },

  generateDailyCallReport: async (req, res) => {
    try {
      const { userId, folderId } = req.body;
      if (!validateRequiredFields(userId, res)) return;

      // Call the service layer to generate the report
      const result = await googleDriveService.generateDailyReportService(
        userId,
        folderId
      );

      result
        ? successResponse(
            res,
            null,
            'Daily report generated and sent to WhatsApp successfully.',
            200
          )
        : errorResponse(res, 'Failed to generate daily call report.', 500);
    } catch (error) {
      return errorResponse(res, 'Failed to generate daily call report.', 500);
    }
  },
};

module.exports = googleDriveController;
