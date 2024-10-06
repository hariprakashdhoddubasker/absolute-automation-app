// src/utils/validationHelpers.js

/**
 * Validates required fields in a request body.
 * @param {object} fields - An object where the keys are field names and values are the values to validate.
 * @param {object} res - The Express response object.
 * @returns {boolean} - Returns true if all fields are valid, otherwise sends a response and returns false.
 */
const validateRequiredFields = (fields, res) => {
    for (const [key, value] of Object.entries(fields)) {
      if (!value) {
        res.status(400).json({
          success: false,
          message: `Missing required field: ${key}.`,
        });
        return false;
      }
    }
    return true;
  };
  
  module.exports = { validateRequiredFields };
  