// src/config/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
const { handleError } = require('../utils/responseHelpers');

let pool;

// Function to create a MySQL connection pool
const createPool = () => {
  if (!pool) {
    // Create the pool only if it hasn't been created yet
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4', // Supports emojis and special characters
      connectTimeout: 10000, // 10 seconds      
      connectionLimit: 10,
      waitForConnections: true,
    });
    logger.info('MySQL pool created.');
  }
  return pool;
};

// Function to get a connection from the pool
const getConnection = async () => {
  try {
    const pool = createPool();
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    await handleError('Error getting connection from pool', error);
  }
};


// Function to close the connection pool
const closePool = async () => {
  if (!pool) {
    logger.info('No pool to close.');
    return; // No pool to close
  }

  try {
    await pool.end();
    logger.info('MySQL pool closed.');
    pool = null; // Reset the pool after closing
  } catch (error) {
    await handleError('Error closing the MySQL pool', error);
  }
};

if (process.env.NODE_ENV !== 'test') {
  // Gracefully close the pool when the process exits
  process.on('exit', async () => {
    try {
      await closePool();
    } catch (error) {
      await handleError('Error while closing pool on process exit', error);
    }
  });
}

module.exports = { getConnection, closePool, createPool };
