// src/repositories/tokenRepository.js

const { getConnection } = require('../config/db'); // Import database connection
const { convertUnixToMySQLDateTime } = require('../utils/dateTimeUtils');
const logger = require('../utils/logger');
const { handleError } = require('../utils/responseHelpers');

const tokenRepository = {
  // Store tokens in the database
  storeTokens: async (userId, userName, tokens, tokenType) => {
    const { access_token, refresh_token, expiry_date } = tokens;
    const connection = await getConnection(); // Get a connection from the pool

    try {
      // Convert Unix timestamp in milliseconds to MySQL DATETIME format using the utility function
      const expiryDateTime = convertUnixToMySQLDateTime(expiry_date);

      const query = `
      INSERT INTO tokens (user_id, user_name, access_token, refresh_token, expiry_date, token_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        access_token = VALUES(access_token),
        refresh_token = VALUES(refresh_token),
        expiry_date = VALUES(expiry_date),
        user_name = VALUES(user_name),
        updated_at = NOW();
    `;

      await connection.query(query, [
        userId,
        userName,
        access_token,
        refresh_token,
        expiryDateTime,
        tokenType,
      ]);
      logger.info(
        '[storeTokens] Tokens and user information stored/updated successfully in the database.'
      );
    } catch (error) {
      await handleError(
        '[storeTokens] Error storing tokens and user information in the database:',
        error
      );
      throw error;
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // Retrieve tokens from the database by user ID and token type
  getTokens: async (userId, tokenType) => {
    const connection = await getConnection(); // Get a connection from the pool

    try {
      const query = `
        SELECT access_token, refresh_token, expiry_date
        FROM tokens
        WHERE user_id = ? AND token_type = ?
        LIMIT 1;
      `;
      const [rows] = await connection.query(query, [userId, tokenType]);

      // Check if rows are defined and have results
      if (rows && rows.length > 0) {
        return rows[0]; // Return the first row if tokens are found
      } else {
        await handleError(
          `[getTokens] No tokens found for user ID ${userId} and token type ${tokenType}.`
        );
      }
    } catch (error) {
      await handleError(
        '[getTokens] Error retrieving tokens from the database:',
        error
      );
      throw error;
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // Delete tokens by user ID and token type
  deleteTokens: async (userId, tokenType) => {
    const connection = await getConnection(); // Get a connection from the pool

    try {
      const query = `
        DELETE FROM tokens
        WHERE user_id = ? AND token_type = ?;
      `;

      await connection.query(query, [userId, tokenType]);
      logger.info(
        `[deleteTokens] Tokens deleted successfully for user ID ${userId} and token type ${tokenType}.`
      );
    } catch (error) {
      await handleError(
        '[deleteTokens] Error deleting tokens from the database:',
        error
      );
      throw error;
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },
};

module.exports = tokenRepository;
