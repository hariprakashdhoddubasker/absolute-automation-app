// tests/repositories/nurtureScheduleRepository.test.js

const nurtureScheduleRepository = require('../../../src/repositories/nurtureScheduleRepository');
const { getConnection } = require('../../../src/config/db');
const { handleError } = require('../../../src/utils/responseHelpers');
const logger = require('../../../src/utils/logger');

// Mock dependencies
jest.mock('../../../src/config/db');
jest.mock('../../../src/utils/responseHelpers');
jest.mock('../../../src/utils/logger');

describe('nurtureScheduleRepository', () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the database connection and its methods
    mockConnection = {
      execute: jest.fn(),
      release: jest.fn(),
    };

    getConnection.mockResolvedValue(mockConnection);
  });

  // ... other tests ...

  describe('markMessageAsSent', () => {
    it('should update message status to sent', async () => {
      // Arrange
      const scheduleId = 1;
      mockConnection.execute.mockResolvedValue();

      // Act
      await nurtureScheduleRepository.markMessageAsSent(scheduleId);

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        "UPDATE nurture_schedule SET status = 'sent' WHERE id = ?",
        [scheduleId]
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors during execution and call handleError', async () => {
      // Arrange
      const scheduleId = 1;
      const error = new Error('Database error');
      mockConnection.execute.mockRejectedValue(error);

      // Act
      await nurtureScheduleRepository.markMessageAsSent(scheduleId);

      // Assert
      expect(handleError).toHaveBeenCalledWith(
        'Error marking message as sent',
        error
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
