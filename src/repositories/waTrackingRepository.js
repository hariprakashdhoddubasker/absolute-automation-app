// src/repositories/waTrackingRepository.js
const { getConnection } = require('../config/db');
const { handleError } = require('../utils/responseHelpers');
const logger = require('../utils/logger');

const waTrackingRepository = {
  // Function to get available WhatsApp numbers that haven't reached their daily limit
  getAvailableNumbers: async () => {
    const today = new Date()
      .toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .split('/')
      .reverse()
      .join('-');
    const connection = await getConnection(); // Get a connection from the pool

    try {
      // Query to fetch WhatsApp numbers
      const query = `
        SELECT phone_number, instance_id, 
               IF(last_reset_date < ?, 0, message_count) AS message_count, 
               daily_limit,
               branch_id
        FROM whatsapp_tracking
        WHERE (last_reset_date < ? OR (last_reset_date = ? AND message_count < daily_limit))
      `;

      const [rows] = await connection.query(query, [today, today, today]);

      logger.info(
        `[getAvailableNumbers] Found ${rows.length} available numbers:`,
        rows
      );

      return rows;
    } catch (error) {
      await handleError(
        `[getAvailableNumbers] Error fetching available numbers:`,
        error
      );
      return null;
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // Function to get instance details by phone number
  getInstanceDetailsByPhoneNumber: async (WhatsAppNumber) => {
    const connection = await getConnection(); // Get a connection from the pool
    try {
      const query = `
        SELECT instance_id, message_count, daily_limit, last_reset_date
        FROM whatsapp_tracking
        WHERE phone_number = ?
        LIMIT 1;
      `;

      const [rows] = await connection.query(query, [WhatsAppNumber]);

      if (rows.length === 0) {
        await handleError(
          'Instance details not found for the given phone number.'
        );
        return null;
      }

      return rows[0];
    } catch (error) {
      await handleError('Error fetching instance details:', error);
      return null;
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // Function to get the message limit status of a specific WhatsApp number
  getMessageLimitStatus: async (phoneNumber) => {
    logger.info(
      `[getMessageLimitStatus] Fetching message limit status for phone number: ${phoneNumber}`
    );

    const connection = await getConnection(); // Get a connection from the pool
    try {
      const query = `
        SELECT message_count, daily_limit, last_reset_date
        FROM whatsapp_tracking
        WHERE phone_number = ?
      `;
      const [results] = await connection.query(query, [phoneNumber]);

      if (results.length === 0) {
        await handleError('Tracking data not found for this phone number');
      }

      const { message_count, daily_limit, last_reset_date } = results[0];
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

      if (last_reset_date !== today) {
        await connection.query(
          'UPDATE whatsapp_tracking SET message_count = 0, last_reset_date = ? WHERE phone_number = ?',
          [today, phoneNumber]
        );

        return { message_count: 0, daily_limit };
      }

      return { message_count, daily_limit };
    } catch (error) {
      await handleError(
        `[getMessageLimitStatus] Error fetching message limit status for phone number: ${phoneNumber}`,
        error
      );
      return null;
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // Function to update the WhatsApp tracking
  updateWhatsAppTracking: async (phoneNumber, count = 1) => {
    const connection = await getConnection(); // Get a connection from the pool
    try {
      const today = new Date()
        .toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        .split('/')
        .reverse()
        .join('-');

      await connection.query(
        'UPDATE whatsapp_tracking SET message_count = ?, last_reset_date = ? WHERE phone_number = ?',
        [count, today, phoneNumber]
      );

      logger.info(`Message count for phone number: ${phoneNumber} is ${count}`);
    } catch (error) {
      await handleError(
        `[updateWhatsAppTracking] Error updating message count for phone number: ${phoneNumber}`,
        error
      );
      return null;
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },
};

module.exports = waTrackingRepository;
