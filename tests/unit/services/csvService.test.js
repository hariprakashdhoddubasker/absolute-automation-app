// tests/services/csvService.test.js

const csvService = require('../../../src/services/csvService');
const fs = require('fs');
const csv = require('csv-parser');

// Mock the dependencies

jest.mock('csv-parser');

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createReadStream: jest.fn(),
}));

describe('CSV Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test Suite for readCSV function
   * This suite tests reading and parsing CSV files from different inputs.
   */
  describe('readCSV', () => {
    /**
     * Test Case: Read and parse CSV from a file path
     * Ensures that the CSV is read and parsed correctly when a file path is provided.
     */
    it('should read and parse CSV from a file path', async () => {
      // Arrange
      const filePath = 'path/to/file.csv';
      const mockStream = {
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn(),
      };
      const mockData = [{ name: 'John Doe', phone: '1234567890' }];

      fs.createReadStream.mockReturnValue(mockStream);
      csv.mockReturnValue(mockStream);

      // Simulate 'data' and 'end' events
      mockStream.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(mockData[0]);
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      });

      // Act
      const result = await csvService.readCSV(filePath);

      // Assert
      expect(fs.createReadStream).toHaveBeenCalledWith(filePath);
      expect(csv).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    /**
     * Test Case: Read and parse CSV from a stream
     * Ensures that the CSV is read and parsed correctly when a stream is provided.
     */
    it('should read and parse CSV from a stream', async () => {
      // Arrange
      const inputStream = {
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn(),
      };
      const mockData = [{ name: 'Jane Doe', phone: '0987654321' }];

      csv.mockReturnValue(inputStream);

      // Simulate 'data' and 'end' events
      inputStream.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(mockData[0]);
        } else if (event === 'end') {
          callback();
        }
        return inputStream;
      });

      // Act
      const result = await csvService.readCSV(inputStream);

      // Assert
      expect(csv).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    /**
     * Test Case: Handle errors during CSV parsing
     * Ensures that errors during parsing are caught and thrown.
     */
    it('should handle errors during CSV parsing', async () => {
      // Arrange
      const filePath = 'path/to/file.csv';
      const mockStream = {
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn(),
      };
      const error = new Error('Parsing error');

      fs.createReadStream.mockReturnValue(mockStream);
      csv.mockReturnValue(mockStream);

      // Simulate 'error' event
      mockStream.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          callback(error);
        }
        return mockStream;
      });

      // Act & Assert
      await expect(csvService.readCSV(filePath)).rejects.toThrow('Parsing error');
    });
  });
});
