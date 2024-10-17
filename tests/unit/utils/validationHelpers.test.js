// tests/utils/validationHelpers.test.js

const { validateRequiredFields } = require('../../../src/utils/validationHelpers');

describe('Validation Helpers', () => {
  let res;

  beforeEach(() => {
    // Mock the Express response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  /**
   * Test Suite for validateRequiredFields function
   * This suite tests the validation of required fields in a request body.
   */
  describe('validateRequiredFields', () => {
    /**
     * Test Case: All required fields are present
     * Ensures that the function returns true when all fields are valid.
     */
    it('should return true when all required fields are present', () => {
      // Arrange
      const fields = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      // Act
      const result = validateRequiredFields(fields, res);

      // Assert
      expect(result).toBe(true);
      expect(res.status).not.toHaveBeenCalled();
    });

    /**
     * Test Case: Missing a required field
     * Ensures that the function sends a 400 response when a field is missing.
     */
    it('should send a 400 response when a required field is missing', () => {
      // Arrange
      const fields = {
        name: 'John Doe',
        email: '', // Missing value
      };

      // Act
      const result = validateRequiredFields(fields, res);

      // Assert
      expect(result).toBe(false);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required field: email.',
      });
    });

    /**
     * Test Case: Multiple missing fields
     * Ensures that the function stops at the first missing field and sends a response.
     */
    it('should send a 400 response when multiple fields are missing', () => {
      // Arrange
      const fields = {
        name: '',
        email: '',
      };

      // Act
      const result = validateRequiredFields(fields, res);

      // Assert
      expect(result).toBe(false);
      expect(res.status).toHaveBeenCalledWith(400);
      // Since the function stops at the first missing field, we check for 'name'
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required field: name.',
      });
    });
  });
});
