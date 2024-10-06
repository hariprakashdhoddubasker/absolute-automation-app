// src/routes/googleDriveRoutes.js
const express = require('express');
const googleDriveController = require('../controllers/googleDriveController');
const router = express.Router();

router.get('/auth', googleDriveController.startAuthFlow);
router.get('/oauth2callback', googleDriveController.handleOAuthCallback);
router.post('/daily-call-report', googleDriveController.generateDailyCallReport);

module.exports = router;
