// tests/controllers/enquiryController.test.js

const enquiryService = require('../../src/services/enquiryService');
const { validateRequiredFields } = require('../../src/utils/validationHelpers');
const {
  successResponse,
  errorResponse,
  handleError,
} = require('../../src/utils/responseHelpers');
const enquiryController = require('../../src/controllers/enquiryController');

// Mock dependencies to isolate controller logic
jest.mock('../../src/services/enquiryService');
jest.mock('../../src/utils/validationHelpers');
jest.mock('../../src/utils/responseHelpers');

describe('Enquiry Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks before each test to prevent test interference
    jest.resetAllMocks();

    // Mock Express.js request and response objects
    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  /**
   * Test Suite for the createEnquiry method
   * This suite tests the creation of an enquiry,
   * ensuring that required fields are validated and errors are handled.
   */
  describe('createEnquiry', () => {
    /**
     * Test Case: Missing Required Fields
     * Validates that if required fields are missing,
     * the controller responds with an error and does not proceed.
     */
    it('should return an error response if required fields are missing', () => {
      // Arrange
      req.body = {}; // Missing required fields
      validateRequiredFields.mockReturnValue(false);

      // Act
      enquiryController.createEnquiry(req, res);

      // Assert
      expect(validateRequiredFields).toHaveBeenCalledWith(
        {
          name: undefined,
          phone: undefined,
          lead_generated_date: undefined,
          branch: undefined,
        },
        res
      );
      expect(enquiryService.createEnquiry).not.toHaveBeenCalled();
    });

    /**
     * Test Case: Successful Enquiry Creation
     * Ensures that when required fields are provided,
     * the controller creates an enquiry and responds with success.
     */
    it('should create an enquiry and return success response', () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        phone: '1234567890',
        lead_generated_date: '2023-10-10',
        branch: 'Main Branch',
      };
      validateRequiredFields.mockReturnValue(true);
      enquiryService.createEnquiry.mockImplementation((data, callback) => {
        callback(null, { id: 1, ...data });
      });

      // Act
      enquiryController.createEnquiry(req, res);

      // Assert
      expect(validateRequiredFields).toHaveBeenCalled();
      expect(enquiryService.createEnquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          phone: '1234567890',
          lead_generated_date: '2023-10-10',
          branch: 'Main Branch',
          // Other fields can be included as needed
        }),
        expect.any(Function)
      );
      expect(successResponse).toHaveBeenCalledWith(
        res,
        expect.objectContaining({ id: 1, ...req.body }),
        'Enquiry submitted successfully',
        201
      );
    });

    /**
     * Test Case: Service Error Handling
     * Tests that if the service layer returns an error,
     * the controller handles it and responds with an error message.
     */
    it('should handle service errors and return error response', () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        phone: '1234567890',
        lead_generated_date: '2023-10-10',
        branch: 'Main Branch',
      };
      validateRequiredFields.mockReturnValue(true);
      const error = new Error('Database error');
      enquiryService.createEnquiry.mockImplementation((data, callback) => {
        callback(error);
      });

      // Act
      enquiryController.createEnquiry(req, res);

      // Assert
      expect(validateRequiredFields).toHaveBeenCalled();
      expect(enquiryService.createEnquiry).toHaveBeenCalled();
      expect(errorResponse).toHaveBeenCalledWith(
        res,
        'Error inserting enquiry',
        500,
        error
      );
    });
  });

  /**
   * Test Suite for the UploadCsvEnquires method
   * This suite tests the processing of CSV uploads,
   * ensuring that the CSV file path is validated and errors are handled.
   */
  describe('UploadCsvEnquires', () => {
    /**
     * Test Case: Missing CSV File Path
     * Validates that if 'csvFilePath' is missing in the request body,
     * the controller responds with an error and does not proceed.
     */
    it('should return error if csvFilePath is missing', async () => {
      // Arrange
      req.body = {}; // Missing csvFilePath

      // Act
      await enquiryController.UploadCsvEnquires(req, res);

      // Assert
      expect(handleError).toHaveBeenCalledWith('CSV file URL is required.');
      expect(
        enquiryService.processCSVAndInsertEnquiries
      ).not.toHaveBeenCalled();
    });

    /**
     * Test Case: Successful CSV Processing
     * Ensures that when 'csvFilePath' is provided,
     * the controller processes the CSV and responds with success.
     */
    it('should process CSV and return success response', async () => {
      // Arrange
      req.body = {
        csvFilePath: '/path/to/csvfile.csv',
      };
      enquiryService.processCSVAndInsertEnquiries.mockResolvedValue();

      // Act
      await enquiryController.UploadCsvEnquires(req, res);

      // Assert
      expect(enquiryService.processCSVAndInsertEnquiries).toHaveBeenCalledWith(
        req.body.csvFilePath
      );
      expect(successResponse).toHaveBeenCalledWith(
        res,
        null,
        'Enquiries processed and inserted successfully',
        201
      );
    });

    /**
     * Test Case: Error During CSV Processing
     * Tests that if processCSVAndInsertEnquiries throws an error,
     * the controller handles it and responds with an error message.
     */
    it('should handle errors during CSV processing', async () => {
      // Arrange
      req.body = {
        csvFilePath: '/path/to/csvfile.csv',
      };
      const error = new Error('Error processing CSV & inserting enquiries');
      enquiryService.processCSVAndInsertEnquiries.mockRejectedValue(error);

      // Act
      await enquiryController.UploadCsvEnquires(req, res);

      // Assert
      expect(enquiryService.processCSVAndInsertEnquiries).toHaveBeenCalledWith(
        req.body.csvFilePath
      );
      expect(errorResponse).toHaveBeenCalledWith(
        res,
        'Error processing CSV & inserting enquiries',
        500,
        error
      );
    });
  });
});
