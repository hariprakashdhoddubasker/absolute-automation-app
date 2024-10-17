// tests/repositories/waTrackingRepository.test.js

const waTrackingRepository = require('../../../src/repositories/waTrackingRepository');
const db = require('../../../src/config/db');
const logger = require('../../../src/utils/logger');
const { handleError } = require('../../../src/utils/responseHelpers'); // Import handleError

// Mock the getConnection method from the db module
jest.mock('../../../src/config/db');
jest.mock('../../../src/utils/responseHelpers'); // Mock handleError

describe('waTrackingRepository', () => {
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

    // Mock logger methods
    logger.info = jest.fn();
    logger.error = jest.fn();

    // Mock handleError
    handleError.mockResolvedValue();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('getAvailableNumbers', () => {
    it('should fetch available WhatsApp numbers successfully', async () => {
      // Arrange
      const mockRows = [
        {
          phone_number: '1234567890',
          instance_id: 'instance1',
          message_count: 10,
          daily_limit: 100,
        },
      ];
      mockConnection.query.mockResolvedValue([mockRows]);

      // Act
      const result = await waTrackingRepository.getAvailableNumbers();

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), expect.any(Array));
      expect(result).toEqual(mockRows);
      expect(logger.info).toHaveBeenCalledWith(
        `[getAvailableNumbers] Found ${mockRows.length} available numbers:`,
        mockRows
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when fetching available WhatsApp numbers', async () => {
      // Arrange
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act
      const result = await waTrackingRepository.getAvailableNumbers();

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        `[getAvailableNumbers] Error fetching available numbers:`,
        mockError
      );
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toBeNull(); // Since we return null on error
    });
  });

  describe('getInstanceDetailsByPhoneNumber', () => {
    it('should fetch instance details successfully', async () => {
      // Arrange
      const WhatsAppNumber = '1234567890';
      const mockRows = [
        {
          instance_id: 'instance1',
          message_count: 10,
          daily_limit: 100,
          last_reset_date: '2023-09-15',
        },
      ];
      mockConnection.query.mockResolvedValue([mockRows]);

      // Act
      const result = await waTrackingRepository.getInstanceDetailsByPhoneNumber(WhatsAppNumber);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [WhatsAppNumber]);
      expect(result).toEqual(mockRows[0]);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle the case when no instance details are found', async () => {
      // Arrange
      const WhatsAppNumber = '1234567890';
      mockConnection.query.mockResolvedValue([[]]);

      // Act
      const result = await waTrackingRepository.getInstanceDetailsByPhoneNumber(WhatsAppNumber);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        'Instance details not found for the given phone number.'
      );
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toBeNull(); // Since we return null when not found
    });

    it('should handle errors when fetching instance details', async () => {
      // Arrange
      const WhatsAppNumber = '1234567890';
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act
      const result = await waTrackingRepository.getInstanceDetailsByPhoneNumber(WhatsAppNumber);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith('Error fetching instance details:', mockError);
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toBeNull(); // Since we return null on error
    });
  });

  describe('getMessageLimitStatus', () => {
    it('should fetch message limit status successfully', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      const today = new Date().toISOString().split('T')[0];

      const mockResults = [
        {
          message_count: 50,
          daily_limit: 100,
          last_reset_date: today,
        },
      ];
      mockConnection.query.mockResolvedValue([mockResults]);

      // Act
      const result = await waTrackingRepository.getMessageLimitStatus(phoneNumber);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [phoneNumber]);
      expect(result).toEqual({
        message_count: 50,
        daily_limit: 100,
      });
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should reset message count if last_reset_date is not today', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      const today = new Date().toISOString().split('T')[0];

      const mockResults = [
        {
          message_count: 50,
          daily_limit: 100,
          last_reset_date: '2020-01-01', // Not today
        },
      ];
      mockConnection.query.mockResolvedValueOnce([mockResults]).mockResolvedValueOnce();

      // Act
      const result = await waTrackingRepository.getMessageLimitStatus(phoneNumber);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenNthCalledWith(1, expect.any(String), [phoneNumber]);
      expect(mockConnection.query).toHaveBeenNthCalledWith(
        2,
        'UPDATE whatsapp_tracking SET message_count = 0, last_reset_date = ? WHERE phone_number = ?',
        [today, phoneNumber]
      );
      expect(result).toEqual({
        message_count: 0,
        daily_limit: 100,
      });
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle the case when tracking data is not found', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      mockConnection.query.mockResolvedValue([[]]);

      // Act
      const result = await waTrackingRepository.getMessageLimitStatus(phoneNumber);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        'Tracking data not found for this phone number'
      );
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toBeNull(); // Since we return null when not found
    });

    it('should handle errors when fetching message limit status', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act
      const result = await waTrackingRepository.getMessageLimitStatus(phoneNumber);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        `[getMessageLimitStatus] Error fetching message limit status for phone number: ${phoneNumber}`,
        mockError
      );
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toBeNull(); // Since we return null on error
    });
  });

  describe('updateWhatsAppTracking', () => {
    it('should update WhatsApp tracking successfully', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      const count = 51;
      const today = new Date()
        .toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        .split('/')
        .reverse()
        .join('-');

      mockConnection.query.mockResolvedValue();

      // Act
      const result = await waTrackingRepository.updateWhatsAppTracking(phoneNumber, count);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(
        'UPDATE whatsapp_tracking SET message_count = ?, last_reset_date = ? WHERE phone_number = ?',
        [count, today, phoneNumber]
      );
      expect(logger.info).toHaveBeenCalledWith(
        `Message count for phone number: ${phoneNumber} is ${count}`
      );
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toBeUndefined(); // Function doesn't return anything on success
    });

    it('should handle errors when updating WhatsApp tracking', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      const count = 51;
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act
      const result = await waTrackingRepository.updateWhatsAppTracking(phoneNumber, count);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        `[updateWhatsAppTracking] Error updating message count for phone number: ${phoneNumber}`,
        mockError
      );
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toBe(null);// Since we return false on error
    });
  });
});
