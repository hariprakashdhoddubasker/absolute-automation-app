// src/repositories/whatsappMessageQueueRepository.js

const { getConnection } = require('../config/db');
const logger = require('../utils/logger');
const { handleError } = require('../utils/responseHelpers');

const whatsappMessageQueueRepository = {
  // Function to insert entries into the whatsapp_message_queue table
  insertQueueEntries: async (entries, priority = 'normal') => {
    if (!entries.length) {
      logger.info('No entries to insert.');
      return;
    }

    const connection = await getConnection(); // Get a connection from the pool

    try {
      const values = entries.map((entry) => [
        entry.name,
        entry.phone,
        entry.message,
        entry.media_url,
        entry.filename,
        entry.status,
        priority,
      ]);

      // Execute the bulk insert query
      await connection.query(
        'INSERT INTO whatsapp_message_queue (name, phone, message, media_url, filename, status, priority) VALUES ?',
        [values]
      );

      logger.info('Queue entries inserted successfully.');
    } catch (error) {
      await handleError(
        '[insertQueueEntries] Error inserting queue entries:',
        error
      );
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // Fetch high priority pending messages within the limit
  getHighPriorityQueuedMessages: async (limit = null) => {
    const connection = await getConnection(); // Get a connection from the pool

    try {
      let query = `
      SELECT * FROM whatsapp_message_queue
      WHERE status = 'pending' AND priority = 'high'
      ORDER BY created_at ASC
    `;

      const params = [];
      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
      }

      const [rows] = await connection.query(query, params);
      return rows;
    } catch (error) {
      await handleError(
        '[getHighPriorityMessages] Error fetching high priority messages:',
        error
      );
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // Fetch pending messages with specific priority and limit
  getPendingQueuedMessagesWithLimit: async (priority, limit) => {
    const connection = await getConnection(); // Get a connection from the pool

    try {
      const query = `
      SELECT * FROM whatsapp_message_queue
      WHERE status = 'pending' AND priority = ?
      ORDER BY created_at ASC
      LIMIT ?
    `;
      const params = [priority, limit];

      const [rows] = await connection.query(query, params);
      return rows;
    } catch (error) {
      await handleError(
        '[getPendingMessagesWithLimit] Error fetching pending messages:',
        error
      );
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // Delete a message from the queue after processing
  deleteMessageFromQueue: async (id) => {
    const connection = await getConnection(); // Get a connection from the pool
    try {
      const query = `DELETE FROM whatsapp_message_queue WHERE id = ?`;
      await connection.query(query, [id]);
      logger.info(`Message with ID ${id} deleted from queue.`);
    } catch (error) {
      await handleError(
        '[deleteMessageFromQueue] Error deleting message from queue:',
        error
      );
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },
};

module.exports = whatsappMessageQueueRepository;
