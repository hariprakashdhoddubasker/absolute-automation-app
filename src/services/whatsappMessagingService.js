// src/services/whatsappMessagingService.js
const pingerApiClient = require('../integrations/pingerApiClient');
const { handleError } = require('../utils/responseHelpers'); 
// Function to lazily load WhatsApp TrackingService
const getWhatsAppTrackingService = () => {
  return require('../services/waTrackingService');
};

const whatsappMessagingService = {
  sendMessageToManagement: async (message, sendToGroup = false) => {
    const instanceId = await whatsappMessagingService.getDefaultInstanceId();
    if (!instanceId) return;
    if (sendToGroup) {
      await whatsappMessagingService.sendGroupMessage({
        groupId: process.env.MANAGEMENT_WHATSAPP_GROUP,
        message,
        instanceId,
      });
    } else {
      whatsappMessagingService.sendMessage({
        number: process.env.MANAGEMENT_WHATSAPP_NUMBER,
        message,
        instanceId,
      });
    }
  },

  sendMessage: async ({
    name,
    number,
    type = 'text',
    message,
    mediaUrl,
    instanceId,
    filename,
  }) => {
    if (!number || !message || !instanceId) {
      throw new Error(`Missing required fields - number : ${number}, number : ${message}, number : ${instanceId}`);
    }

    try {
      // Add logic to prefix '91' if the number is only 10 digits
      number = number.length === 10 ? `91${number}` : number;

      const accessToken = process.env.PINGER_ACCESS_TOKEN;

      // Replace the {Name} tag in the message with the recipient's actual name
      message = name ? message.replace('{Name}', name) : message;

      return await pingerApiClient.sendMessage({
        name,
        number,
        type,
        message,
        mediaUrl,
        instanceId,
        accessToken,
        filename,
      });
    } catch (error) {
      throw new Error(`Failed to send ${type} message: ${error.message}`);
    }
  },
  sendGroupMessage: async ({ groupId, type = 'text', message, instanceId }) => {
    if (!message || !instanceId) {
      throw new Error('Missing required fields');
    }

    // Check if groupId is null or undefined
    if (groupId == null) {
      throw new Error('Missing required fields');
    }

    // Check if groupId is null, undefined, or empty
    if (!groupId || groupId.trim() === '') {
      await handleError('Group ID is null or empty');
      return; // Exit the function early
    }
    try {
      const accessToken = process.env.PINGER_ACCESS_TOKEN;

      return await pingerApiClient.sendMessageToGroup({
        groupId,
        type,
        message,
        instanceId,
        accessToken,
      });
    } catch (error) {
      throw new Error(`Failed to send ${type} message: ${error.message}`);
    }
  },

  // Helper function to get default instance ID
  getDefaultInstanceId: async () => {
    try {
      const whatsappNumber = process.env.DEFAULT_WHATSAPP_NUMBER;
      const trackingService = getWhatsAppTrackingService();
      const instanceDetails =
        await trackingService.getInstanceDetailsByPhoneNumber(whatsappNumber);

      if (!instanceDetails || !instanceDetails.instance_id) {
        await handleError(
          'Failed to retrieve WhatsApp instance ID from the database.'
        );
        return null;
      }

      return instanceDetails.instance_id;
    } catch (error) {
      await handleError('Error retrieving instance ID:', error);
      return null;
    }
  },
};

module.exports = whatsappMessagingService;
