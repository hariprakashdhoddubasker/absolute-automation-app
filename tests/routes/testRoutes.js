// tests/routes/testRoutes.js
const express = require('express');
const router = express.Router();

// Route to simulate an internal server error
router.get('/error', (req, res, next) => {
  next(new Error('Internal server error'));
});

module.exports = router;