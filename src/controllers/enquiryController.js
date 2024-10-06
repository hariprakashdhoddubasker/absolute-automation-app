// src/constrollers/enquiryController.js
const enquiryService = require('../services/enquiryService');
const { validateRequiredFields } = require('../utils/validationHelpers');
const { successResponse, errorResponse, handleError } = require('../utils/responseHelpers');
const logger = require('../utils/logger');

exports.createEnquiry = (req, res) => {
  const { name, phone, lead_generated_date, branch } = req.body;

  if (
    !validateRequiredFields({ name, phone, lead_generated_date, branch }, res)
  )
    return;

  const {
    email = null,
    dob = null,
    gender = null,
    address = null,
    enquiry_for = null,
    followup_date = null,
    type = null,
    status = null,
    source = null,
    remarks = null,
  } = req.body;

  // Prepare the enquiry data object
  const enquiryData = {
    name,
    email,
    phone,
    dob,
    gender,
    address,
    enquiry_for,
    followup_date,
    type,
    status,
    source,
    remarks,
    lead_generated_date,
    branch,
  };

  // Delegate the creation logic to the service layer
  enquiryService.createEnquiry(enquiryData, (err, results) => {
    if (err) {
      return errorResponse(res, 'Error inserting enquiry', 500, err);
    }
    logger.info("Enquiry submitted successfully");
    return successResponse(res, results, 'Enquiry submitted successfully', 201);    
  });
};

exports.UploadCsvEnquires = async (req, res) => {
  try {
    const { csvFilePath } = req.body;

    if (!csvFilePath) {
      await handleError('CSV file URL is required.');
      return null;
    }

    // Delegate the main logic to the service layer
    await enquiryService.processCSVAndInsertEnquiries(csvFilePath);

    return successResponse(
      res,
      null,
      'Enquiries processed and inserted successfully',
      201
    );
  } catch (error) {
    return errorResponse(
      res,
      'Error processing CSV & inserting enquiries',
      500,
      error
    );
  }
};
