// tests/repositories/tokenRepository.test.js

const tokenRepository = require('../../src/repositories/tokenRepository');
const db = require('../../src/config/db');
const { convertUnixToMySQLDateTime } = require('../../src/utils/dateTimeUtils');

// Mock the getConnection method from the db module
jest.mock('../../src/config/db');
jest.mock('../../src/utils/dateTimeUtils');

// Mock the handleError function from responseHelpers
jest.mock('../../src/utils/responseHelpers', () => ({
  handleError: jest.fn(),
}));

const { handleError } = require('../../src/utils/responseHelpers');

describe('tokenRepository', () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock connection object
    mockConnection = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Mock getConnection to return the mock connection
    db.getConnection.mockResolvedValue(mockConnection);
  });

  describe('storeTokens', () => {
    it('should store tokens successfully', async () => {
      // Arrange
      const userId = 'user123';
      const userName = 'John Doe';
      const tokens = {
        access_token: 'access_token_value',
        refresh_token: 'refresh_token_value',
        expiry_date: 1633024800000, // Unix timestamp in milliseconds
      };
      const tokenType = 'google';

      // Mock the date conversion utility
      const expiryDateTime = '2021-09-30 12:00:00';
      convertUnixToMySQLDateTime.mockReturnValue(expiryDateTime);

      mockConnection.query.mockResolvedValue();

      // Act
      await tokenRepository.storeTokens(userId, userName, tokens, tokenType);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(convertUnixToMySQLDateTime).toHaveBeenCalledWith(tokens.expiry_date);
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [
        userId,
        userName,
        tokens.access_token,
        tokens.refresh_token,
        expiryDateTime,
        tokenType,
      ]);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when storing tokens', async () => {
      // Arrange
      const userId = 'user123';
      const userName = 'John Doe';
      const tokens = {
        access_token: 'access_token_value',
        refresh_token: 'refresh_token_value',
        expiry_date: 1633024800000,
      };
      const tokenType = 'google';

      const expiryDateTime = '2021-09-30 12:00:00';
      convertUnixToMySQLDateTime.mockReturnValue(expiryDateTime);

      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        tokenRepository.storeTokens(userId, userName, tokens, tokenType)
      ).rejects.toThrow(mockError);

      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getTokens', () => {
    it('should retrieve tokens successfully', async () => {
      // Arrange
      const userId = 'user123';
      const tokenType = 'google';

      const mockRows = [
        {
          access_token: 'access_token_value',
          refresh_token: 'refresh_token_value',
          expiry_date: '2021-09-30 12:00:00',
        },
      ];
      mockConnection.query.mockResolvedValue([mockRows]);

      // Act
      const result = await tokenRepository.getTokens(userId, tokenType);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [
        userId,
        tokenType,
      ]);
      expect(result).toEqual(mockRows[0]);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should return undefined and log error if no tokens are found', async () => {
      // Arrange
      const userId = 'user123';
      const tokenType = 'google';

      mockConnection.query.mockResolvedValue([[]]);

      // Act
      const result = await tokenRepository.getTokens(userId, tokenType);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        `[getTokens] No tokens found for user ID ${userId} and token type ${tokenType}.`
      );
      expect(result).toBeUndefined();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when retrieving tokens', async () => {
      // Arrange
      const userId = 'user123';
      const tokenType = 'google';

      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(tokenRepository.getTokens(userId, tokenType)).rejects.toThrow(
        mockError
      );

      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('deleteTokens', () => {
    it('should delete tokens successfully', async () => {
      // Arrange
      const userId = 'user123';
      const tokenType = 'google';

      mockConnection.query.mockResolvedValue();

      // Act
      await tokenRepository.deleteTokens(userId, tokenType);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [
        userId,
        tokenType,
      ]);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when deleting tokens', async () => {
      // Arrange
      const userId = 'user123';
      const tokenType = 'google';

      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(tokenRepository.deleteTokens(userId, tokenType)).rejects.toThrow(
        mockError
      );

      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
