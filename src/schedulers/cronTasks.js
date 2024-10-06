// src/schedulers/cronTasks.js
const cron = require('node-cron');
const whatsappMessagingService = require('../services/whatsappMessagingService');
const logger = require('../utils/logger');
const { handleError } = require('../utils/responseHelpers'); 

if (process.env.NODE_ENV !== 'test') {
cron.schedule(
    '0 7 * * *', // Cron expression for 7 AM every day
    async () => {
      try {
        logger.info('Starting to send system health report...');
        await whatsappMessagingService.sendMessageToManagement();
        logger.info('System health report sent via WhatsApp');
      } catch (error) {
        await handleError('Error sending system health report:', error);
      }
    },
    {
      timezone: 'Asia/Kolkata', // Include the timezone option
    }
  );
}