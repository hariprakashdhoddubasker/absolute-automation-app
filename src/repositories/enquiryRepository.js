// src/repositories/enquiryRepository.js

const { getConnection } = require('../config/db');
const { handleError } = require('../utils/responseHelpers');

const EnquiryRepository = {
  create: async (data, callback) => {
    const connection = await getConnection(); // Get a connection from the pool

    try {
      const query = `
        INSERT INTO enquiries 
        (name, email, phone, dob, gender, address, enquiry_for, followup_date, type, status, source, remarks, lead_generated_date, branch_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Execute the query with the provided data
      const [results] = await connection.query(query, [
        data.name,
        data.email || null,
        data.phone,
        data.dob || null,
        data.gender || null,
        data.address || null,
        data.enquiry_for || null,
        data.followup_date || null,
        data.type || null,
        data.status || null,
        data.source || null,
        data.remarks || null,
        data.lead_generated_date,
        data.branch_id,
      ]);

      callback(null, results); // Pass the results to the callback on success
    } catch (error) {
      await handleError('[create] Error inserting data into enquiries:', error);
      callback(error, null); // Ensure callback is called in case of an exception
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // New bulk record creation method
  bulkCreate: async (dataArray, callback) => {
    const connection = await getConnection(); // Get a connection from the pool

    try {
      const query = `
        INSERT INTO enquiries 
        (name, email, phone, dob, gender, address, enquiry_for, followup_date, type, status, source, remarks, lead_generated_date, branch_id) 
        VALUES ?
      `;

      // Prepare a 2D array for bulk insertion
      const values = dataArray.map((data) => [
        data.name,
        data.email || null,
        data.phone,
        data.dob || null,
        data.gender || null,
        data.address || null,
        data.enquiry_for || null,
        data.followup_date || null,
        data.type || null,
        data.status || null,
        data.source || null,
        data.remarks || null,
        data.lead_generated_date,
        data.branch_id,
      ]);

      // Execute the bulk insert query
      const [results] = await connection.query(query, [values]);

      callback(null, results); // Pass the results to the callback on success
    } catch (error) {
      await handleError(
        '[bulkCreate] Error inserting bulk data into enquiries:',
        error
      );
      callback(error, null); // Ensure callback is called in case of an exception
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // Fetch enquiry numbers where the status is either NULL or an empty string
  getEnquiryNumbers: async (callback) => {
    const connection = await getConnection(); // Get a connection from the pool

    try {
      const query =
        'SELECT name, phone FROM enquiries WHERE status IS NULL OR status = ""';

      // Execute the query to fetch name and phone of enquiries with specific statuses
      // Execute the query to fetch name and phone of enquiries with specific statuses
      const [results] = await connection.query(query);

      // Map through the results to get an array of objects with both name and phone
      const enquiryNumbers = results.map((row) => ({
        name: row.name,
        phone: row.phone,
      }));
      callback(null, enquiryNumbers); // Pass the results to the callback on success
    } catch (error) {
      await handleError(
        '[getEnquiryNumbers] Error fetching enquiry numbers:',
        error
      );
      callback(error, null); // Ensure callback is called in case of an exception
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // Fetch all enquiry phone numbers
  getAllEnquiryPhoneNumbers: async () => {
    const connection = await getConnection(); // Get a connection from the pool

    try {
      const query = 'SELECT phone FROM enquiries';
      // Execute the query to fetch all phone numbers from the enquiries table
      const [results] = await connection.query(query);

      // Ensure results is an array and map to extract phone numbers
      const phoneNumbers = results.map((row) => row.phone);
      return phoneNumbers; // Resolve the promise with the results
    } catch (error) {
      await handleError('[getAllEnquiryPhoneNumbers] Unexpected error:', error);
      throw error; // Reject the promise with the error
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },

  // Fetch all enquiry contacts (name and phone)
  getEnquiryNameAndContacts: async () => {
    const connection = await getConnection(); // Get a connection from the pool

    try {
      const query = 'SELECT name, phone, branch_id FROM enquiries';
      // Execute the query to fetch name and phone from the enquiries table
      const [results] = await connection.query(query);

      return results; // Resolve the promise with the results
    } catch (error) {
      await handleError('[getEnquiryNameAndContacts] Unexpected error:', error);
      throw error; // Reject the promise with the error
    } finally {
      if (connection) connection.release(); // Release the connection back to the pool
    }
  },
};

module.exports = EnquiryRepository;
