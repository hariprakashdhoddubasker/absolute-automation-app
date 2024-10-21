// Import required modules
const request = require('supertest');
const app = require('../../app');
const { getConnection, closePool } = require('../../src/config/db');

describe('POST /api/enquiries', () => {
  const enquiryPhone = '9999999999'; // Use a constant phone number for the test

  // Clean up the database connection pool after all tests are completed
  afterAll(async () => {
    await closePool(); // Close the pool to avoid hanging connections
  });

  it('should insert the enquiry into the database with today’s lead_generated_date in DD-MM-YYYY format and check created_at', async () => {
    // Get today's date in the "DD-MM-YYYY" format
    const today = new Date()
      .toLocaleDateString('en-GB')
      .replace(/\//g, '-'); // "DD-MM-YYYY" format

    // Define the payload to send to the API
    const enquiryData = {
      name: 'Hari',
      phone: enquiryPhone,
      lead_generated_date: today,
      branch: 'RKR',
    };

    // Make a POST request to the endpoint
    const res = await request(app).post('/api/enquiries').send(enquiryData);

    // Check the response
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');

    let insertedId;

    // Retrieve a connection from the pool and verify the entry in the database
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM enquiries WHERE phone = ?',
        [enquiryData.phone]
      );

      // Ensure the record exists
      expect(rows.length).toBe(1);
      const dbEntry = rows[0];

      // Store the id for deletion
      insertedId = dbEntry.id;

      // Validate the main data fields
      expect(dbEntry.name).toBe(enquiryData.name);
      expect(dbEntry.phone).toBe(enquiryData.phone);

      const dbLeadGeneratedDate = dbEntry.lead_generated_date
        .toLocaleDateString('en-GB')
        .replace(/\//g, '-'); // "DD-MM-YYYY" format

      expect(dbLeadGeneratedDate).toBe(enquiryData.lead_generated_date);
      expect(dbEntry.branch).toBe(enquiryData.branch);

      // Validate created_at timestamp is close to the current time
      const createdAt = new Date(dbEntry.created_at);
      const now = new Date();
      const timeDiff = Math.abs(now - createdAt) / 1000; // Convert ms to seconds
      expect(timeDiff).toBeLessThan(120); // Acceptable range of 2 minutes
    } finally {
      // Delete the inserted record based on the captured id
      if (insertedId) {
        await connection.execute('DELETE FROM enquiries WHERE id = ?', [insertedId]);
      }
      // Release the connection back to the pool
      connection.release();
    }
  });
});
