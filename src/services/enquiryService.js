// src/services/enquiryService.js
const axios = require('axios');
const csvService = require('../services/csvService');
const enquiryRepository = require('../repositories/enquiryRepository');
const enquiryNurtureService = require('./nurtureScheduleService');
const branchService = require('./branchService');
const { handleError } = require('../utils/responseHelpers');
const moment = require('moment');
const logger = require('../utils/logger');

const enquiryService = {
  // Service function to create an enquiry
  createEnquiry: async (enquiryData, callback) => {
    // Get branch ID from branch name
    const branchId = await branchService.getBranchIdByName(enquiryData.branch);
    if (!branchId) {
      return callback(new Error('Invalid branch id'));
    }
    // Extract necessary fields and format the date
    const { lead_generated_date } = enquiryData;
    const formattedDate = moment(lead_generated_date, 'DD-MM-YYYY').format(
      'YYYY-MM-DD'
    );

    // Prepare the data object with formatted date
    const enquiry = {
      ...enquiryData,
      lead_generated_date: formattedDate,
      branch_id: branchId,
    };

    // Insert the new enquiry into the database
    enquiryRepository.create(enquiry, async (err, result) => {
      if (err) {
        return callback(err);
      }

      // Use the insertId from the result to create the newEnquiry object
      const newEnquiry = { ...enquiry, id: result.insertId };

      // Schedule nurture messages after creating the enquiry
      await enquiryNurtureService.scheduleNurtureMessages(newEnquiry);

      callback(null, newEnquiry);
    });
  },

  //Main function for processing the CSV and inserting enquiries
  processCSVAndInsertEnquiries: async (csvFilePath) => {
    // Step 1: Download and parse the CSV
    const rawData = await downloadAndParseCSV(csvFilePath);

    // Step 2: Process the data and filter out duplicates
    const processedData = await processEnquiryData(rawData);

    // Step 3: Insert the processed data into the database
    await bulkInsertEnquiries(processedData);
  },
};

// Function to download and parse the CSV
const downloadAndParseCSV = async (csvFilePath) => {
  try {
    const response = await axios.get(csvFilePath, { responseType: 'stream' });

    if (response.status !== 200) {
      await handleError('Failed to fetch the CSV file.');
    }

    // Parse the CSV data using the csvService
    return await csvService.readCSV(response.data);
  } catch (error) {
    await handleError('Error downloading or parsing CSV:', error);
    throw error;
  }
};

// Function to process and filter enquiry data
const processEnquiryData = async (rawData) => {
  try {
    // Fetch existing phone numbers to avoid duplicates
    const existingPhoneNumbers =
      await enquiryRepository.getAllEnquiryPhoneNumbers();
    const uniqueEnquiries = new Map();

    rawData.forEach((row) => {
      const name = row.name ? sanitizeString(row.name) : '';
      const phone = row.phone ? row.phone.replace(/\D/g, '').slice(-10) : '';

      // Validate that the phone number is exactly 10 digits and not already in the database
      if (/^\d{10}$/.test(phone) && !existingPhoneNumbers.includes(phone)) {
        if (!uniqueEnquiries.has(phone)) {
          // Check for in-list duplicates
          const isValidDate = moment(
            row.lead_generated_date,
            'DD-MM-YYYY',
            true
          ).isValid();
          const formattedDate = isValidDate
            ? moment(row.lead_generated_date, 'DD-MM-YYYY').format('YYYY-MM-DD')
            : moment().format('YYYY-MM-DD');

          const branch = row.branch ? row.branch.trim() : 'SPT';

          uniqueEnquiries.set(phone, {
            name,
            phone,
            lead_generated_date: formattedDate,
            email: row.email || null,
            dob: row.dob || null,
            gender: row.gender || null,
            address: row.address || null,
            enquiry_for: row.enquiry_for || null,
            followup_date: row.followup_date || null,
            type: row.type || null,
            status: row.status || null,
            source: row.source || null,
            remarks: row.remarks || null,
            branch,
          });
        }
      }
    });

    // Convert the Map to an array for bulk insertion
    return Array.from(uniqueEnquiries.values());
  } catch (error) {
    await handleError('Error processing enquiry data:', error);
    throw error;
  }
};

// Function to bulk insert enquiries
const bulkInsertEnquiries = async (processedData) => {
  try {
    // If there are no records to insert, return early
    if (!processedData || processedData.length === 0) {
      logger.info('No data to insert. Exiting bulk insertion process.');
      return; // Exit the function if processedData is empty
    }

    return await new Promise((resolve, reject) => {
      enquiryRepository.bulkCreate(processedData, (err, results) => {
        if (err) {
          console.error('Error inserting enquiries:', err.stack);
          return reject(err);
        }
        resolve(results);
      });
    });
  } catch (error) {
    await handleError('Error during bulk insertion:', error);
    throw error;
  }
};

// Utility function to sanitize strings
const sanitizeString = (str) => {
  return str.replace(/[^\x20-\x7E]/g, ''); // Replace non-ASCII characters with an empty string
};
module.exports = enquiryService;
