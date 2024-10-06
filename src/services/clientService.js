const db = require('../config/db');

const clientService = {
  // Function to fetch client contacts
  getClientContacts: async () => {
    const [results] = await db.query('SELECT name, phone FROM clients'); // Adjust this query based on your clients table structure
    return results;
  },
};

module.exports = clientService;