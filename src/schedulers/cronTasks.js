// src/schedulers/cronTasks.js
const cron = require('node-cron');
const logger = require('../utils/logger');
const { handleError } = require('../utils/responseHelpers');
const systemHealthService = require('../services/systemHealthService');
const nurtureScheduleService = require('../services/nurtureScheduleService');

if (process.env.NODE_ENV !== 'test') {
  cron.schedule(
    '0 7 * * *', // Cron expression for 7 AM every day
    async () => {
      try {
        logger.info('Starting to send system health report...');
        await systemHealthService.sendSystemHealthReport();
        logger.info('System health report sent via WhatsApp');
      } catch (error) {
        await handleError('Error sending system health report:', error);
      }
    },
    {
      timezone: 'Asia/Kolkata', // Include the timezone option
    }
  );

  // Schedule a task to send daily nurture messages at 9 AM
  cron.schedule(
    '0 9 * * *',
    async () => {
      try {
        logger.info('Running daily nurture message job');
        await nurtureScheduleService.sendScheduledNurtureMessages();
      } catch (error) {
        await handleError('Error sending nurture messages:', error);
      }
    },
    {
      timezone: 'Asia/Kolkata', // Include the timezone option
    }
  );
}

// if (process.env.NODE_ENV === 'test') {
//   cron.schedule(
//     '* * * * *', // Run every minute for testing purposes
//     async () => {
      
//       // try {
//       //   logger.info('Starting test run of system health report...');
//       //   await systemHealthService.sendSystemHealthReport();
//       //   logger.info('Test system health report sent successfully');
//       // } catch (error) {
//       //   await handleError('Error in test system health report:', error);
//       // }


//       try {
//         logger.info('Running daily nurture message job');
//         await nurtureScheduleService.sendScheduledNurtureMessages();
//       } catch (error) {
//         await handleError('Error sending nurture messages:', error);
//       }
//     },
//     {
//       timezone: 'Asia/Kolkata',
//     }
//   );
// }
