// tests/unit/repositories/branchRepository.test.js

jest.mock('../../../src/config/db');
jest.mock('../../../src/utils/responseHelpers');

const BranchRepository = require('../../../src/repositories/branchRepository');
const db = require('../../../src/config/db');
const { handleError } = require('../../../src/utils/responseHelpers');

describe('BranchRepository', () => {
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

  describe('getBranchIdByName', () => {
    it('should return branch_id when branch name exists', async () => {
      // Arrange
      const branchName = 'Main Branch';
      const mockResults = [{ branch_id: 1 }];
      mockConnection.query.mockResolvedValue([mockResults]);

      // Act
      const result = await BranchRepository.getBranchIdByName(branchName);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [branchName]);
      expect(result).toBe(1);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should return null when branch name does not exist', async () => {
      // Arrange
      const branchName = 'Nonexistent Branch';
      const mockResults = [];
      mockConnection.query.mockResolvedValue([mockResults]);

      // Act
      const result = await BranchRepository.getBranchIdByName(branchName);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [branchName]);
      expect(result).toBeNull();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors and rethrow when an error occurs', async () => {
      // Arrange
      const branchName = 'Main Branch';
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(BranchRepository.getBranchIdByName(branchName)).rejects.toThrow(mockError);
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [branchName]);
      expect(handleError).toHaveBeenCalledWith('[getBranchIdByName] Error fetching branch ID:', mockError);
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
