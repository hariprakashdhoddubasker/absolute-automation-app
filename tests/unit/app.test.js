// tests/integration/app.test.js

jest.mock('../../src/services/whatsappMessagingService', () => ({
  sendMessageToManagement: jest.fn(),
  // Mock other methods if necessary
}));

const request = require('supertest');
const app = require('../../app'); // Adjust the path based on the location of your app.js
const db = require('../../src/config/db'); // Import your database connection

describe('App Initialization', () => {
  // Suppress console logs during tests to keep the output clean
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {}); // Suppress logger.info
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress handleError
  });

  // Close the database connection after all tests are run
  afterAll(async () => {
    if (db && db.close) {
      await db.close(); // Properly close the database connection using the new close method
    }
    jest.restoreAllMocks(); // Restore any mocks used in the tests
  });

  it('should respond with a welcome message at the root route', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('This is an automation App!');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/nonexistent-route');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Not Found', // Adjust based on actual 404 response
    });
  });

  it('should handle invalid JSON with a 400 status', async () => {
    const response = await request(app)
      .post('/api/enquiries') // Adjust to an actual route that accepts JSON
      .set('Content-Type', 'application/json')
      .send('{"invalidJson":'); // Sending malformed JSON

    expect(response.status).toBe(400);
    expect(response.text).toBe('Invalid JSON format.');
  });
});
