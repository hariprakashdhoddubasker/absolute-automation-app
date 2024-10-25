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
      'Hey *{Name}* 👋 \n\nI noticed you signed up with *The Absolute Fitness*, and I wanted to personally follow up.\n\nWe’re ready to help you *transform in just 3 months!* 💥✨ \n\nAll we need is *YOU to get started*. 💯\n\nReady for more details? \n\nReach out to me anytime 💪\n\n🔥Lets make those fitness goals happen!',
    media_url:
      'https://theabsolutefitness.com/assets/nurture_sequence/1.About.mp4',
  },
  {
    day: 3,
    message:
      '✨ *✨ The Transformation Journey of Dharshini ✨* ✨\n\nDharshini tried everything – just walking, only dieting – but saw no results. 🛑❌\n\nAfter joining *The Absolute Fitness*, things changed. She set a goal: to look fit and feel amazing. 👗💃 With dedication and support from our trainers, she is on her way! 💪🔥\n\nFor her, gym time is *me time* – an investment in health. 🕒💖\n\nIf you are ready to make a change, come join *The Absolute Fitness*! 🚀',
    media_url:
      'https://theabsolutefitness.com/assets/nurture_sequence/2.Success_Story.mp4',
  },
  {
    day: 5,
    message:
      'Hey! 💡 Ready for a quick fitness tip to kickstart your gym routine?\n\n👉 Start your day strong with a black coffee (no sugar!) and an apple or banana before your morning workout. 🍎🍌\n\n💧 During the session, keep it simple – lemon and salt will keep you hydrated. 🏋️‍♂️\n\nIf you’re hitting the gym in the evening, fuel up with a banana or apple 30 minutes before. 🍏🕒\n\n💥 Oh, and don’t forget – cardio is great, but muscle training will get you real results!\n\nLet’s get those gains! 💪🔥\n\nNeed more tips? Just reach out! 📲',
    media_url:
      'https://theabsolutefitness.com/assets/nurture_sequence/3.WOW_Info.mp4',
  },
  {
    day: 7,
    message:
      'Worried that half your salary will disappear just for 6 months of gym? 😅 No need to stress!\n\nAt The Absolute Fitness, we’ve got your back with an easy EMI option. 💸✨\n\nAnd here’s the best part – if you complete 6 months with us, you get the next 6 months FREE! 🏋️‍♂️🔥\n\nIt’s time to invest in yourself without breaking the bank. 💪 Ready to take the first step? Let’s make this journey affordable and rewarding! 🚀',
    media_url:
      'https://theabsolutefitness.com/assets/nurture_sequence/4.Offer.mp4',
  },
  {
    day: 9,
    message:
      'Why are you still waiting? 🤔\n\nIf you care about your health, it’s time to take action NOW! 💯\n\nWe’re ready to transform you, but the real question is… are YOU ready? 💪\n\nThis is a serious commitment to yourself. Yes or No – it’s that simple. ✔️❌\n\nIf it’s a YES, then let’s make it happen at The Absolute Fitness! 🏋️‍♂️✨\n\nYour transformation starts TODAY. 💥 Don’t wait any longer!',
    media_url:
      'https://theabsolutefitness.com/assets/nurture_sequence/5.Yes_or_No.mp4',
  },
];

const nurtureScheduleService = {
  // Schedule nurturing messages for a new enquiry
  scheduleNurtureMessages: async (enquiryData) => {
    const { id, name, phone, lead_generated_date, branch_id } = enquiryData;

    // Send immediate Day 1 message
    const immediateMessage = nurtureSchedule.find((item) => item.day === 1);
    if (immediateMessage) {
      const instanceId = await whatsappMessagingService.getDefaultInstanceId();
      try {
        // Send the immediate Day 1 message using the WhatsApp messaging service
        if (
          process.env.NODE_ENV === 'production' ||
          process.env.CAN_SEND_WA_MESSAGE
        ) {
          await whatsappMessagingService.sendMessage({
            name,
            number: phone,
            message: immediateMessage.message,
            instanceId: instanceId,
            mediaUrl: immediateMessage.media_url,
            type: 'media',
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
          branch_id: enquiryData.branch_id,
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
        priority: 'high',
        branch_id: message.branch_id,
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
