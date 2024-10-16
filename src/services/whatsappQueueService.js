// src/services/whatsappQueueService.js
const enquiryRepository = require('../repositories/enquiryRepository');
const whatsappMessageQueueRepository = require('../repositories/whatsappMessageQueueRepository');
const clientService = require('./clientService');
const { handleError } = require('../utils/responseHelpers');
const logger = require('../utils/logger');

const whatsappQueueService = {
  // Function to create message queue entries based on audience type
  createQueueEntries: async (message, mediaUrl, audienceType) => {
    let targetAudience = [];

    // Determine the target audience based on the selected type
    if (audienceType === 'EnquiryOnly') {
      targetAudience = await enquiryRepository.getEnquiryNameAndContacts();
    } else if (audienceType === 'ClientsOnly') {
      targetAudience = await clientService.getClientContacts();
    } else if (audienceType === 'Both') {
      const enquiries = await enquiryRepository.getEnquiryNameAndContacts();
      const clients = await clientService.getClientContacts();
      targetAudience = [...enquiries, ...clients];
    } else {
      await handleError(
        'Invalid audience type. Choose EnquiryOnly, ClientsOnly, or Both.'
      );
      return null;
    }

    // Prepare entries for insertion into the whatsapp_message_queue table
    const entries = targetAudience.map((contact) => ({
      name: contact.name,
      phone: contact.phone,
      message,
      media_url: mediaUrl,
      filename: null, // Set this if applicable
      status: 'pending',
    }));

    // Insert the entries into the queue
    await whatsappQueueService.insertQueueEntries(entries);

    return 'Message queue entries created successfully.';
  },

  // Function to insert entries into the whatsapp_message_queue table
  insertQueueEntries: async (entries) => {
    if (!entries || entries.length === 0) {
      logger.info('No entries to insert.');
      return;
    }
    await whatsappMessageQueueRepository.insertQueueEntries(entries);
  },

  // Fetch all high priority pending messages
  getHighPriorityQueuedMessages: async (limit) => {
    return await whatsappMessageQueueRepository.getHighPriorityQueuedMessages(limit);
  },

  // Fetch pending messages within the limit
  getPendingQueuedMessagesWithLimit: async (priority, limit) => {
    return await whatsappMessageQueueRepository.getPendingQueuedMessagesWithLimit(
      priority,
      limit
    );
  },

  // Delete a message from the queue after processing
  deleteMessageFromQueue: async (id) => {
    return await whatsappMessageQueueRepository.deleteMessageFromQueue(id);
  },
};

module.exports = whatsappQueueService;