// src/integrations/googleDriveIntegration.js
const { google } = require('googleapis');
const logger = require('../utils/logger');
const { handleError } = require('../utils/responseHelpers');

// Initialize OAuth2 Client
const createOAuth2Client = () => {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

  // Log missing environment variables
  if (!CLIENT_ID) {
    handleError('GOOGLE_CLIENT_ID is missing in environment variables.');
  }
  if (!CLIENT_SECRET) {
    handleError(
      'GOOGLE_CLIENT_SECRET is missing in environment variables.'
    );
  }
  if (!REDIRECT_URI) {
    handleError(
      'GOOGLE_REDIRECT_URI is missing in environment variables.'
    );
  }

  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
};

const googleDriveIntegration = {
  getAuthUrl: async () => {
    const oAuth2Client = createOAuth2Client();
    return oAuth2Client.generateAuthUrl({
      access_type: 'offline', // Important to get refresh token
      prompt: 'consent', // Force consent to get a refresh token every time
      scope: [
        'https://www.googleapis.com/auth/drive', // Full access to Google Drive
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    });
  },

  getUserInfo: async (authClient) => {
    const oauth2 = google.oauth2({ auth: authClient, version: 'v2' });
    const userInfoResponse = await oauth2.userinfo.get();
    return userInfoResponse.data; // This will include the user's Google ID and profile information
  },

  getGoogleDriveClient: async (code) => {
    const oAuth2Client = createOAuth2Client();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    return oAuth2Client;
  },

  getAuthenticatedClient: async (token) => {
    const authClient = createOAuth2Client();
    authClient.setCredentials(token); // Set the credentials using the token
    return authClient;
  },

  // Fetch files from a specific folder in Google Drive
  fetchFilesFromFolder: async (auth, folderId) => {
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`, // Exclude trashed files
      pageSize: 500,
      fields: 'files(id, name)',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    if (!res.data.files || res.data.files.length === 0) {
      logger.info(`No files found in folder with ID: ${folderId}`);
    } else {
      logger.info(`Files found: [${JSON.stringify(res.data.files.length)}]`);
    }
    
    return res.data.files || [];
  },

  deleteFileFromDrive: async (fileId, auth) => {
    const drive = google.drive({ version: 'v3', auth });
    try {
      // Attempt to delete the file
      await drive.files.delete({ fileId });
      return true; // Return true if deletion is successful
    } catch (error) {
      if (error.code === 404) {
        await handleError(
          `File with ID ${fileId} not found. It may have already been deleted.`,
          error
        );
      } else {
        await handleError(`Error deleting file with ID ${fileId}:`, error);
      }
      return false; // Return false if deletion fails
    }
  },
};
module.exports = {
  ...googleDriveIntegration,
  createOAuth2Client, // Exporting for testing
};
