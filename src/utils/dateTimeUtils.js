// src/utils/dateTimeUtils.js

/**
 * Converts a Unix timestamp in milliseconds to MySQL DATETIME format.
 * @param {number} unixTimestamp - The Unix timestamp in milliseconds.
 * @returns {string} The MySQL DATETIME formatted string.
 */
const convertUnixToMySQLDateTime = (unixTimestamp) => {
  const date = new Date(unixTimestamp);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Helper function to sleep for a random duration between x and y seconds
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  convertUnixToMySQLDateTime,
  sleep
};
