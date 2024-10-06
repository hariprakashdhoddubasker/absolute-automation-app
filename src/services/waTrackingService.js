// src/services/waTrackingService.js
const { handleError } = require('../utils/responseHelpers');
const waTrackingRepository = require('../repositories/waTrackingRepository');

const waTrackingService = {
  // Service to get available WhatsApp numbers that haven't reached their daily limit
  getAvailableNumbers: async () => {
    try {
      const availableNumbers = await waTrackingRepository.getAvailableNumbers();
      return availableNumbers;
    } catch (error) {
      await handleError('[getAvailableNumbers] Error in service:', error);
      throw new Error('Failed to fetch available WhatsApp numbers.');
    }
  },

  // Service to get instance details by phone number
  getInstanceDetailsByPhoneNumber: async (phoneNumber) => {
    try {
      return await waTrackingRepository.getInstanceDetailsByPhoneNumber(phoneNumber);
    } catch (error) {
      await handleError('[getInstanceDetailsByPhoneNumber] Error in service:', error);
      throw new Error('Failed to fetch instance details for the given phone number.');
    }
  },

  // Service to get the message limit status of a specific WhatsApp number
  getMessageLimitStatus: async (phoneNumber) => {
    try {
      const status = await waTrackingRepository.getMessageLimitStatus(phoneNumber);
      return status;
    } catch (error) {
      await handleError('[getMessageLimitStatus] Error in service:', error);
      throw new Error('Failed to fetch message limit status.');
    }
  },

  // Service to update the WhatsApp tracking
  updateWhatsAppTracking: async (phoneNumber, count = 1) => {
    try {
      await waTrackingRepository.updateWhatsAppTracking(phoneNumber, count);
    } catch (error) {
      await handleError('[updateWhatsAppTracking] Error in service:', error);
      throw new Error('Failed to update WhatsApp tracking.');
    }
  },
};

module.exports = waTrackingService;
