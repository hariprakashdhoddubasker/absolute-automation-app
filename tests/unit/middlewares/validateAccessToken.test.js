// tests/middlewares/validateAccessToken.test.js

const validateAccessToken = require('../../../src/middlewares/validateAccessToken');
const { errorResponse } = require('../../../src/utils/responseHelpers');

// Mock the errorResponse function
jest.mock('../../../src/utils/responseHelpers', () => ({
  errorResponse: jest.fn(),
}));

describe('Validate Access Token Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      headers: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Set the expected access token
    process.env.APP_ACCESS_TOKEN = 'expected_test_token';
  });

  /**
   * Test Case: Token is provided and matches expected token
   */
  it('should call next when provided token matches expected token in header', () => {
    // Arrange
    req.headers['authorization'] = 'expected_test_token';

    // Act
    validateAccessToken(req, res, next);

    // Assert
    expect(next).toHaveBeenCalled();
    expect(errorResponse).not.toHaveBeenCalled();
  });

  /**
   * Test Case: Token is provided in body and matches expected token
   */
  it('should call next when provided token matches expected token in body', () => {
    // Arrange
    req.body.accessToken = 'expected_test_token';

    // Act
    validateAccessToken(req, res, next);

    // Assert
    expect(next).toHaveBeenCalled();
    expect(errorResponse).not.toHaveBeenCalled();
  });

  /**
   * Test Case: Provided token does not match expected token
   */
  it('should respond with 401 when provided token does not match expected token', () => {
    // Arrange
    req.headers['authorization'] = 'invalid_token';

    // Act
    validateAccessToken(req, res, next);

    // Assert
    expect(errorResponse).toHaveBeenCalledWith(res, 'Invalid access token.', 401);
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * Test Case: No token is provided
   */
  it('should respond with 401 when no token is provided', () => {
    // Arrange
    // No token in headers or body

    // Act
    validateAccessToken(req, res, next);

    // Assert
    expect(errorResponse).toHaveBeenCalledWith(res, 'Invalid access token.', 401);
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * Test Case: Expected token is not set in environment
   */
  it('should respond with 500 when expected token is not set', () => {
    // Arrange
    delete process.env.APP_ACCESS_TOKEN; // Remove expected token
    req.headers['authorization'] = 'some_token';

    // Act
    validateAccessToken(req, res, next);

    // Assert
    expect(errorResponse).toHaveBeenCalledWith(res, 'Expected access token is not set on the server.', 500);
    expect(next).not.toHaveBeenCalled();
  });
});
