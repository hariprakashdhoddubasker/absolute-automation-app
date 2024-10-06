// tests/utils/responseHelpers.test.js

// const { successResponse, errorResponse, handleError } = require('../../src/utils/responseHelpers');
// const whatsappMessagingService = require('../../src/services/whatsappMessagingService');
// const logger = require('../../src/utils/logger');

// jest.mock('../../src/services/whatsappMessagingService');
// jest.mock('../../src/utils/logger');

// describe('Response Helpers', () => {
//   let res;

//   beforeEach(() => {
//     Mock the Express response object
//     res = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn(),
//     };

//     Clear mocks before each test
//     jest.clearAllMocks();
//   });

//   /**
//    * Test Suite for successResponse function
//    * This suite tests sending successful responses.
//    */
//   describe('successResponse', () => {
//     /**
//      * Test Case: Send success response with data and message
//      * Ensures that the response is sent with the correct status code, data, and message.
//      */
//     it('should send a success response with data and message', () => {
//       Arrange
//       const data = { id: 1 };
//       const message = 'Operation successful';
//       const statusCode = 200;

//       Act
//       successResponse(res, data, message, statusCode);

//       Assert
//       expect(res.status).toHaveBeenCalledWith(statusCode);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data,
//         message,
//       });
//     });

//     /**
//      * Test Case: Send success response with default values
//      * Ensures that the response is sent with default status code and message when not provided.
//      */
//     it('should send a success response with default values', () => {
//       Arrange
//       const data = { id: 1 };

//       Act
//       successResponse(res, data);

//       Assert
//       expect(res.status).toHaveBeenCalledWith(200);
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         data,
//         message: 'Operation successful',
//       });
//     });
//   });

//   /**
//    * Test Suite for errorResponse function
//    * This suite tests sending error responses.
//    */
//   describe('errorResponse', () => {
//     /**
//      * Test Case: Send error response with message and status code
//      * Ensures that the response is sent with the correct status code and error message.
//      */
//     it('should send an error response with message and status code', async () => {
//       Arrange
//       const message = 'An error occurred';
//       const statusCode = 500;

//       Act
//       await errorResponse(res, message, statusCode);

//       Assert
//       expect(res.status).toHaveBeenCalledWith(statusCode);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         data: null,
//         message,
//         errors: null,
//       });
//     });

//     /**
//      * Test Case: Send error response with default values
//      * Ensures that the response is sent with default status code and message when not provided.
//      */
//     it('should send an error response with default values', async () => {
//       Act
//       await errorResponse(res);

//       Assert
//       expect(res.status).toHaveBeenCalledWith(500);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         data: null,
//         message: 'An error occurred',
//         errors: null,
//       });
//     });

//     /**
//      * Test Case: Send error response with additional errors
//      * Ensures that additional error details are included when provided.
//      */
//     it('should send an error response with additional errors', async () => {
//       Arrange
//       const message = 'Validation error';
//       const statusCode = 400;
//       const errors = { field: 'This field is required' };

//       Act
//       await errorResponse(res, message, statusCode, errors);

//       Assert
//       expect(res.status).toHaveBeenCalledWith(statusCode);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         data: null,
//         message,
//         errors,
//       });
//     });

//     /**
//      * Test Case: Should not send WhatsApp message or log error
//      * Ensures that errorResponse does not log or send messages.
//      */
//     it('should not send WhatsApp message or log error', async () => {
//       Arrange
//       const message = 'An error occurred';
//       const statusCode = 500;

//       Act
//       await errorResponse(res, message, statusCode);

//       Assert
//       expect(logger.error).not.toHaveBeenCalled();
//       expect(whatsappMessagingService.sendMessageToManagement).not.toHaveBeenCalled();
//       expect(res.status).toHaveBeenCalledWith(statusCode);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         data: null,
//         message,
//         errors: null,
//       });
//     });
//   });

//   /**
//    * Test Suite for handleError function
//    * This suite tests the error handling functionality.
//    */
//   describe('handleError', () => {
//     beforeEach(() => {
//       jest.clearAllMocks();
//     });

//     /**
//      * Test Case: Handle error with default parameters
//      * Ensures that the error is logged correctly with default values.
//      */
//     it('should log error with default parameters', async () => {
//       Act
//       await handleError();

//       Assert
//       expect(logger.error).toHaveBeenCalledWith(
//         'Error: An error occurred',
//         {
//           errorMessage: 'No error message provided',
//           stack: 'No stack trace available',
//         }
//       );
//       expect(whatsappMessagingService.sendMessageToManagement).not.toHaveBeenCalled();
//     });

//     /**
//      * Test Case: Handle error with custom message and error object
//      * Ensures that the error is logged with the provided message and error details.
//      */
//     it('should log error with custom message and error object', async () => {
//       Arrange
//       const message = 'Custom error message';
//       const error = new Error('Something went wrong');

//       Act
//       await handleError(message, error);

//       Assert
//       expect(logger.error).toHaveBeenCalledWith(
//         `Error: ${message}`,
//         {
//           errorMessage: error.message,
//           stack: error.stack,
//         }
//       );
//       expect(whatsappMessagingService.sendMessageToManagement).not.toHaveBeenCalled();
//     });

//     /**
//      * Test Case: Send WhatsApp message in production environment
//      * Ensures that a WhatsApp message is sent when in production and sendToWhatsApp is true.
//      */
//     it('should send WhatsApp message in production environment', async () => {
//       Arrange
//       process.env.NODE_ENV = 'production';
//       const message = 'Production error';
//       const error = new Error('Critical failure');

//       Act
//       await handleError(message, error);

//       Assert
//       expect(logger.error).toHaveBeenCalledWith(
//         `Error: ${message}`,
//         {
//           errorMessage: error.message,
//           stack: error.stack,
//         }
//       );
//       expect(whatsappMessagingService.sendMessageToManagement).toHaveBeenCalledWith(
//         `Error in Node.js App: ${message}: ${error.message}`
//       );

//       Clean up
//       process.env.NODE_ENV = 'test';
//     });

//     /**
//      * Test Case: Do not send WhatsApp message if sendToWhatsApp is false
//      * Ensures that no WhatsApp message is sent when sendToWhatsApp is false.
//      */
//     it('should not send WhatsApp message if sendToWhatsApp is false', async () => {
//       Arrange
//       process.env.NODE_ENV = 'production';
//       const message = 'Error without WhatsApp notification';
//       const error = new Error('Minor issue');

//       Act
//       await handleError(message, error, false);

//       Assert
//       expect(logger.error).toHaveBeenCalled();
//       expect(whatsappMessagingService.sendMessageToManagement).not.toHaveBeenCalled();

//       Clean up
//       process.env.NODE_ENV = 'test';
//     });

//     /**
//      * Test Case: Handle error when WhatsApp message sending fails
//      * Ensures that an error during WhatsApp messaging is handled gracefully without infinite recursion.
//      */
//     it('should handle error when WhatsApp message sending fails', async () => {
//       Arrange
//       process.env.NODE_ENV = 'production';
//       const message = 'Error that causes WhatsApp failure';
//       const error = new Error('Original error');
//       const whatsappError = new Error('WhatsApp API error');

//       whatsappMessagingService.sendMessageToManagement.mockRejectedValue(whatsappError);

//       Act
//       await handleError(message, error);

//       Assert
//       expect(logger.error).toHaveBeenCalledTimes(2);
//       expect(logger.error).toHaveBeenNthCalledWith(
//         1,
//         `Error: ${message}`,
//         {
//           errorMessage: error.message,
//           stack: error.stack,
//         }
//       );
//       expect(logger.error).toHaveBeenNthCalledWith(
//         2,
//         'Error: Failed to send WhatsApp notification',
//         {
//           errorMessage: whatsappError.message,
//           stack: whatsappError.stack,
//         }
//       );
//       expect(whatsappMessagingService.sendMessageToManagement).toHaveBeenCalledTimes(1);

//       Clean up
//       process.env.NODE_ENV = 'test';
//     });

//     /**
//      * Test Case: Throw error in development environment when shouldThrow is true
//      * Ensures that the error is thrown in development or test environments.
//      */
//     it('should throw error in development environment when shouldThrow is true', async () => {
//       Arrange
//       process.env.NODE_ENV = 'development';
//       const message = 'Error to be thrown';
//       const error = new Error('Throw me');

//       Act & Assert
//       await expect(handleError(message, error, true, true)).rejects.toThrow(error);
//       expect(logger.error).toHaveBeenCalled();

//       Clean up
//       process.env.NODE_ENV = 'test';
//     });

//     /**
//      * Test Case: Do not throw error in production environment even when shouldThrow is true
//      * Ensures that the error is not thrown in production environment.
//      */
//     it('should not throw error in production environment even when shouldThrow is true', async () => {
//       Arrange
//       process.env.NODE_ENV = 'production';
//       const message = 'Error that should not be thrown';
//       const error = new Error('Do not throw me');

//       Act
//       await handleError(message, error, true, true);

//       Assert
//       expect(logger.error).toHaveBeenCalled();
//       expect(whatsappMessagingService.sendMessageToManagement).toHaveBeenCalled();
//       No exception should be thrown

//       Clean up
//       process.env.NODE_ENV = 'test';
//     });

//     /**
//      * Test Case: Use default error when none is provided and shouldThrow is true
//      * Ensures that a new error is thrown when no error object is provided.
//      */
//     it('should throw new error when no error object is provided and shouldThrow is true', async () => {
//       Arrange
//       const message = 'No error object provided';

//       Act & Assert
//       await expect(handleError(message, null, true, true)).rejects.toThrow(message);
//       expect(logger.error).toHaveBeenCalled();
//     });

//     /**
//      * Test Case: Handle error with isRecursive flag set to prevent infinite recursion
//      * Ensures that the isRecursive flag prevents additional WhatsApp messages and logging.
//      */
//     it('should not send WhatsApp message or log error when isRecursive is true', async () => {
//       Arrange
//       const message = 'Recursive error';
//       const error = new Error('Recursive issue');

//       Act
//       await handleError(message, error, true, false, true);

//       Assert
//       expect(logger.error).toHaveBeenCalledWith(
//         `Error: ${message}`,
//         {
//           errorMessage: error.message,
//           stack: error.stack,
//         }
//       );
//       expect(whatsappMessagingService.sendMessageToManagement).not.toHaveBeenCalled();
//     });
//   });
// });
