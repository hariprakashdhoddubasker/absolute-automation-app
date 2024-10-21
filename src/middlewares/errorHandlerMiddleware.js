// src/middlewares/errorHandlerMiddleware.js

const whatsappMessagingService = require('../services/whatsappMessagingService');
const { handleError } = require('../utils/responseHelpers');

const errorHandlerMiddleware = async (err, req, res, next) => {
  // Collect additional error details
  const clientIp =
    req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  const timestamp = new Date().toISOString();

  const errorMessage = `
*Error in Node.js App*
-----------------------------
*Message:* ${err.message}
*Status Code:* ${err.status || 500}
*Method:* ${req.method}
*URL:* ${req.originalUrl}
*Client IP:* ${clientIp}
*User Agent:* ${userAgent}
*Timestamp:* ${timestamp}
`;

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // Handle invalid JSON errors
    try {
      await handleError(
        `Bad JSON Error - ${errorMessage}`,
        err,
        true,
        false,
        false,
        true // forceNoThrow set to true
      );
      // Optionally send a notification
      await whatsappMessagingService.sendMessageToManagement(
        `Bad JSON Error - ${errorMessage}`
      );
    } catch (error) {
      await handleError(
        'Failed to send WhatsApp notification:',
        error,
        true,
        false,
        false,
        true // forceNoThrow set to true
      );
    }
    return res.status(400).send('Invalid JSON format.');
  } else {
    // Handle all other errors (excluding 404, which are handled separately)
    try {
      await handleError(`Error in Node.js App - ${errorMessage}`);
      // Optionally send a notification
      await whatsappMessagingService.sendMessageToManagement(
        `Error in Node.js App - ${errorMessage}`
      );
    } catch (error) {
      await handleError(
        'Failed to send WhatsApp notification:',
        error,
        true,
        false,
        false,
        true // forceNoThrow set to true
      );
    }
    return res
      .status(err.status || 500)
      .json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = errorHandlerMiddleware;
