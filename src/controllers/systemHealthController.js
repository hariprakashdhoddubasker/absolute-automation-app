// src/controllers/systemHealthController.js
const whatsappMessagingService = require('../services/whatsappMessagingService');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const getSystemHealthReport = require('../utils/systemHealthReport');
const systemHealthService = require('../services/systemHealthService');

// Controller to handle system health report sending
async function sendSystemHealthReport(req, res) {
  try {
    const result = await systemHealthService.sendSystemHealthReport();
    return successResponse(res, null, result.message, 200);
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
