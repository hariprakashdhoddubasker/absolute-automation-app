// src/repositories/nurtureScheduleRepository.js
const { getConnection } = require('../config/db');
const { handleError } = require('../utils/responseHelpers');
const logger = require('../utils/logger');

const nurtureScheduleRepository = {
  // Insert a scheduled nurture message into the nurture_schedule table
  scheduleNurtureMessage: async ({
    enquiryId,
    name,
    number,
    message,
    scheduledDate,
    priority,
  }) => {
    const connection = await getConnection();
    try {
      const query = `INSERT INTO nurture_schedule (enquiry_id, name, number, message, scheduled_date, priority) VALUES (?, ?, ?, ?, ?, ?)`;
      const params = [
        enquiryId ?? null,
        name ?? 'No Name',
        number ?? 'No Number',
        message ?? 'No Message',
        scheduledDate ?? new Date().toISOString().split('T')[0],
        priority ?? 'low',
      ];

      if (params.includes(undefined)) {
        logger.error(
          'Undefined value detected in params in scheduleNurtureMessage:',
          params
        );
        return; // Exit the function early to avoid execution with undefined values
      }

      await connection.execute(query, params);
    } catch (error) {
      await handleError('Error scheduling nurture message', error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  // Get all nurture messages scheduled for a specific date with a status of 'pending' and optional priority
  getScheduledMessagesForDate: async (date, priority = null) => {
    const connection = await getConnection();
    let query = `SELECT * FROM nurture_schedule WHERE scheduled_date = ? AND status = 'pending'`;
    const params = [date];

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    try {
      const [rows] = await connection.execute(query, params); // Use execute to get the rows
      return rows;
    } catch (error) {
      await handleError('Error fetching scheduled nurture messages:', error);
    } finally {
      connection.release();
    }
  },

  // Mark a nurture message as 'sent' in the nurture_schedule table
  markMessageAsSent: async (scheduleId) => {
    const connection = await getConnection();
    const query = `UPDATE nurture_schedule SET status = 'sent' WHERE id = ?`;
    try {
      await connection.execute(query, [scheduleId]);
    } catch (error) {
      await handleError('Error marking message as sent', error);
    } finally {
      connection.release();
    }
  },

};

module.exports = nurtureScheduleRepository;
