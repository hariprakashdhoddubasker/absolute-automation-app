// tests/routes/enquiryRoutes.test.js

const request = require('supertest');
const express = require('express');
const enquiryRoutes = require('../../../src/routes/enquiryRoutes');
const enquiryController = require('../../../src/controllers/enquiryController');

// Mock the controller methods
jest.mock('../../../src/controllers/enquiryController');

describe('Enquiry Routes', () => {
  let app;

  beforeAll(() => {
    // Create an Express app and use the enquiry routes
    app = express();
    app.use(express.json());
    app.use('/enquiries', enquiryRoutes);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  /**
   * Test Suite for POST /enquiries/
   * This suite tests the creation of an enquiry.
   */
  describe('POST /enquiries/', () => {
    /**
     * Test Case: Successful enquiry creation
     * Ensures that the controller's createEnquiry method is called and a 201 status is returned.
     */
    it('should create an enquiry and return status 201', async () => {
      // Arrange
      const enquiryData = {
        name: 'John Doe',
        phone: '1234567890',
        lead_generated_date: '10-10-2023',
        branch: 'Main Branch',
      };

      // Mock the controller method to send a success response
      enquiryController.createEnquiry.mockImplementation((req, res) => {
        res.status(201).json({ success: true, data: enquiryData });
      });

      // Act
      const response = await request(app).post('/enquiries/').send(enquiryData);

      // Assert
      expect(enquiryController.createEnquiry).toHaveBeenCalled();
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ success: true, data: enquiryData });
    });

    /**
     * Test Case: Validation error
     * Ensures that a 400 status is returned when required fields are missing.
     */
    it('should return status 400 when required fields are missing', async () => {
      // Arrange
      const enquiryData = {
        name: 'John Doe',
        // Missing phone number
      };

      // Mock the controller method to send an error response
      enquiryController.createEnquiry.mockImplementation((req, res) => {
        res.status(400).json({ success: false, message: 'Phone number is required' });
      });

      // Act
      const response = await request(app).post('/enquiries/').send(enquiryData);

      // Assert
      expect(enquiryController.createEnquiry).toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ success: false, message: 'Phone number is required' });
    });
  });

  /**
   * Test Suite for POST /enquiries/upload-csv
   * This suite tests the CSV upload and bulk insertion of enquiries.
   */
  describe('POST /enquiries/upload-csv', () => {
    /**
     * Test Case: Successful CSV upload and processing
     * Ensures that the controller's UploadCsvEnquires method is called and a success response is returned.
     */
    it('should process the CSV and return a success message', async () => {
      // Arrange
      const csvFilePath = 'http://example.com/enquiries.csv';
      const requestBody = {
        csvFilePath,
      };

      // Mock the controller method to send a success response
      enquiryController.UploadCsvEnquires.mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'CSV processed successfully' });
      });

      // Act
      const response = await request(app).post('/enquiries/upload-csv').send(requestBody);

      // Assert
      expect(enquiryController.UploadCsvEnquires).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, message: 'CSV processed successfully' });
    });

    /**
     * Test Case: Missing CSV file path
     * Ensures that a 400 status is returned when the CSV file path is missing.
     */
    it('should return status 400 when CSV file path is missing', async () => {
      // Arrange
      const requestBody = {
        // Missing csvFilePath
      };

      // Mock the controller method to send an error response
      enquiryController.UploadCsvEnquires.mockImplementation((req, res) => {
        res.status(400).json({ success: false, message: 'CSV file path is required' });
      });

      // Act
      const response = await request(app).post('/enquiries/upload-csv').send(requestBody);

      // Assert
      expect(enquiryController.UploadCsvEnquires).toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ success: false, message: 'CSV file path is required' });
    });
  });
});
