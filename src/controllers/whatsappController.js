// src/constrollers/whatsappController.js

// Function to lazily load whatsappMessagingService
const getWhatsappMessagingService = () => {
  return require('../services/whatsappMessagingService');
};

// Function to lazily load whatsappQueueService
const getWhatsappQueueService = () => {
  return require('../services/whatsappQueueService');
};

// Function to lazily load bulkMessageService
const getBulkMessageService = () => {
  return require('../services/bulkMessageService');
};

const { successResponse, errorResponse } = require('../utils/responseHelpers');
const { validateRequiredFields } = require('../utils/validationHelpers');

const whatsappController = {
  /**
   * Creates message queue entries based on the audience type.
   *
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>} - Returns a promise that resolves to a response.
   */
  createMessageQueueEntries: async (req, res) => {
    try {
      const { message, mediaUrl, audienceType } = req.body;

      if (!validateRequiredFields({ message, audienceType }, res)) return;

      const whatsappQueueService = getWhatsappQueueService();
      const result = await whatsappQueueService.createQueueEntries(
        message,
        mediaUrl,
        audienceType
      );
      return successResponse(res, result, '', 201);
    } catch (error) {
      return errorResponse(res, 'Failed to create message queue entries.', 500, error);
    }
  },

  /**
   * Sends a WhatsApp message.
   *
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>} - Returns a promise that resolves to a response.
   */
  sendWhatsappMessage: async (req, res) => {
    const {
      number,
      type = 'text',
      message,
      mediaUrl,
      accessToken,
      filename,
    } = req.body;

    try {
      if (!validateRequiredFields({ number, message, accessToken }, res))
        return;

      const whatsappMessagingService = getWhatsappMessagingService();
      const instanceId = await whatsappMessagingService.getDefaultInstanceId(
        res
      );
      
      if (!instanceId) return;

      const result = await whatsappMessagingService.sendMessage({
        number,
        type,
        message,
        mediaUrl,
        instanceId,
        filename,
      });
      const isSuccess = result.includes('message successfully sent to number');

      return isSuccess
        ? successResponse(res, result)
        : errorResponse(res, 'Failed to send WhatsApp message.', 500, result);
    } catch (error) {
      return errorResponse(
        res,
        'Failed to send WhatsApp message.',
        500,
        error
      );
    }
  },
  
  /**
   * Handles bulk WhatsApp message sending from the queue.
   *
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {Promise<void>} - Returns a promise that resolves to a response.
   */
  sendQueuedWhatsAppMessages: async (req, res) => {
    try {
      successResponse(res, {
        status: 'Processing Bulk Messages Started',
        timestamp: new Date().toISOString(),
      });

      const bulkMessageService = getBulkMessageService();
      bulkMessageService.processBulkMessages(res);
    } catch (error) {
      return errorResponse(
        res,
        'Failed to send bulk messages.',
        500,
        error
      );
    }
  },
};

module.exports = whatsappController;
