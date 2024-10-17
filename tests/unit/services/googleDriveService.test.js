// tests/services/googleDriveService.test.js

const googleDriveService = require('../../../src/services/googleDriveService');
const googleDriveIntegration = require('../../../src/integrations/googleDriveIntegration');
const moment = require('moment');
const tokenRepository = require('../../../src/repositories/tokenRepository');
const whatsappMessagingService = require('../../../src/services/whatsappMessagingService');
const { handleError } = require('../../../src/utils/responseHelpers');

// Mock the dependencies
jest.mock('../../../src/integrations/googleDriveIntegration');
jest.mock('../../../src/repositories/tokenRepository');
jest.mock('../../../src/services/whatsappMessagingService');
jest.mock('../../../src/utils/responseHelpers');

describe('Google Drive Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test to ensure test isolation
    jest.resetAllMocks();
  });

  /**
   * Test Suite for initiateAuthFlow function
   * This suite tests the initiation of the authentication flow,
   * ensuring that the correct authentication URL is returned.
   */
  describe('initiateAuthFlow', () => {
    /**
     * Test Case: Should return the authentication URL
     * Ensures that the function returns the URL obtained from the integration.
     */
    it('should return the authentication URL', async () => {
      // Arrange
      const authUrl = 'http://auth.url';
      googleDriveIntegration.getAuthUrl.mockReturnValue(authUrl);

      // Act
      const result = await googleDriveService.initiateAuthFlow();

      // Assert
      expect(result).toBe(authUrl);
      expect(googleDriveIntegration.getAuthUrl).toHaveBeenCalled();
    });

    /**
     * Test Case: Should return null and call handleError if initiating auth flow fails
     * Ensures that the function returns null and handleError is called appropriately.
     */
    it('should return null and call handleError if initiating auth flow fails', async () => {
      // Arrange
      const error = new Error('Auth flow initiation failed');
      googleDriveIntegration.getAuthUrl.mockImplementation(() => {
        throw error;
      });

      // Act
      const result = await googleDriveService.initiateAuthFlow();

      // Assert
      expect(result).toBeNull();
      expect(handleError).toHaveBeenCalledWith(
        '[initiateAuthFlow] Failed to initiate Google Drive Auth Flow',
        error
      );
    });
  });

  /**
   * Test Suite for authenticateAndStoreTokens function
   * This suite tests the authentication process and token storage.
   */
  describe('authenticateAndStoreTokens', () => {
    /**
     * Test Case: Successful authentication and token storage
     * Ensures that tokens are obtained and stored correctly.
     */
    it('should authenticate and store tokens successfully', async () => {
      // Arrange
      const code = 'auth_code';
      const authClient = {
        credentials: { access_token: 'access', refresh_token: 'refresh' },
      };
      const userInfo = { id: 'user123', name: 'Test User' };

      googleDriveIntegration.getGoogleDriveClient.mockResolvedValue(authClient);
      googleDriveIntegration.getUserInfo.mockResolvedValue(userInfo);
      tokenRepository.storeTokens.mockResolvedValue();

      // Act
      const result = await googleDriveService.authenticateAndStoreTokens(code);

      // Assert
      expect(googleDriveIntegration.getGoogleDriveClient).toHaveBeenCalledWith(
        code
      );
      expect(googleDriveIntegration.getUserInfo).toHaveBeenCalledWith(
        authClient
      );
      expect(tokenRepository.storeTokens).toHaveBeenCalledWith(
        'user123',
        'Test User',
        authClient.credentials,
        'Google Drive'
      );
      expect(result).toEqual({ userId: 'user123' });
    });

    /**
     * Test Case: Should return null and call handleError if authentication fails
     * Ensures that the function returns null and handleError is called appropriately.
     */
    it('should return null and call handleError if authentication fails', async () => {
      // Arrange
      const code = 'auth_code';
      const error = new Error('Authentication failed');
      googleDriveIntegration.getGoogleDriveClient.mockRejectedValue(error);

      // Act
      const result = await googleDriveService.authenticateAndStoreTokens(code);

      // Assert
      expect(result).toBeNull();
      expect(handleError).toHaveBeenCalledWith(
        '[authenticateAndStoreTokens] Failed to authenticate and store Google Drive tokens',
        error
      );
    });
  });

  /**
   * Test Suite for generateDailyReportService function
   * This suite tests the generation of the daily report,
   * including fetching tokens, files, and sending the report.
   */
  describe('generateDailyReportService', () => {
    /**
     * Test Case: Successful daily report generation and sending
     * Ensures that the report is generated and sent without errors.
     */
    it('should generate and send the daily report successfully', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const userId = 'user123';
      const folderId = 'folder123';
      const token = { access_token: 'access', refresh_token: 'refresh' };
      const authClient = {};

      const today = moment();
      const eightDaysAgo = today.clone().subtract(8, 'days').format('YYMMDD');
      const todayFormatted = today.format('YYMMDD');

      const files = [
        {
          id: 'file1',
          name: `Call recording +911234567890_${todayFormatted}_120000.m4a`,
        }, // Recent file
        {
          id: 'file2',
          name: `Call recording JohnDoe_${todayFormatted}_130000.m4a`,
        }, // Recent file
        {
          id: 'file3',
          name: `Call recording +911234567890_${eightDaysAgo}_120000.m4a`,
        }, // Older than one week
      ];

      tokenRepository.getTokens.mockResolvedValue(token);
      googleDriveIntegration.getAuthenticatedClient.mockResolvedValue(
        authClient
      );
      googleDriveIntegration.fetchFilesFromFolder.mockResolvedValue(files);
      googleDriveIntegration.deleteFileFromDrive.mockResolvedValue(true);
      whatsappMessagingService.sendMessageToManagement.mockResolvedValue();

      // Act
      const result = await googleDriveService.generateDailyReportService(
        userId,
        folderId
      );

      // Assert
      expect(result).toBe(true);
      expect(tokenRepository.getTokens).toHaveBeenCalledWith(
        userId,
        'Google Drive'
      );
      expect(
        googleDriveIntegration.getAuthenticatedClient
      ).toHaveBeenCalledWith(token);
      expect(googleDriveIntegration.fetchFilesFromFolder).toHaveBeenCalledWith(
        authClient,
        folderId
      );
      expect(googleDriveIntegration.deleteFileFromDrive).toHaveBeenCalledTimes(
        1
      ); // Only one file older than one week
      expect(
        whatsappMessagingService.sendMessageToManagement
      ).toHaveBeenCalledWith(
        expect.stringContaining('Daily Call Report'),
        true
      );
    });

    /**
     * Test Case: No tokens found for the user
     * Ensures that a message is sent if no tokens are found.
     */
    it('should handle case when no tokens are found', async () => {
      // Arrange
      const userId = 'user123';
      const folderId = 'folder123';

      tokenRepository.getTokens.mockResolvedValue(null);
      whatsappMessagingService.sendMessageToManagement.mockResolvedValue();

      // Act
      const result = await googleDriveService.generateDailyReportService(
        userId,
        folderId
      );

      // Assert
      expect(result).toContain('No tokens found for user ID user123');
      expect(
        whatsappMessagingService.sendMessageToManagement
      ).toHaveBeenCalledWith(
        expect.stringContaining('No Google tokens found for user ID user123')
      );
    });

    /**
     * Test Case: Should return null and call handleError if report generation fails
     * Ensures that the function returns null and handleError is called appropriately.
     */
    it('should return null and call handleError if report generation fails', async () => {
      // Arrange
      const userId = 'user123';
      const folderId = 'folder123';
      const error = new Error('Some error');
      tokenRepository.getTokens.mockRejectedValue(error);

      // Act
      const result = await googleDriveService.generateDailyReportService(
        userId,
        folderId
      );

      // Assert
      expect(result).toBeNull();
      expect(handleError).toHaveBeenCalledWith(
        '[generateDailyReportService] Failed to generate daily report',
        error
      );
    });
  });

  /**
   * Test Suite for extractDetailsFromFileName function
   * This suite tests the extraction of details from file names.
   */
  describe('extractDetailsFromFileName', () => {
    /**
     * Test Case: Valid file name with phone number
     * Ensures that details are extracted correctly when the file name contains a phone number.
     */
    it('should extract details from a valid file name with phone number', () => {
      // Arrange
      const fileName = 'Call recording +911234567890_230101_120000.m4a';

      // Act
      const result = googleDriveService.extractDetailsFromFileName(fileName);

      // Assert
      expect(result).toEqual({
        callerIdentifier: '1234567890',
        date: '2023-01-01',
        time: '12:00:00',
      });
    });

    /**
     * Test Case: Valid file name with caller name
     * Ensures that details are extracted correctly when the file name contains a caller name.
     */
    it('should extract details from a valid file name with caller name', () => {
      // Arrange
      const fileName = 'Call recording JohnDoe_230101_120000.m4a';

      // Act
      const result = googleDriveService.extractDetailsFromFileName(fileName);

      // Assert
      expect(result).toEqual({
        callerIdentifier: 'JohnDoe',
        date: '2023-01-01',
        time: '12:00:00',
      });
    });

    /**
     * Test Case: Invalid file name
     * Ensures that null is returned when the file name does not match the expected pattern.
     */
    it('should return null for invalid file name', () => {
      // Arrange
      const fileName = 'Invalid file name.m4a';

      // Act
      const result = googleDriveService.extractDetailsFromFileName(fileName);

      // Assert
      expect(result).toBeNull();
    });
  });
  /**
   * Test Suite for filterFilesByDate function
   * This suite tests filtering files based on a target date.
   */
  describe('filterFilesByDate', () => {
    /**
     * Test Case: Filter files by target date
     * Ensures that only files matching the target date are returned.
     */
    it('should filter files by the target date', () => {
      // Arrange
      const files = [
        { name: 'Call recording +911234567890_230101_120000.m4a' },
        { name: 'Call recording JohnDoe_230102_130000.m4a' },
        { name: 'Call recording +911234567890_230101_140000.m4a' },
      ];
      const targetDate = moment('2023-01-01', 'YYYY-MM-DD');

      // Act
      const result = googleDriveService.filterFilesByDate(files, targetDate);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { name: 'Call recording +911234567890_230101_120000.m4a' },
        { name: 'Call recording +911234567890_230101_140000.m4a' },
      ]);
    });
  });

  /**
   * Test Suite for filterFilesOlderThanOneWeek function
   * This suite tests filtering files older than one week.
   */
  describe('filterFilesOlderThanOneWeek', () => {
    /**
     * Test Case: Filter files older than one week
     * Ensures that files older than one week are returned.
     */
    it('should filter files older than one week', () => {
      // Arrange
      const today = moment();
      const files = [
        {
          name: `Call recording +911234567890_${today
            .clone()
            .subtract(8, 'days')
            .format('YYMMDD')}_120000.m4a`,
        },
        {
          name: `Call recording +911234567890_${today.format(
            'YYMMDD'
          )}_120000.m4a`,
        },
      ];

      // Act
      const result = googleDriveService.filterFilesOlderThanOneWeek(files);

      // Assert
      expect(result).toHaveLength(1);
    });
  });

  /**
   * Test Suite for deleteOldFiles function
   * This suite tests the deletion of old files and summarizing deletions.
   */
  describe('deleteOldFiles', () => {
    /**
     * Test Case: Delete old files and return summary
     * Ensures that old files are deleted and a summary is returned.
     */
    it('should delete old files and return deletion summary', async () => {
      // Arrange
      const today = moment();
      const eightDaysAgo = today.clone().subtract(8, 'days').format('YYMMDD');
      const eightDaysAgoDate = today
        .clone()
        .subtract(8, 'days')
        .format('YYYY-MM-DD');

      const files = [
        {
          id: 'file1',
          name: `Call recording +911234567890_${eightDaysAgo}_120000.m4a`,
        },
        {
          id: 'file2',
          name: `Call recording JohnDoe_${eightDaysAgo}_130000.m4a`,
        },
      ];
      const authClient = {};

      googleDriveIntegration.deleteFileFromDrive.mockResolvedValue(true);

      // Act
      const result = await googleDriveService.deleteOldFiles(files, authClient);

      // Assert
      expect(googleDriveIntegration.deleteFileFromDrive).toHaveBeenCalledTimes(
        2
      );
      expect(result).toEqual({
        [eightDaysAgoDate]: 2,
      });
    });
  });

  /**
   * Test Suite for generateDailyCallReport function
   * This suite tests the generation of the daily call report text.
   */
  describe('generateDailyCallReport', () => {
    /**
     * Test Case: Generate daily call report
     * Ensures that the report includes the correct information.
     */
    it('should generate the daily call report', () => {
      // Arrange
      const uniqueCallerCount = 5;
      const deletedFilesByDate = {
        '2023-01-01': 3,
        '2023-01-02': 2,
      };

      // Act
      const report = googleDriveService.generateDailyCallReport(
        uniqueCallerCount,
        deletedFilesByDate
      );

      // Assert
      expect(report).toContain('Daily Call Report:');
      expect(report).toContain('Called Numbers : 5');
      expect(report).toContain('File Deletion Report :');
      expect(report).toContain('2023-01-01 : 3');
      expect(report).toContain('2023-01-02 : 2');
    });
  });
});
