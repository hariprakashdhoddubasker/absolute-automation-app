// app.js
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./src/utils/logger');
const enquiryRoutes = require('./src/routes/enquiryRoutes');
const whatsappRoutes = require('./src/routes/whatsappRoutes');
const googleDriveRoutes = require('./src/routes/googleDriveRoutes');
const systemHealthRoutes = require('./src/routes/systemHealthRoutes'); 
const errorHandlerMiddleware = require('./src/middlewares/errorHandlerMiddleware');

require('dotenv').config(); // Load environment variables

const app = express();

// Security middleware
app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', // Use environment variable for allowed origins
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('This is an automation App!');
});

// Use /api as the base path for your routes
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/google-drive', googleDriveRoutes);
app.use('/api/system-health', systemHealthRoutes); 

// **Register test routes only during testing**
if (process.env.NODE_ENV === 'test') {
  const testRoutes = require('./tests/unit/routes/testRoutes');
  app.use(testRoutes);
}

// Custom 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

// Use the error handler middleware for any errors
app.use(errorHandlerMiddleware);

module.exports = app;
