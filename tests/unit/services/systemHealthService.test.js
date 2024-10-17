// tests/services/systemHealthService.test.js

const systemHealthService = require('../../../src/services/systemHealthService');
const whatsappMessagingService = require('../../../src/services/whatsappMessagingService');
const getSystemHealthReport = require('../../../src/utils/systemHealthReport');
const logger = require('../../../src/utils/logger');
const { handleError } = require('../../../src/utils/responseHelpers');

jest.mock('../../../src/services/whatsappMessagingService');
jest.mock('../../../src/utils/systemHealthReport');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/responseHelpers');

describe('systemHealthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSystemHealthReport', () => {
    it('should send system health report successfully', async () => {
      // Arrange
      const report = 'System Health Report Content';
      getSystemHealthReport.mockResolvedValue(report);
      whatsappMessagingService.sendMessageToManagement.mockResolvedValue();
      logger.info.mockImplementation(() => {});

      // Act
      const result = await systemHealthService.sendSystemHealthReport();

      // Assert
      expect(getSystemHealthReport).toHaveBeenCalled();
      expect(whatsappMessagingService.sendMessageToManagement).toHaveBeenCalledWith(report);
      expect(logger.info).toHaveBeenCalledWith('System health report sent successfully.');
      expect(result).toEqual({
        success: true,
        message: 'System health report sent successfully!',
      });
    });

    it('should handle errors when sending system health report fails', async () => {
      // Arrange
      const error = new Error('Failed to generate report');
      getSystemHealthReport.mockRejectedValue(error);
      handleError.mockImplementation(() => {});

      // Act
      const result = await systemHealthService.sendSystemHealthReport();

      // Assert
      expect(getSystemHealthReport).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith('Failed to send system health report:', error);
      expect(result).toBeUndefined();
    });
  });
});
