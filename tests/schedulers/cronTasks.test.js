// tests/schedulers/cronTasks.test.js

// Mock the cron and whatsappMessagingService modules
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('../../src/services/whatsappMessagingService', () => ({
  sendMessageToManagement: jest.fn(),
}));

describe('cronTasks', () => {
  let cron;
  let whatsappMessagingService;
  let originalEnv;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks(); // Clear mocks before each test

    // Save the original process.env.NODE_ENV
    originalEnv = process.env.NODE_ENV;

    // Set process.env.NODE_ENV to 'development' for testing
    process.env.NODE_ENV = 'development';

    // Re-require the modules after resetting
    cron = require('node-cron');
    whatsappMessagingService = require('../../src/services/whatsappMessagingService');
  });

  afterEach(() => {
    // Restore the original process.env.NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  it('should schedule a task to send a system health report at 7 AM every day', () => {
    // Require the cronTasks module after mocks are set up
    require('../../src/schedulers/cronTasks');

    // Check if cron.schedule was called with the correct cron expression and options
    expect(cron.schedule).toHaveBeenCalledWith(
      '0 7 * * *',
      expect.any(Function),
      { timezone: 'Asia/Kolkata' }
    );
  });

  it('should call whatsappMessagingService.sendMessageToManagement on cron execution', async () => {
    require('../../src/schedulers/cronTasks');

    // Get the scheduled function from the mock calls
    const scheduledFunction = cron.schedule.mock.calls[0][1];

    // Call the scheduled function to simulate cron execution
    await scheduledFunction();

    // Verify that sendMessageToManagement was called
    expect(whatsappMessagingService.sendMessageToManagement).toHaveBeenCalled();
  });

  it('should log an error if whatsappMessagingService.sendMessageToManagement throws an error', async () => {
    // Mock the logger and handleError
    const logger = require('../../src/utils/logger');
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.mock('../../src/utils/responseHelpers', () => ({
      handleError: jest.fn(),
    }));
    const { handleError } = require('../../src/utils/responseHelpers');

    // Make sendMessageToManagement throw an error
    const testError = new Error('Service failed');
    whatsappMessagingService.sendMessageToManagement.mockRejectedValueOnce(
      testError
    );

    require('../../src/schedulers/cronTasks');

    // Get the scheduled function from the mock calls
    const scheduledFunction = cron.schedule.mock.calls[0][1];

    // Call the scheduled function to simulate cron execution
    await scheduledFunction();

    // Verify that handleError was called with the expected error
    expect(handleError).toHaveBeenCalledWith(
      'Error sending system health report:',
      testError
    );
  });
});
