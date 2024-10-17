// tests/integrations/googleDriveIntegration.test.js

// Mock the handleError function
jest.mock('../../../src/utils/responseHelpers', () => ({
  handleError: jest.fn(),
}));

// Mock the 'googleapis' module
jest.mock('googleapis', () => {
  const mockOAuth2Client = {
    generateAuthUrl: jest.fn(),
    getToken: jest.fn(),
    setCredentials: jest.fn(),
  };

  const OAuth2 = jest.fn(() => mockOAuth2Client);

  return {
    google: {
      auth: {
        OAuth2,
      },
      oauth2: jest.fn().mockReturnValue({
        userinfo: {
          get: jest.fn(),
        },
      }),
      drive: jest.fn().mockReturnValue({
        files: {
          list: jest.fn(),
          delete: jest.fn(),
        },
      }),
    },
    __mockOAuth2Client: mockOAuth2Client, // Expose the mock client for testing
  };
});

const { google, __mockOAuth2Client: mockOAuth2Client } = require('googleapis');
const googleDriveIntegration = require('../../../src/integrations/googleDriveIntegration');
const { handleError } = require('../../../src/utils/responseHelpers');

describe('Google Drive Integration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment variables
    originalEnv = { ...process.env };

    // Reset mocks before each test
    jest.clearAllMocks();

    // Reset the mockOAuth2Client methods
    mockOAuth2Client.generateAuthUrl.mockReset();
    mockOAuth2Client.getToken.mockReset();
    mockOAuth2Client.setCredentials.mockReset();
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  /**
   * Test Suite for createOAuth2Client function
   * This suite tests the initialization of the OAuth2 client,
   * ensuring that environment variables are handled correctly.
   */
  describe('createOAuth2Client', () => {
    /**
     * Test Case: Successful OAuth2 Client Creation
     * Ensures that the OAuth2 client is created with correct credentials.
     */
    it('should create an OAuth2 client with correct credentials', () => {
      // Arrange
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.GOOGLE_REDIRECT_URI = 'http://localhost/oauth2callback';

      // Act
      googleDriveIntegration.getAuthUrl();

      // Assert
      expect(google.auth.OAuth2).toHaveBeenCalledWith(
        'test-client-id',
        'test-client-secret',
        'http://localhost/oauth2callback'
      );
    });

    /**
     * Test Case: Missing Environment Variables
     * Ensures that missing environment variables are logged.
     */
    it('should log errors if environment variables are missing', () => {
      // Arrange
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.GOOGLE_REDIRECT_URI;

      // Act
      googleDriveIntegration.getAuthUrl();

      // Assert
      expect(handleError).toHaveBeenCalledWith(
        'GOOGLE_CLIENT_ID is missing in environment variables.'
      );
      expect(handleError).toHaveBeenCalledWith(
        'GOOGLE_CLIENT_SECRET is missing in environment variables.'
      );
      expect(handleError).toHaveBeenCalledWith(
        'GOOGLE_REDIRECT_URI is missing in environment variables.'
      );
    });
  });

  /**
   * Test Suite for getAuthUrl method
   * This suite tests the generation of the authentication URL.
   */
  describe('getAuthUrl', () => {
    beforeEach(() => {
      jest
        .spyOn(googleDriveIntegration, 'createOAuth2Client')
        .mockReturnValue(mockOAuth2Client);
    });
    /**
     * Test Case: Successful Auth URL Generation
     * Ensures that the authentication URL is generated correctly.
     */
    it('should generate the correct authentication URL', async () => {
      // Arrange
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.GOOGLE_REDIRECT_URI = 'http://localhost/oauth2callback';

      mockOAuth2Client.generateAuthUrl.mockReturnValue('http://auth.url');

      // Act
      const authUrl = await googleDriveIntegration.getAuthUrl();

      // Assert
      expect(authUrl).toBe('http://auth.url');
      expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/userinfo.profile',
        ],
      });
    });
  });

  /**
   * Test Suite for getUserInfo method
   * This suite tests fetching user information using the OAuth2 client.
   */
  describe('getUserInfo', () => {
    /**
     * Test Case: Successful User Info Retrieval
     * Ensures that user information is fetched correctly.
     */
    it('should fetch user info successfully', async () => {
      // Arrange
      const mockAuthClient = {};
      const mockUserInfo = { id: 'user123', name: 'Test User' };
      google.oauth2.mockReturnValue({
        userinfo: {
          get: jest.fn().mockResolvedValue({ data: mockUserInfo }),
        },
      });

      // Act
      const userInfo = await googleDriveIntegration.getUserInfo(mockAuthClient);

      // Assert
      expect(google.oauth2).toHaveBeenCalledWith({
        auth: mockAuthClient,
        version: 'v2',
      });
      expect(userInfo).toEqual(mockUserInfo);
    });

    /**
     * Test Case: Error During User Info Retrieval
     * Ensures that errors are properly thrown when fetching user info fails.
     */
    it('should throw an error if fetching user info fails', async () => {
      // Arrange
      const mockAuthClient = {};
      const error = new Error('Failed to fetch user info');
      google.oauth2.mockReturnValue({
        userinfo: {
          get: jest.fn().mockRejectedValue(error),
        },
      });

      // Act & Assert
      await expect(
        googleDriveIntegration.getUserInfo(mockAuthClient)
      ).rejects.toThrow('Failed to fetch user info');
    });
  });

  /**
   * Test Suite for getGoogleDriveClient method
   * This suite tests obtaining an authenticated OAuth2 client using an authorization code.
   */
  describe('getGoogleDriveClient', () => {
    beforeEach(() => {
      jest
        .spyOn(googleDriveIntegration, 'createOAuth2Client')
        .mockReturnValue(mockOAuth2Client);
    });

    /**
     * Test Case: Successful Client Creation with Tokens
     * Ensures that an OAuth2 client is returned with proper credentials.
     */
    it('should return an authenticated OAuth2 client with tokens', async () => {
      // Arrange
      const code = 'auth_code';
      const mockTokens = { access_token: 'access', refresh_token: 'refresh' };
      mockOAuth2Client.getToken.mockResolvedValue({ tokens: mockTokens });

      // Act
      const client = await googleDriveIntegration.getGoogleDriveClient(code);

      // Assert
      expect(mockOAuth2Client.getToken).toHaveBeenCalledWith(code);
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith(mockTokens);
      expect(client).toBe(mockOAuth2Client);
    });

    /**
     * Test Case: Error During Token Retrieval
     * Ensures that errors are properly thrown when token retrieval fails.
     */
    it('should throw an error if getting tokens fails', async () => {
      // Arrange
      const code = 'auth_code';
      const error = new Error('Failed to get tokens');
      mockOAuth2Client.getToken.mockRejectedValue(error);

      // Act & Assert
      await expect(
        googleDriveIntegration.getGoogleDriveClient(code)
      ).rejects.toThrow('Failed to get tokens');
    });
  });

  /**
   * Test Suite for getAuthenticatedClient method
   * This suite tests creating an authenticated OAuth2 client using a token.
   */
  describe('getAuthenticatedClient', () => {
    beforeEach(() => {
      jest
        .spyOn(googleDriveIntegration, 'createOAuth2Client')
        .mockReturnValue(mockOAuth2Client);
    });
    /**
     * Test Case: Successful Authenticated Client Creation
     * Ensures that an OAuth2 client is returned with the provided token.
     */
    it('should return an authenticated client with the provided token', async () => {
      // Arrange
      const token = { access_token: 'access', refresh_token: 'refresh' };

      // Act
      const client = await googleDriveIntegration.getAuthenticatedClient(token);

      // Assert
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith(token);
      expect(client).toBe(mockOAuth2Client);
    });
  });

  /**
   * Test Suite for fetchFilesFromFolder method
   * This suite tests fetching files from a specific Google Drive folder.
   */
  describe('fetchFilesFromFolder', () => {
    /**
     * Test Case: Successful Fetching of Files
     * Ensures that files are fetched correctly from the specified folder.
     */
    it('should fetch files from the specified folder', async () => {
      // Arrange
      const auth = {};
      const folderId = 'folder123';
      const mockFiles = [{ id: 'file1', name: 'File 1' }];
      google.drive.mockReturnValue({
        files: {
          list: jest.fn().mockResolvedValue({ data: { files: mockFiles } }),
        },
      });

      // Act
      const files = await googleDriveIntegration.fetchFilesFromFolder(
        auth,
        folderId
      );

      // Assert
      expect(google.drive).toHaveBeenCalledWith({ version: 'v3', auth });
      expect(files).toEqual(mockFiles);
    });

    /**
     * Test Case: No Files Found
     * Ensures that an empty array is returned when no files are found.
     */
    it('should return an empty array if no files are found', async () => {
      // Arrange
      const auth = {};
      const folderId = 'folder123';
      google.drive.mockReturnValue({
        files: {
          list: jest.fn().mockResolvedValue({ data: {} }),
        },
      });

      // Act
      const files = await googleDriveIntegration.fetchFilesFromFolder(
        auth,
        folderId
      );

      // Assert
      expect(files).toEqual([]);
    });

    /**
     * Test Case: Error During File Fetching
     * Ensures that errors are properly thrown when fetching files fails.
     */
    it('should throw an error if fetching files fails', async () => {
      // Arrange
      const auth = {};
      const folderId = 'folder123';
      const error = new Error('Failed to fetch files');
      google.drive.mockReturnValue({
        files: {
          list: jest.fn().mockRejectedValue(error),
        },
      });

      // Act & Assert
      await expect(
        googleDriveIntegration.fetchFilesFromFolder(auth, folderId)
      ).rejects.toThrow('Failed to fetch files');
    });
  });

  /**
   * Test Suite for deleteFileFromDrive method
   * This suite tests deleting a file from Google Drive.
   */
  describe('deleteFileFromDrive', () => {
    /**
     * Test Case: Successful File Deletion
     * Ensures that a file is deleted successfully.
     */
    it('should delete the file and return true on success', async () => {
      // Arrange
      const fileId = 'file123';
      const auth = {};
      google.drive.mockReturnValue({
        files: {
          delete: jest.fn().mockResolvedValue(),
        },
      });

      // Act
      const result = await googleDriveIntegration.deleteFileFromDrive(
        fileId,
        auth
      );

      // Assert
      expect(google.drive).toHaveBeenCalledWith({ version: 'v3', auth });
      expect(result).toBe(true);
    });

    /**
     * Test Case: File Not Found (404 Error)
     * Ensures that if the file is not found, the function handles it gracefully.
     */
    it('should handle 404 error when file is not found and return false', async () => {
      // Arrange
      const fileId = 'file123';
      const auth = {};
      const error = new Error('File not found');
      error.code = 404;
      google.drive.mockReturnValue({
        files: {
          delete: jest.fn().mockRejectedValue(error),
        },
      });

      // Act
      const result = await googleDriveIntegration.deleteFileFromDrive(
        fileId,
        auth
      );

      // Assert
      expect(handleError).toHaveBeenCalledWith(
        `File with ID ${fileId} not found. It may have already been deleted.`,
        error
      );
      expect(result).toBe(false);
    });

    /**
     * Test Case: Error During File Deletion
     * Ensures that if an error occurs during deletion, it is handled properly.
     */
    it('should handle errors during deletion and return false', async () => {
      // Arrange
      const fileId = 'file123';
      const auth = {};
      const error = new Error('Failed to delete file');
      error.code = 500;
      google.drive.mockReturnValue({
        files: {
          delete: jest.fn().mockRejectedValue(error),
        },
      });

      // Act
      const result = await googleDriveIntegration.deleteFileFromDrive(
        fileId,
        auth
      );

      // Assert
      expect(handleError).toHaveBeenCalledWith(
        `Error deleting file with ID ${fileId}:`,
        error
      );
      expect(result).toBe(false);
    });
  });
});
