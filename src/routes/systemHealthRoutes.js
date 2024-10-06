// src/routes/systemHealthRoutes.js
const express = require('express');
const router = express.Router();
const systemHealthController = require('../controllers/systemHealthController');

// Route to trigger the system health report
router.get('/send-report', systemHealthController.sendSystemHealthReport);

module.exports = router;
