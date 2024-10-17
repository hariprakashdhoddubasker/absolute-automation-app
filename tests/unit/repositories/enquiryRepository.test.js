// tests/repositories/enquiryRepository.test.js

const EnquiryRepository = require('../../../src/repositories/enquiryRepository');
const db = require('../../../src/config/db');

// Mock the getConnection method from the db module
jest.mock('../../../src/config/db');

describe('EnquiryRepository', () => {
  let mockConnection;

  beforeEach(() => {
    // Reset mock functions before each test
    jest.clearAllMocks();

    // Create a mock connection object
    mockConnection = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Mock getConnection to return the mock connection
    db.getConnection.mockResolvedValue(mockConnection);
  });

  describe('create', () => {
    it('should insert data into the enquiries table successfully', async () => {
      // Arrange
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dob: '1990-01-01',
        gender: 'Male',
        address: '123 Main St',
        enquiry_for: 'Gym Membership',
        followup_date: '2023-10-01',
        type: 'New',
        status: 'Pending',
        source: 'Website',
        remarks: 'Interested in annual plan',
        lead_generated_date: '2023-09-01',
        branch: 'Main Branch',
      };

      // Mock query to resolve with results
      const mockResults = [{ insertId: 1 }];
      mockConnection.query.mockResolvedValue([mockResults]);

      const callback = jest.fn();

      // Act
      await EnquiryRepository.create(data, callback);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [
        data.name,
        data.email,
        data.phone,
        data.dob,
        data.gender,
        data.address,
        data.enquiry_for,
        data.followup_date,
        data.type,
        data.status,
        data.source,
        data.remarks,
        data.lead_generated_date,
        data.branch,
      ]);
      expect(callback).toHaveBeenCalledWith(null, mockResults);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when inserting data into the enquiries table', async () => {
      // Arrange
      const data = {
        name: 'John Doe',
        phone: '1234567890',
        lead_generated_date: '2023-09-01',
        branch: 'Main Branch',
      };

      // Mock query to reject with an error
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      const callback = jest.fn();

      // Act
      await EnquiryRepository.create(data, callback);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(mockError, null);
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('bulkCreate', () => {
    it('should insert multiple records into the enquiries table successfully', async () => {
      // Arrange
      const dataArray = [
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          dob: '1990-01-01',
          gender: 'Male',
          address: '123 Main St',
          enquiry_for: 'Gym Membership',
          followup_date: '2023-10-01',
          type: 'New',
          status: 'Pending',
          source: 'Website',
          remarks: 'Interested in annual plan',
          lead_generated_date: '2023-09-01',
          branch: 'Main Branch',
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '0987654321',
          dob: '1992-02-02',
          gender: 'Female',
          address: '456 Elm St',
          enquiry_for: 'Yoga Classes',
          followup_date: '2023-10-02',
          type: 'New',
          status: 'Pending',
          source: 'Facebook',
          remarks: 'Interested in monthly plan',
          lead_generated_date: '2023-09-02',
          branch: 'Downtown Branch',
        },
      ];

      // Mock query to resolve with results
      const mockResults = [{ affectedRows: 2 }];
      mockConnection.query.mockResolvedValue([mockResults]);

      const callback = jest.fn();

      // Act
      await EnquiryRepository.bulkCreate(dataArray, callback);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();

      const expectedValues = dataArray.map((data) => [
        data.name,
        data.email,
        data.phone,
        data.dob,
        data.gender,
        data.address,
        data.enquiry_for,
        data.followup_date,
        data.type,
        data.status,
        data.source,
        data.remarks,
        data.lead_generated_date,
        data.branch,
      ]);

      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [expectedValues]);
      expect(callback).toHaveBeenCalledWith(null, mockResults);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when bulk inserting data into the enquiries table', async () => {
      // Arrange
      const dataArray = [
        {
          name: 'John Doe',
          phone: '1234567890',
          lead_generated_date: '2023-09-01',
          branch: 'Main Branch',
        },
      ];

      // Mock query to reject with an error
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      const callback = jest.fn();

      // Act
      await EnquiryRepository.bulkCreate(dataArray, callback);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(mockError, null);
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getEnquiryNumbers', () => {
    it('should fetch enquiry numbers where status is NULL or empty', async () => {
      // Arrange
      const mockResults = [
        { name: 'John Doe', phone: '1234567890' },
        { name: 'Jane Smith', phone: '0987654321' },
      ];
      mockConnection.query.mockResolvedValue([mockResults]);

      const callback = jest.fn();

      // Act
      await EnquiryRepository.getEnquiryNumbers(callback);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String));
      expect(callback).toHaveBeenCalledWith(null, mockResults);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when fetching enquiry numbers', async () => {
      // Arrange
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      const callback = jest.fn();

      // Act
      await EnquiryRepository.getEnquiryNumbers(callback);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(mockError, null);
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getAllEnquiryPhoneNumbers', () => {
    it('should fetch all enquiry phone numbers', async () => {
      // Arrange
      const mockResults = [{ phone: '1234567890' }, { phone: '0987654321' }];
      mockConnection.query.mockResolvedValue([mockResults]);

      // Act
      const result = await EnquiryRepository.getAllEnquiryPhoneNumbers();

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String));
      expect(result).toEqual(['1234567890', '0987654321']);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when fetching all enquiry phone numbers', async () => {
      // Arrange
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(EnquiryRepository.getAllEnquiryPhoneNumbers()).rejects.toThrow(mockError);
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getEnquiryNameAndContacts', () => {
    it('should fetch all enquiry names and contacts', async () => {
      // Arrange
      const mockResults = [
        { name: 'John Doe', phone: '1234567890' },
        { name: 'Jane Smith', phone: '0987654321' },
      ];
      mockConnection.query.mockResolvedValue([mockResults]);

      // Act
      const result = await EnquiryRepository.getEnquiryNameAndContacts();

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String));
      expect(result).toEqual(mockResults);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when fetching enquiry names and contacts', async () => {
      // Arrange
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(EnquiryRepository.getEnquiryNameAndContacts()).rejects.toThrow(mockError);
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
