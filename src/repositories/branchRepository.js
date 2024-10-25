// src/repositories/branchRepository.js
const { getConnection } = require('../config/db');
const { handleError } = require('../utils/responseHelpers');

const BranchRepository = {
  getBranchIdByName: async (branchName) => {
    let connection;

    try {
      connection = await getConnection();
      const query = 'SELECT branch_id FROM branches WHERE branch_name = ?';
      const [results] = await connection.query(query, [branchName]);

      if (results.length > 0) {
        return results[0].branch_id;
      } else {
        return null;
      }
    } catch (error) {
      await handleError('[getBranchIdByName] Error fetching branch ID:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },
};

module.exports = BranchRepository;