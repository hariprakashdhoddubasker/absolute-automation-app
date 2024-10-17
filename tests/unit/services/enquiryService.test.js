// tests/services/enquiryService.test.js

const enquiryService = require('../../../src/services/enquiryService');

// Mock dependencies
const axios = require('axios');
const csvService = require('../../../src/services/csvService');
const enquiryRepository = require('../../../src/repositories/enquiryRepository');
const enquiryNurtureService = require('../../../src/services/nurtureScheduleService');
const moment = require('moment');
const logger = require('../../../src/utils/logger');

jest.mock('axios');
jest.mock('../../../src/services/csvService');
jest.mock('../../../src/repositories/enquiryRepository');
jest.mock('../../../src/services/nurtureScheduleService');
jest.mock('../../../src/utils/logger');
jest.mock('moment', () => {
  const originalMoment = jest.requireActual('moment'); // Use jest.requireActual to get the actual moment implementation
  return jest.fn((...args) => originalMoment(...args));
});

describe('Enquiry Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
  });

  /**
   * Test Suite for createEnquiry function
   */
  describe('createEnquiry', () => {
    it('should create an enquiry with formatted date and schedule nurture messages', () => {
      // Arrange
      const enquiryData = {
        name: 'John Doe',
        phone: '1234567890',
        lead_generated_date: '10-10-2023',
        branch: 'Main Branch',
      };

      const formattedDate = '2023-10-10';
      const insertId = 1;
      const callback = jest.fn();

      // Mock moment to format date correctly
      const mockMoment = {
        format: jest.fn().mockReturnValue(formattedDate),
      };
      moment.mockReturnValue(mockMoment);

      // Mock the repository create method
      enquiryRepository.create.mockImplementation((enquiry, cb) => {
        cb(null, { insertId });
      });

      // Act
      enquiryService.createEnquiry(enquiryData, callback);

      // Assert
      expect(moment).toHaveBeenCalledWith('10-10-2023', 'DD-MM-YYYY');
      expect(mockMoment.format).toHaveBeenCalledWith('YYYY-MM-DD');

      const expectedEnquiry = {
        ...enquiryData,
        lead_generated_date: formattedDate,
      };

      expect(enquiryRepository.create).toHaveBeenCalledWith(
        expectedEnquiry,
        expect.any(Function)
      );

      const expectedNewEnquiry = {
        ...expectedEnquiry,
        id: insertId,
      };

      expect(enquiryNurtureService.scheduleNurtureMessages).toHaveBeenCalledWith(
        expectedNewEnquiry
      );

      expect(callback).toHaveBeenCalledWith(null, expectedNewEnquiry);
    });

    it('should handle errors when repository create fails', () => {
      // Arrange
      const enquiryData = {
        name: 'John Doe',
        phone: '1234567890',
        lead_generated_date: '10-10-2023',
        branch: 'Main Branch',
      };

      const formattedDate = '2023-10-10';
      const callback = jest.fn();
      const mockError = new Error('Database error');

      // Mock moment to format date correctly
      const mockMoment = {
        format: jest.fn().mockReturnValue(formattedDate),
      };
      moment.mockReturnValue(mockMoment);

      // Mock the repository create method to return an error
      enquiryRepository.create.mockImplementation((enquiry, cb) => {
        cb(mockError);
      });

      // Act
      enquiryService.createEnquiry(enquiryData, callback);

      // Assert
      expect(moment).toHaveBeenCalledWith('10-10-2023', 'DD-MM-YYYY');
      expect(mockMoment.format).toHaveBeenCalledWith('YYYY-MM-DD');

      const expectedEnquiry = {
        ...enquiryData,
        lead_generated_date: formattedDate,
      };

      expect(enquiryRepository.create).toHaveBeenCalledWith(
        expectedEnquiry,
        expect.any(Function)
      );

      expect(enquiryNurtureService.scheduleNurtureMessages).not.toHaveBeenCalled();

      expect(callback).toHaveBeenCalledWith(mockError);
    });
  });
  /**
   * Test Suite for processCSVAndInsertEnquiries function
   */
  describe('processCSVAndInsertEnquiries', () => {
    /**
     * Test Case: Successful processing and insertion of enquiries from CSV
     * Ensures that the CSV is downloaded, parsed, processed, and data is inserted
     */
    it('should process CSV and insert enquiries successfully', async () => {
      // Arrange
      const csvFilePath = 'http://example.com/enquiries.csv';

      // Mock axios to return a stream (simplified as an object here)
      const csvStream = {};
      axios.get.mockResolvedValue({ status: 200, data: csvStream });

      // Mock csvService to return parsed data
      const rawData = [
        {
          name: 'John Doe',
          phone: '1234567890',
          lead_generated_date: '10-10-2023',
          branch: 'Main Branch',
        },
        {
          name: 'Jane Smith',
          phone: '0987654321',
          lead_generated_date: '11-10-2023',
          branch: 'Second Branch',
        },
      ];
      csvService.readCSV.mockResolvedValue(rawData);

      // Mock enquiryRepository to return existing phone numbers
      enquiryRepository.getAllEnquiryPhoneNumbers.mockResolvedValue([
        '1234567890',
      ]);

      // Mock moment for date validation and formatting
      moment.mockImplementation((dateStr, format, strict) => {
        return {
          isValid: () => true,
          format: () => '2023-10-10',
        };
      });

      // Mock enquiryRepository.bulkCreate
      enquiryRepository.bulkCreate.mockImplementation((data, callback) => {
        callback(null, { affectedRows: data.length });
      });

      // Act
      await enquiryService.processCSVAndInsertEnquiries(csvFilePath);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(csvFilePath, {
        responseType: 'stream',
      });
      expect(csvService.readCSV).toHaveBeenCalledWith(csvStream);
      expect(enquiryRepository.getAllEnquiryPhoneNumbers).toHaveBeenCalled();
      expect(enquiryRepository.bulkCreate).toHaveBeenCalledWith(
        [
          {
            name: 'Jane Smith',
            phone: '0987654321',
            lead_generated_date: '2023-10-10',
            email: null,
            dob: null,
            gender: null,
            address: null,
            enquiry_for: null,
            followup_date: null,
            type: null,
            status: null,
            source: null,
            remarks: null,
            branch: 'Second Branch',
          },
        ],
        expect.any(Function)
      );
    });

    /**
     * Test Case: Handles errors during CSV download
     * Ensures that errors during CSV download are caught and thrown
     */
    it('should handle errors during CSV download', async () => {
      // Arrange
      const csvFilePath = 'http://example.com/enquiries.csv';

      const error = new Error('Failed to fetch the CSV file.');
      axios.get.mockRejectedValue(error);

      // Act & Assert
      await expect(
        enquiryService.processCSVAndInsertEnquiries(csvFilePath)
      ).rejects.toThrow('Failed to fetch the CSV file.');

      expect(axios.get).toHaveBeenCalledWith(csvFilePath, {
        responseType: 'stream',
      });
    });

    /**
     * Test Case: Handles errors during CSV parsing
     * Ensures that errors during CSV parsing are caught and thrown
     */
    it('should handle errors during CSV parsing', async () => {
      // Arrange
      const csvFilePath = 'http://example.com/enquiries.csv';

      // Mock axios to return a stream
      const csvStream = {};
      axios.get.mockResolvedValue({ status: 200, data: csvStream });

      const error = new Error('CSV parsing error');
      csvService.readCSV.mockRejectedValue(error);

      // Act & Assert
      await expect(
        enquiryService.processCSVAndInsertEnquiries(csvFilePath)
      ).rejects.toThrow('CSV parsing error');

      expect(csvService.readCSV).toHaveBeenCalledWith(csvStream);
    });

    /**
     * Test Case: Handles errors during data processing
     * Ensures that errors during data processing are caught and thrown
     */
    it('should handle errors during data processing', async () => {
      // Arrange
      const csvFilePath = 'http://example.com/enquiries.csv';

      // Mock axios and csvService
      const csvStream = {};
      axios.get.mockResolvedValue({ status: 200, data: csvStream });

      const rawData = [
        {
          name: 'John Doe',
          phone: 'invalid_phone',
          lead_generated_date: 'invalid_date',
          branch: 'Main Branch',
        },
      ];
      csvService.readCSV.mockResolvedValue(rawData);

      // Mock enquiryRepository to return existing phone numbers
      enquiryRepository.getAllEnquiryPhoneNumbers.mockRejectedValue(
        new Error('Database error')
      );

      // Act & Assert
      await expect(
        enquiryService.processCSVAndInsertEnquiries(csvFilePath)
      ).rejects.toThrow('Database error');

      expect(enquiryRepository.getAllEnquiryPhoneNumbers).toHaveBeenCalled();
    });

    /**
     * Test Case: No data to insert
     * Ensures that the function handles the case when there's no data to insert
     */
    it('should handle case when there is no data to insert', async () => {
      // Arrange
      const csvFilePath = 'http://example.com/enquiries.csv';

      // Mock axios and csvService
      const csvStream = {};
      axios.get.mockResolvedValue({ status: 200, data: csvStream });

      const rawData = []; // Empty data
      csvService.readCSV.mockResolvedValue(rawData);

      // Mock enquiryRepository to return existing phone numbers
      enquiryRepository.getAllEnquiryPhoneNumbers.mockResolvedValue([]);

      // Act
      await enquiryService.processCSVAndInsertEnquiries(csvFilePath);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'No data to insert. Exiting bulk insertion process.'
      );
    });
  });
});
