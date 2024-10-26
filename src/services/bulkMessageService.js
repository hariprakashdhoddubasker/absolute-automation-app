// src/services/bulkMessageService.js
const whatsappMessagingService = require('./whatsappMessagingService');
const waTrackingService = require('./waTrackingService');
const whatsappQueueService = require('./whatsappQueueService');
const { handleError } = require('../utils/responseHelpers');
const logger = require('../utils/logger');
const { sleep } = require('../utils/dateTimeUtils');

const bulkMessageService = {
  // Asynchronous function to process bulk messages
  processBulkMessages: async (priority = 'all') => {
    try {
      // Step 1: Get available WhatsApp numbers and determine message capacity
      const availableNumbers = await waTrackingService.getAvailableNumbers();
      if (availableNumbers.length === 0) {
        await handleError(
          'All WhatsApp numbers have reached their daily limit'
        );
      }

      const totalAvailableMessages = availableNumbers.reduce(
        (total, number) => {
          return total + (number.daily_limit - number.message_count);
        },
        0
      );

      // Step 2: Query the message queue table to retrieve high-priority entries within the limit
      let messagesToProcess =
        await whatsappQueueService.getHighPriorityQueuedMessages();

      // If priority is 'all' and there is remaining capacity, fetch normal-priority messages
      if (
        priority === 'all' &&
        messagesToProcess.length < totalAvailableMessages
      ) {
        const remainingCapacity =
          totalAvailableMessages - messagesToProcess.length;
        const normalPriorityMessages =
          await whatsappQueueService.getPendingQueuedMessagesWithLimit(
            'normal',
            remainingCapacity
          );
        messagesToProcess = messagesToProcess.concat(normalPriorityMessages);
      }

      if (messagesToProcess.length === 0) {
        await handleError('No messages found to process.');
        return null;
      }

      // Step 3: Distribute and send the messages in bulk
      let result = await bulkMessageService.processMessageQueue(
        messagesToProcess,
        availableNumbers
      );

      // Send the summary as a WhatsApp text using the first available WhatsApp number only in the production env
      if (
        process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'test'
      ) {
        const instanceId =
          await whatsappMessagingService.getDefaultInstanceId();
        await whatsappMessagingService.sendMessage({
          number: '8089947074', // Send to my personal WhatsApp Number
          type: 'text',
          message: result,
          instanceId,
        });
      }
    } catch (error) {
      await handleError('Error in bulk message processing:', error);
    }
  },

  // Function to process the message queue
  processMessageQueue: async (messages, availableNumbers) => {
    let currentNumberIndex = 0;
    const messageCounts = {}; // Object to track the number of messages sent per number

    for (const messageEntry of messages) {
      // Use the helper function to get the available WhatsApp number
      const selectedNumber = bulkMessageService.getAvailableNumber(
        availableNumbers,
        messageEntry.branch_id
      );

      // If no available number is found, break the loop
      if (!selectedNumber) break;

      const { phone_number, instance_id, daily_limit, message_count } =
        selectedNumber;

      const minDelay = Number(process.env.WHATSAPP_MESSAGE_SEND_MIN_DELAY);
      const maxDelay = Number(process.env.WHATSAPP_MESSAGE_SEND_MAX_DELAY);
      // Random delay before sending each message
      const delay = Math.floor(
        Math.random() * (maxDelay - minDelay + 1) + minDelay
      );
      if (process.env.NODE_ENV !== 'test') {
        await sleep(delay);
      }
      logger.info(
        `Waiting for ${delay / 1000} seconds before sending the next message.`
      );
      let result;

      // Send the message only in the production env
      if (
        process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'test'
      ) {
        result = await whatsappMessagingService.sendMessage({
          name: messageEntry.name,
          number: messageEntry.phone,
          type: messageEntry.media_url ? 'media' : 'text',
          message: messageEntry.message,
          mediaUrl: messageEntry.media_url,
          instanceId: instance_id,
          filename: messageEntry.filename,
        });
      } else if (process.env.NODE_ENV === 'development') {
        result = 'message successfully sent to number';
      }
      // Only proceed if the message was successfully sent
      if (result && result.includes('message successfully sent to number')) {
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
        await handleError(
          'Message sending failed. Skipping to the next message.'
        );
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
  },

  getAvailableNumber: (availableNumbers, branchId) => {
    // Find the WhatsApp number matching the message's branch_id and within limit
    let selectedNumber = availableNumbers.find(
      (number) =>
        number.branch_id === branchId &&
        number.message_count < number.daily_limit
    );

    // If no branch-specific number is available, use the default number
    if (!selectedNumber) {
      selectedNumber = availableNumbers.find(
        (number) =>
          number.is_default === true &&
          number.message_count < number.daily_limit
      );
    }

    // If default is also unavailable, use the next available number
    if (!selectedNumber) {
      selectedNumber = availableNumbers.find(
        (number) => number.message_count < number.daily_limit
      );
    }

    return selectedNumber || null; // Return null if no available number is found
  },
};

module.exports = bulkMessageService;
