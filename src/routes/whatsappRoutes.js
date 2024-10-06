// src/routes/whatsappRoutes.js
const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const validateAccessToken = require('../middlewares/validateAccessToken');

// Route to send either a text or a media message
router.post(
  '/send-message',
  validateAccessToken,
  whatsappController.sendWhatsappMessage
);

// Route to send bulk WhatsApp messages
router.post(
  '/send-queued-messages',
  validateAccessToken,
  whatsappController.sendQueuedWhatsAppMessages
);

router.post(
  '/create-message-queue',
  whatsappController.createMessageQueueEntries
);
module.exports = router;
