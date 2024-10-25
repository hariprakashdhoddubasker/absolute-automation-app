// src/integrations/pingerApiClient.js
const axios = require('axios');
const logger = require('../utils/logger');

const pingerApiClient = {
  sendMessage: async ({
    name,
    number,
    type,
    message,
    mediaUrl,
    instanceId,
    accessToken,
    filename = null,
  }) => {
    try {
      // Determine the payload based on the message type
      const payload = {
        number,
        type,
        message,
        instance_id: instanceId,
        access_token: accessToken,
      };

      if (type === 'media' && mediaUrl) {
        payload.media_url = mediaUrl;
        if (filename) {
          payload.filename = filename; // Optional: Only used for documents
        }
      }

      const response = await axios.post(
        'https://pingerbot.in/api/send',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      let result;
      if (
        response &&
        response.data &&
        response.data.message &&
        response.data.message.key &&
        response.data.message.key.remoteJid
      ) {
        result = `${
          type === 'media' ? 'Media' : 'Text'
        } message successfully sent to number : ${
          response.data.message.key.remoteJid
        }`;
        logger.info(result);
      } else {
        if (response.data.message) {
          result = 'Failed to send message: ' + response.data.message;
        }
        else{
          result = 'Failed to send message: ' + response.data;
        }
        await handleError(result);
      }

      return result;
    } catch (error) {
      await handleError(`Failed to send ${type} message`, error);
    }
  },
  sendMessageToGroup: async ({
    groupId,
    type,
    message,
    instanceId,
    accessToken,
  }) => {
    try {
      // Determine the payload based on the message type
      const payload = {
        group_id: groupId,
        type,
        message,
        instance_id: instanceId,
        access_token: accessToken,
      };

      const response = await axios.post(
        'https://pingerbot.in/api/send_group',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      let result;
      if (
        response &&
        response.data &&
        response.data.message &&
        response.data.message.key &&
        response.data.message.key.remoteJid
      ) {
        result = `${
          type === 'media' ? 'Media' : 'Text'
        } message successfully sent to group : ${
          response.data.message.key.remoteJid
        }`;
        logger.info(result);
      } else {
        result = 'Failed to send message.';
        await handleError(result);
      }

      return result;
    } catch (error) {
      await handleError(`Failed to send ${type} message`, error);
    }
  },
};

const handleError = async (
  message = 'An error occurred',
  error = null,
  sendToWhatsApp = true,
  shouldThrow = false
) => {
  const env = process.env.NODE_ENV || 'development';

  // Log detailed error information
  logger.error(`Error: ${message}`, { error, stack: error?.stack });

  // Throw the error in development for easier debugging
  if (shouldThrow && env === 'development') {
    throw error || new Error(message);
  }
};

module.exports = pingerApiClient;
