// tests/services/waTrackingService.test.js

const waTrackingService = require('../../src/services/waTrackingService');
const waTrackingRepository = require('../../src/repositories/waTrackingRepository');

// Mock the repository
jest.mock('../../src/repositories/waTrackingRepository');

describe('WA Tracking Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  /**
   * Test Suite for getAvailableNumbers function
   * This suite tests fetching available WhatsApp numbers.
   */
  describe('getAvailableNumbers', () => {
    /**
     * Test Case: Should return available WhatsApp numbers
     * Ensures that the service returns the numbers from the repository.
     */
    it('should return available WhatsApp numbers', async () => {
      // Arrange
      const availableNumbers = [
        { phone_number: '1234567890', daily_limit: 100, message_count: 50 },
      ];
      waTrackingRepository.getAvailableNumbers.mockResolvedValue(availableNumbers);

      // Act
      const result = await waTrackingService.getAvailableNumbers();

      // Assert
      expect(waTrackingRepository.getAvailableNumbers).toHaveBeenCalled();
      expect(result).toEqual(availableNumbers);
    });

    /**
     * Test Case: Repository call failure
     * Ensures that an error is thrown when the repository call fails.
     */
    it('should throw an error if repository call fails', async () => {
      // Arrange
      const error = new Error('Database error');
      waTrackingRepository.getAvailableNumbers.mockRejectedValue(error);

      // Act & Assert
      await expect(waTrackingService.getAvailableNumbers()).rejects.toThrow(
        'Failed to fetch available WhatsApp numbers.'
      );
    });
  });

  /**
   * Test Suite for getInstanceDetailsByPhoneNumber function
   * This suite tests fetching instance details by phone number.
   */
  describe('getInstanceDetailsByPhoneNumber', () => {
    /**
     * Test Case: Should return instance details for a given phone number
     * Ensures that the service returns the instance details from the repository.
     */
    it('should return instance details for a given phone number', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      const instanceDetails = { instance_id: 'instance123' };
      waTrackingRepository.getInstanceDetailsByPhoneNumber.mockResolvedValue(
        instanceDetails
      );

      // Act
      const result = await waTrackingService.getInstanceDetailsByPhoneNumber(
        phoneNumber
      );

      // Assert
      expect(
        waTrackingRepository.getInstanceDetailsByPhoneNumber
      ).toHaveBeenCalledWith(phoneNumber);
      expect(result).toEqual(instanceDetails);
    });

    /**
     * Test Case: Repository call failure
     * Ensures that an error is thrown when the repository call fails.
     */
    it('should throw an error if repository call fails', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      const error = new Error('Database error');
      waTrackingRepository.getInstanceDetailsByPhoneNumber.mockRejectedValue(error);

      // Act & Assert
      await expect(
        waTrackingService.getInstanceDetailsByPhoneNumber(phoneNumber)
      ).rejects.toThrow('Failed to fetch instance details for the given phone number.');
    });
  });

  /**
   * Test Suite for getMessageLimitStatus function
   * This suite tests fetching message limit status.
   */
  describe('getMessageLimitStatus', () => {
    /**
     * Test Case: Should return message limit status
     * Ensures that the service returns the status from the repository.
     */
    it('should return message limit status for a given phone number', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      const status = { daily_limit: 100, message_count: 50 };
      waTrackingRepository.getMessageLimitStatus.mockResolvedValue(status);

      // Act
      const result = await waTrackingService.getMessageLimitStatus(phoneNumber);

      // Assert
      expect(waTrackingRepository.getMessageLimitStatus).toHaveBeenCalledWith(
        phoneNumber
      );
      expect(result).toEqual(status);
    });

    /**
     * Test Case: Repository call failure
     * Ensures that an error is thrown when the repository call fails.
     */
    it('should throw an error if repository call fails', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      const error = new Error('Database error');
      waTrackingRepository.getMessageLimitStatus.mockRejectedValue(error);

      // Act & Assert
      await expect(
        waTrackingService.getMessageLimitStatus(phoneNumber)
      ).rejects.toThrow('Failed to fetch message limit status.');
    });
  });

  /**
   * Test Suite for updateWhatsAppTracking function
   * This suite tests updating WhatsApp tracking information.
   */
  describe('updateWhatsAppTracking', () => {
    /**
     * Test Case: Update tracking with default count
     * Ensures that the repository is called with the default count of 1.
     */
    it('should update WhatsApp tracking with default count', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      waTrackingRepository.updateWhatsAppTracking.mockResolvedValue();

      // Act
      await waTrackingService.updateWhatsAppTracking(phoneNumber);

      // Assert
      expect(waTrackingRepository.updateWhatsAppTracking).toHaveBeenCalledWith(
        phoneNumber,
        1
      );
    });

    /**
     * Test Case: Update tracking with specified count
     * Ensures that the repository is called with the specified count.
     */
    it('should update WhatsApp tracking with specified count', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      const count = 5;
      waTrackingRepository.updateWhatsAppTracking.mockResolvedValue();

      // Act
      await waTrackingService.updateWhatsAppTracking(phoneNumber, count);

      // Assert
      expect(waTrackingRepository.updateWhatsAppTracking).toHaveBeenCalledWith(
        phoneNumber,
        count
      );
    });

    /**
     * Test Case: Repository call failure
     * Ensures that an error is thrown when the repository call fails.
     */
    it('should throw an error if repository call fails', async () => {
      // Arrange
      const phoneNumber = '1234567890';
      const error = new Error('Database error');
      waTrackingRepository.updateWhatsAppTracking.mockRejectedValue(error);

      // Act & Assert
      await expect(
        waTrackingService.updateWhatsAppTracking(phoneNumber)
      ).rejects.toThrow('Failed to update WhatsApp tracking.');
    });
  });
});
