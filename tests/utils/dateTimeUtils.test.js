// tests/utils/dateTimeUtils.test.js

const { convertUnixToMySQLDateTime } = require('../../src/utils/dateTimeUtils');

describe('DateTime Utils', () => {
  /**
   * Test Suite for convertUnixToMySQLDateTime function
   * This suite tests the conversion of Unix timestamps to MySQL DATETIME format.
   */
  describe('convertUnixToMySQLDateTime', () => {
    /**
     * Test Case: Convert valid Unix timestamp
     * Ensures that a valid Unix timestamp is correctly converted to MySQL DATETIME format.
     */
    it('should convert a valid Unix timestamp to MySQL DATETIME format', () => {
      // Arrange
      const unixTimestamp = 1633072800000; // Corresponds to 2021-10-01 00:00:00
      const expectedDateTime = '2021-10-01 07:20:00';

      // Act
      const result = convertUnixToMySQLDateTime(unixTimestamp);

      // Assert
      expect(result).toBe(expectedDateTime);
    });

    /**
     * Test Case: Handle invalid Unix timestamp
     * Ensures that an invalid Unix timestamp returns 'Invalid Date' or throws an error.
     */
    it('should handle an invalid Unix timestamp', () => {
      // Arrange
      const invalidUnixTimestamp = 'invalid';

      // Act and Assert
      expect(() => convertUnixToMySQLDateTime(invalidUnixTimestamp)).toThrow(
        RangeError
      );
    });
  });
});
