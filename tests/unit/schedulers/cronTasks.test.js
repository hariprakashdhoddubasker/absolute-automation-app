// tests/schedulers/cronTasks.test.js

// Save the original process.env.NODE_ENV
const originalEnv = process.env.NODE_ENV;

// Declare variables
let cron;
let logger;
let handleError;
let systemHealthService;
let nurtureScheduleService;

describe('cronTasks', () => {
  afterAll(() => {
    // Restore the original process.env.NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks(); // Clear mocks before each test

    // Set process.env.NODE_ENV to 'development' for testing
    process.env.NODE_ENV = 'development';

    // Mock the cron module
    jest.mock('node-cron', () => ({
      schedule: jest.fn(),
    }));

    // Mock the services
    jest.mock('../../../src/services/systemHealthService', () => ({
      sendSystemHealthReport: jest.fn(),
    }));

    jest.mock('../../../src/services/nurtureScheduleService', () => ({
      sendScheduledNurtureMessages: jest.fn(),
    }));

    // Mock handleError
    jest.mock('../../../src/utils/responseHelpers', () => ({
      handleError: jest.fn(),
    }));

    // Now import the modules
    cron = require('node-cron');
    logger = require('../../../src/utils/logger');
    handleError = require('../../../src/utils/responseHelpers').handleError;
    systemHealthService = require('../../../src/services/systemHealthService');
    nurtureScheduleService = require('../../../src/services/nurtureScheduleService');
  });

  it('should schedule a task to send a system health report at 7 AM every day', () => {
    // Require the cronTasks module after mocks are set up
    require('../../../src/schedulers/cronTasks');

    // Check if cron.schedule was called with the correct cron expression and options
    expect(cron.schedule).toHaveBeenCalledWith(
      '0 7 * * *',
      expect.any(Function),
      { timezone: 'Asia/Kolkata' }
    );
  });

  it('should schedule a task to send nurture messages at 9 AM every day', () => {
    require('../../../src/schedulers/cronTasks');

    // Check if cron.schedule was called with the correct cron expression and options for the 9 AM job
    expect(cron.schedule).toHaveBeenCalledWith(
      '0 9 * * *',
      expect.any(Function),
      { timezone: 'Asia/Kolkata' }
    );
  });

  it('should call systemHealthService.sendSystemHealthReport on 7 AM cron execution', async () => {
    require('../../../src/schedulers/cronTasks');

    // Find the scheduled function for the 7 AM job
    const scheduledFunction = cron.schedule.mock.calls.find(
      (call) => call[0] === '0 7 * * *'
    )[1];

    // Ensure the scheduled function exists
    expect(scheduledFunction).toBeDefined();

    // Call the scheduled function to simulate cron execution
    await scheduledFunction();

    // Verify that sendSystemHealthReport was called
    expect(systemHealthService.sendSystemHealthReport).toHaveBeenCalled();
  });

  it('should handle errors when systemHealthService.sendSystemHealthReport throws an error', async () => {
    // Mock logger methods
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});

    // Make sendSystemHealthReport throw an error
    const testError = new Error('Service failed');
    systemHealthService.sendSystemHealthReport.mockRejectedValueOnce(testError);

    require('../../../src/schedulers/cronTasks');

    // Find the scheduled function for the 7 AM job
    const scheduledFunction = cron.schedule.mock.calls.find(
      (call) => call[0] === '0 7 * * *'
    )[1];

    // Ensure the scheduled function exists
    expect(scheduledFunction).toBeDefined();

    // Call the scheduled function to simulate cron execution
    await scheduledFunction();

    // Verify that handleError was called with the expected error
    expect(handleError).toHaveBeenCalledWith(
      'Error sending system health report:',
      testError
    );
  });

  it('should call nurtureScheduleService.sendScheduledNurtureMessages on 9 AM cron execution', async () => {
    require('../../../src/schedulers/cronTasks');

    // Find the scheduled function for the 9 AM job
    const scheduledFunction = cron.schedule.mock.calls.find(
      (call) => call[0] === '0 9 * * *'
    )[1];

    // Ensure the scheduled function exists
    expect(scheduledFunction).toBeDefined();

    // Call the scheduled function to simulate cron execution
    await scheduledFunction();

    // Verify that sendScheduledNurtureMessages was called
    expect(nurtureScheduleService.sendScheduledNurtureMessages).toHaveBeenCalled();
  });

  it('should handle errors when nurtureScheduleService.sendScheduledNurtureMessages throws an error', async () => {
    // Mock logger methods
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});

    // Make sendScheduledNurtureMessages throw an error
    const testError = new Error('Service failed');
    nurtureScheduleService.sendScheduledNurtureMessages.mockRejectedValueOnce(
      testError
    );

    require('../../../src/schedulers/cronTasks');

    // Find the scheduled function for the 9 AM job
    const scheduledFunction = cron.schedule.mock.calls.find(
      (call) => call[0] === '0 9 * * *'
    )[1];

    // Ensure the scheduled function exists
    expect(scheduledFunction).toBeDefined();

    // Call the scheduled function to simulate cron execution
    await scheduledFunction();

    // Verify that handleError was called with the expected error
    expect(handleError).toHaveBeenCalledWith(
      'Error sending nurture messages:',
      testError
    );
  });
});
