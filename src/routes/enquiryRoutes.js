// src/routes/enquiryRoutes.js
const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');

router.post('/', enquiryController.createEnquiry);

// Route to process CSV and bulk insert enquiries
router.post('/upload-csv', enquiryController.UploadCsvEnquires);

module.exports = router;