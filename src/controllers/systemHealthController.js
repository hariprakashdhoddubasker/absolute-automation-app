// src/controllers/systemHealthController.js
const whatsappMessagingService = require('../services/whatsappMessagingService');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const getSystemHealthReport = require('../utils/systemHealthReport');

// Controller to handle system health report sending
async function sendSystemHealthReport(req, res) {
  try {
    const report = await getSystemHealthReport();
    await whatsappMessagingService.sendMessageToManagement(report);
    return successResponse(
      res,
      null,
      'System health report sent successfully!',
      200
    );
  } catch (error) {
    return errorResponse(
      res,
      'Failed to send system health report.',
      500,
      error
    );
  }
}

module.exports = {
  sendSystemHealthReport,
};
