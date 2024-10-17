// tests/integration/server.test.js

const request = require('supertest');
const app = require('../../app'); // Ensure the correct path to app.js
const server = require('../../server'); // Make sure server.js exports the server for testing

describe('Server Tests', () => {
  
  // Ensure the server is running and responds to the root route
  it('should respond with a welcome message at the root route', async () => {
    const response = await request(app).get('/'); // Sending GET request to root
    expect(response.status).toBe(200); // Expect HTTP status 200
    expect(response.text).toBe('This is an automation App!'); // Expect specific response text
  });

  // Optional: Clean up after tests, especially if there are open connections
  afterAll(async () => {
    if (server && server.close) {
      server.close(); // Properly close the server
    }
    const db = require('../../src/config/db');
    if (db && db.close) {
      await db.close();
    }
  });

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
});
