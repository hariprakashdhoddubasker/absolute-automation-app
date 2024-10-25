// tests/services/enquiryService.test.js

const enquiryService = require('../../../src/services/enquiryService');

// Mock dependencies
const axios = require('axios');
const csvService = require('../../../src/services/csvService');
const enquiryRepository = require('../../../src/repositories/enquiryRepository');
const enquiryNurtureService = require('../../../src/services/nurtureScheduleService');
const branchService = require('../../../src/services/branchService');
const moment = require('moment');
const logger = require('../../../src/utils/logger');

jest.mock('axios');
jest.mock('../../../src/services/csvService');
jest.mock('../../../src/repositories/enquiryRepository');
jest.mock('../../../src/services/nurtureScheduleService');
jest.mock('../../../src/services/branchService');
jest.mock('../../../src/utils/logger');

describe('Enquiry Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
  });

  /**
   * Test Suite for createEnquiry function
   */
  describe('createEnquiry', () => {
    it('should create an enquiry with formatted date and schedule nurture messages', async () => {
      // Arrange
      const enquiryData = {
        name: 'John Doe',
        phone: '1234567890',
        lead_generated_date: '10-10-2023',
        branch: 'Main Branch',
      };

      const formattedDate = '2023-10-10';
      const insertId = 1;
      const branchId = 2;
      const callback = jest.fn();

      // Mock branchService to return a branch ID
      branchService.getBranchIdByName.mockResolvedValue(branchId);

      // Spy on moment to ensure it is called correctly
      const momentSpy = jest
        .spyOn(moment.prototype, 'format')
        .mockReturnValue(formattedDate);

      // Mock the repository create method
      enquiryRepository.create.mockImplementation((enquiry, cb) => {
        cb(null, { insertId });
      });

      // Act
      await enquiryService.createEnquiry(enquiryData, callback);

      // Assert
      expect(branchService.getBranchIdByName).toHaveBeenCalledWith(
        'Main Branch'
      );

      expect(callback).not.toHaveBeenCalledWith(expect.any(Error));

      expect(enquiryRepository.create).toHaveBeenCalledWith(
        {
          ...enquiryData,
          lead_generated_date: formattedDate,
          branch_id: branchId,
        },
        expect.any(Function)
      );

      expect(
        enquiryNurtureService.scheduleNurtureMessages
      ).toHaveBeenCalledWith({
        ...enquiryData,
        lead_generated_date: formattedDate,
        branch_id: branchId,
        id: insertId,
      });

      expect(callback).toHaveBeenCalledWith(null, {
        ...enquiryData,
        lead_generated_date: formattedDate,
        branch_id: branchId,
        id: insertId,
      });

      // Clean up
      momentSpy.mockRestore();
    });

    it('should handle errors when repository create fails', async () => {
      // Arrange
      const enquiryData = {
        name: 'John Doe',
        phone: '1234567890',
        lead_generated_date: '10-10-2023',
        branch: 'Main Branch',
      };

      const formattedDate = '2023-10-10';
      const branchId = 2;
      const callback = jest.fn();
      const mockError = new Error('Database error');

      // Mock branchService to return a branch ID
      branchService.getBranchIdByName.mockResolvedValue(branchId);

      // Spy on moment to ensure it is called correctly
      const momentSpy = jest
        .spyOn(moment.prototype, 'format')
        .mockReturnValue(formattedDate);

      // Mock the repository create method to return an error
      enquiryRepository.create.mockImplementation((enquiry, cb) => {
        cb(mockError);
      });

      // Act
      await enquiryService.createEnquiry(enquiryData, callback);

      // Assert
      expect(branchService.getBranchIdByName).toHaveBeenCalledWith(
        'Main Branch'
      );

      expect(enquiryRepository.create).toHaveBeenCalledWith(
        {
          ...enquiryData,
          lead_generated_date: formattedDate,
          branch_id: branchId,
        },
        expect.any(Function)
      );

      expect(
        enquiryNurtureService.scheduleNurtureMessages
      ).not.toHaveBeenCalled();

      expect(callback).toHaveBeenCalledWith(mockError);

      // Clean up
      momentSpy.mockRestore();
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
      const branchId = 1;

      // Mock branchService to return a branch ID
      branchService.getBranchIdByName.mockResolvedValue(branchId);

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
      jest.spyOn(moment.prototype, 'isValid').mockReturnValue(true);
      jest.spyOn(moment.prototype, 'format').mockReturnValue('2023-10-10');

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
            branch_id: 1,
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
