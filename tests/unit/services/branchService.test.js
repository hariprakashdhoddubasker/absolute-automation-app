
// tests/unit/services/branchService.test.js

jest.mock('../../../src/repositories/branchRepository');
jest.mock('../../../src/utils/responseHelpers');

const branchService = require('../../../src/services/branchService');
const branchRepository = require('../../../src/repositories/branchRepository');
const { handleError } = require('../../../src/utils/responseHelpers');

describe('branchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBranchIdByName', () => {
    it('should return branch_id when branch name exists', async () => {
      // Arrange
      const branchName = 'Main Branch';
      const branchId = 1;
      branchRepository.getBranchIdByName.mockResolvedValue(branchId);

      // Act
      const result = await branchService.getBranchIdByName(branchName);

      // Assert
      expect(branchRepository.getBranchIdByName).toHaveBeenCalledWith(branchName);
      expect(result).toBe(branchId);
    });

    it('should return null when branch name does not exist', async () => {
      // Arrange
      const branchName = 'Nonexistent Branch';
      branchRepository.getBranchIdByName.mockResolvedValue(null);

      // Act
      const result = await branchService.getBranchIdByName(branchName);

      // Assert
      expect(branchRepository.getBranchIdByName).toHaveBeenCalledWith(branchName);
      expect(result).toBeNull();
    });

    it('should handle errors and rethrow when an error occurs', async () => {
      // Arrange
      const branchName = 'Main Branch';
      const mockError = new Error('Database error');
      branchRepository.getBranchIdByName.mockRejectedValue(mockError);

      // Act & Assert
      await expect(branchService.getBranchIdByName(branchName)).rejects.toThrow(mockError);
      expect(branchRepository.getBranchIdByName).toHaveBeenCalledWith(branchName);
      expect(handleError).toHaveBeenCalledWith('[branchService] Error fetching branch ID:', mockError);
    });
  });
});
