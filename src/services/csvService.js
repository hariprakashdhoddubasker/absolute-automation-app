// src/services/csvService.js
const fs = require('fs');
const csv = require('csv-parser');
const logger = require('../utils/logger');

const readCSV = (input) => {
  return new Promise((resolve, reject) => {
    const data = [];
    
    // Check if input is a stream (for URL) or a file path
    const stream = (typeof input === 'string') ? fs.createReadStream(input) : input;

    stream
      .pipe(csv())
      .on('data', (row) => {
        data.push(row); // Push each row object directly to the data array
      })
      .on('end', () => {
        logger.info('CSV file successfully processed');
        resolve(data); // Resolve with the array of objects
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

module.exports = { readCSV };
