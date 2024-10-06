// tests/config/db.test.js

// Mock dependencies before importing the module under test
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(),
}));

jest.mock('../../src/utils/responseHelpers', () => ({
  handleError: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('Database Configuration', () => {
  let mysql;
  let getConnection, closePool, createPool;
  let mockPool;
  let mockConnection;
  let handleError;
  let logger;

  beforeEach(() => {
    // Reset modules before each test
    jest.resetModules();

    // Re-import mocked modules
    mysql = require('mysql2/promise');
    handleError = require('../../src/utils/responseHelpers').handleError;
    logger = require('../../src/utils/logger');

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a mock connection object
    mockConnection = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Create a mock pool with getConnection and end methods
    mockPool = {
      getConnection: jest.fn(),
      end: jest.fn(),
    };

    // Mock createPool to return mockPool
    mysql.createPool.mockReturnValue(mockPool);

    // Now import the module under test
    const db = require('../../src/config/db');
    getConnection = db.getConnection;
    closePool = db.closePool;
    createPool = db.createPool;

    // Initialize pool with mockPool
    createPool();
  });

  /**
   * Test Suite for the getConnection function
   * This suite tests acquiring a database connection,
   * ensuring that connections are returned and errors are handled.
   */
  describe('getConnection', () => {
    /**
     * Test Case: Successful Connection Acquisition
     * Ensures that when getConnection succeeds,
     * a connection object is returned.
     */
    it('should return a connection when pool.getConnection succeeds', async () => {
      // Arrange: Mock successful getConnection
      mockPool.getConnection.mockResolvedValue(mockConnection);

      // Act: Call getConnection
      const connection = await getConnection();

      // Assert
      expect(mysql.createPool).toHaveBeenCalledTimes(1);
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(connection).toBe(mockConnection);
      expect(typeof connection.query).toBe('function');
    });

    it('should handle error and return undefined when pool.getConnection fails', async () => {
      // Arrange: Mock getConnection to reject with an error
      const error = new Error('Connection error');
      mockPool.getConnection.mockRejectedValue(error);

      // Act: Call getConnection
      const connection = await getConnection();

      // Assert
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith('Error getting connection from pool', error);
      expect(connection).toBeUndefined();
    });
  });

  /**
   * Test Suite for the closePool function
   * This suite tests closing the database connection pool,
   * ensuring that the pool is closed and errors are handled.
   */
  describe('closePool', () => {
    /**
     * Test Case: Successful Pool Closure
     * Ensures that when pool.end succeeds,
     * the pool is closed and reset.
     */
    it('should close the pool successfully', async () => {
      // Arrange: Mock successful pool.end
      mockPool.end.mockResolvedValue();

      // Act: Call closePool
      await closePool();

      // Assert
      expect(mockPool.end).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('MySQL pool closed.');
    });

    it('should handle error when pool.end fails', async () => {
      // Arrange: Mock pool.end to reject with an error
      const error = new Error('End pool error');
      mockPool.end.mockRejectedValue(error);

      // Act: Call closePool
      await closePool();

      // Assert
      expect(mockPool.end).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith('Error closing the MySQL pool', error);
    });
  });
});
