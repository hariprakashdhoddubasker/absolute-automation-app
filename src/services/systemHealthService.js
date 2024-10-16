// src/services/systemHealthService.js

const whatsappMessagingService = require('./whatsappMessagingService');
const getSystemHealthReport = require('../utils/systemHealthReport');
const logger = require('../utils/logger');
const { handleError } = require('../utils/responseHelpers');

async function sendSystemHealthReport() {
  try {
    const report = await getSystemHealthReport();
    
    await whatsappMessagingService.sendMessageToManagement(report);

    logger.info('System health report sent successfully.');
    return {
      success: true,
      message: 'System health report sent successfully!',
    };
  } catch (error) {
    handleError('Failed to send system health report:', error);
  }
}

module.exports = {
  sendSystemHealthReport,
};
