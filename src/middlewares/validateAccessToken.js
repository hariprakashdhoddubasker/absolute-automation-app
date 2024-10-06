// src/middlewares/validateAccessToken.js

/**
 * Middleware to validate access token from the request header or body.
 * Compares the token against the expected token from the environment variables.
 */
const { errorResponse } = require('../utils/responseHelpers');
const validateAccessToken = (req, res, next) => {
  // Access token can be sent in the Authorization header or in the request body
  const tokenFromHeader = req.headers['authorization'];
  const tokenFromBody = req.body.accessToken;

  // The expected access token stored in environment variables
  const expectedToken = process.env.APP_ACCESS_TOKEN;

  if (!expectedToken) {
    return errorResponse(res, 'Expected access token is not set on the server.', 500);
  }
  
  // Check if the provided token matches the expected token
  if (tokenFromHeader === expectedToken || tokenFromBody === expectedToken) {
    // Token is valid, proceed to the next middleware or controller
    return next();
  } else {
    // Token is invalid, send a 401 Unauthorized response
    return errorResponse(res, 'Invalid access token.', 401);
  }
};

module.exports = validateAccessToken;
