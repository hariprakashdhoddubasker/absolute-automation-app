// src/services/bulkMessageService.js
const whatsappMessagingService = require('./whatsappMessagingService');
const waTrackingService = require('./waTrackingService');
const whatsappQueueService = require('./whatsappQueueService');
const { handleError } = require('../utils/responseHelpers');
const logger = require('../utils/logger');

const bulkMessageService = {
  // Asynchronous function to process bulk messages
  processBulkMessages: async () => {
    try {
      // Step 1: Get available WhatsApp numbers and determine message capacity
      const availableNumbers = await waTrackingService.getAvailableNumbers();
      if (availableNumbers.length === 0) {
        await handleError('All WhatsApp numbers have reached their daily limit');
      }

      const totalAvailableMessages = availableNumbers.reduce(
        (total, number) => {
          return total + (number.daily_limit - number.message_count);
        },
        0
      );

      // Step 2: Query the message queue table to retrieve entries within the limit
      const messagesToProcess = await whatsappQueueService.getPendingMessages(
        totalAvailableMessages
      );

      if (messagesToProcess.length === 0) {
        await handleError('No messages found to process.');
      }

      // Step 3: Distribute and send the messages in bulk
      let result = await processMessageQueue(
        messagesToProcess,
        availableNumbers        
      );

      // Send the summary as a WhatsApp text using the first available WhatsApp number
      if (availableNumbers.length > 0) {
        const firstAvailableNumber = availableNumbers[0]; // Use the first number from available numbers
        await whatsappMessagingService.sendMessage({
          number: '8089947074', // Send to tmy WhatsApp Number
          type: 'text',
          message: result,
          instanceId: firstAvailableNumber.instance_id,
        });
      }
    } catch (error) {
      await handleError('Error in bulk message processing:', error);
    }
  },
};

// Function to process the message queue
const processMessageQueue = async (messages, availableNumbers) => {
  let currentNumberIndex = 0;
  const messageCounts = {}; // Object to track the number of messages sent per number

  for (const messageEntry of messages) {
    const { phone_number, instance_id, daily_limit, message_count } =
      availableNumbers[currentNumberIndex];

    if (message_count >= daily_limit) {
      currentNumberIndex++;
      if (currentNumberIndex >= availableNumbers.length) break;
    }

    logger.info(`Available & Selected WhatsApp Number: ${phone_number}`);

    // Send the message
    let result = await whatsappMessagingService.sendMessage({
      name: messageEntry.name,
      number: messageEntry.phone,
      type: messageEntry.media_url ? 'media' : 'text',
      message: messageEntry.message,
      mediaUrl: messageEntry.media_url,
      instanceId: instance_id,
      filename: messageEntry.filename,
    });

    // Only proceed if the message was successfully sent
    if (result.includes('message successfully sent to number')) {
      availableNumbers[currentNumberIndex].message_count += 1;

      // Track the number of messages sent from each number
      if (!messageCounts[phone_number]) {
        messageCounts[phone_number] = 0;
      }
      messageCounts[phone_number] += 1;

      // Update the message count and status
      await waTrackingService.updateWhatsAppTracking(
        phone_number,
        availableNumbers[currentNumberIndex].message_count
      );

      // Delete the processed message from the queue
      await whatsappQueueService.deleteMessageFromQueue(messageEntry.id);

      // Check if the current number has reached its daily limit
      if (availableNumbers[currentNumberIndex].message_count >= daily_limit) {
        currentNumberIndex++;
        if (currentNumberIndex >= availableNumbers.length) break;
      }
    } else {
      await handleError('Message sending failed. Skipping to the next message.');
    }
    logger.info('           ');
  }

  // Log the number of messages sent from each number as a single text string
  let messageSummary = '*Summary of Queued Message Sent*\n';
  Object.keys(messageCounts).forEach((number) => {
    messageSummary += `${number} - Messages sent: ${messageCounts[number]}\n`;
  });

  // You can now send this messageSummary as a WhatsApp message
  logger.info(messageSummary);
  return messageSummary;
};

module.exports = bulkMessageService;
