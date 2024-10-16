// src/services/nurtureScheduleService.js
const moment = require('moment');
const bulkMessageService = require('./bulkMessageService');
const nurtureScheduleRepository = require('../repositories/nurtureScheduleRepository');
const whatsappMessageQueueRepository = require('../repositories/whatsappMessageQueueRepository');
const whatsappMessagingService = require('./whatsappMessagingService');
const logger = require('../utils/logger');

// Define the schedule for nurturing messages, specifying the day and the corresponding message
const nurtureSchedule = [
  {
    day: 1,
    message:
      'Welcome to The Absolute Fitness! Here is a quick introduction video: {video_link}',
  },
  {
    day: 3,
    message:
      'Hey {Name}, just checking in! Here are some tips to get started: {tips_link}',
  },
  {
    day: 5,
    message:
      'Reminder to join us for an upcoming fitness event. Details here: {event_link}',
  },
  {
    day: 7,
    message:
      'Stay motivated, {Name}! Here is a motivational video: {motivational_video_link}',
  },
  {
    day: 9,
    message:
      'Need help with your fitness goals? Schedule a free consultation: {consultation_link}',
  },
];

const nurtureScheduleService = {
  // Schedule nurturing messages for a new enquiry
  scheduleNurtureMessages: async (enquiryData) => {
    const { id, name, phone, lead_generated_date } = enquiryData;

    // Send immediate Day 1 message
    const immediateMessage = nurtureSchedule.find((item) => item.day === 1);
    if (immediateMessage) {
      const instanceId = await whatsappMessagingService.getDefaultInstanceId();
      try {
        // Send the immediate Day 1 message using the WhatsApp messaging service
        if (process.env.NODE_ENV === 'production') {
          await whatsappMessagingService.sendMessage({
            name,
            number: phone,
            message: immediateMessage.message,
            instanceId: instanceId,
          });
        }
        logger.info(`Immediate message sent to ${phone}`);
      } catch (error) {
        logger.error(
          `Failed to send immediate message to ${phone}: ${error.message}`
        );
      }
    }

    // Schedule the remaining nurturing messages
    for (const nurtureItem of nurtureSchedule.slice(1)) {
      const nurtureDate = moment(lead_generated_date, 'YYYY-MM-DD')
        .add(nurtureItem.day - 1, 'days')
        .format('YYYY-MM-DD');

      // Ensure all parameters are defined before scheduling the message
      const allParamsDefined = [
        id,
        name,
        phone,
        nurtureItem.message,
        nurtureDate,
      ].every((param) => param !== undefined && param !== null);

      if (allParamsDefined) {
        await nurtureScheduleRepository.scheduleNurtureMessage({
          enquiryId: id,
          name,
          number: phone,
          message: nurtureItem.message,
          scheduledDate: nurtureDate,
          priority: 'high', // Mark nurturing messages with high priority
        });
      } else {
        // Log any undefined or null parameters to help with debugging
        logger.error(
          `Failed to schedule message due to undefined parameter(s):`,
          {
            enquiryId: id,
            name,
            number: phone,
            message: nurtureItem.message,
            scheduledDate: nurtureDate,
          }
        );
      }
    }
  },

  // Send all scheduled nurturing messages for the current day
  sendScheduledNurtureMessages: async () => {
    const today = moment().format('YYYY-MM-DD');
    const scheduledMessages =
      await nurtureScheduleRepository.getScheduledMessagesForDate(
        today,
        'high'
      ); // Fetch high priority messages first

    if (scheduledMessages.length === 0) {
      logger.info('No nurture messages to send today.');
      return;
    }

    try {
      // Prepare the entries to be added to the WhatsApp message queue
      const queueEntries = scheduledMessages.map((message) => ({
        name: message.name,
        phone: message.number,
        message: message.message,
        media_url: null,
        filename: null,
        status: 'pending',
        priority: 'high', // Add priority to queue entries
      }));

      // Insert the scheduled messages into the WhatsApp message queue
      await whatsappMessageQueueRepository.insertQueueEntries(queueEntries);
      logger.info('Scheduled nurture messages have been added to the queue.');

      // Process the queued messages using the bulk message service
      await bulkMessageService.processBulkMessages('high'); // Process high priority messages first

      // Mark the messages as sent in the nurture_schedule table
      scheduledMessages.forEach((message) => {
        nurtureScheduleRepository.markMessageAsSent(message.id);
      });
    } catch (error) {
      logger.error(`Failed to process nurture messages: ${error.message}`);
    }
  },
};

module.exports = nurtureScheduleService;
