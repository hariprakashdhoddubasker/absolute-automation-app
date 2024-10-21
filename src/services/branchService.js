// src/services/branchService.js
const branchRepository = require('../repositories/branchRepository');
const { handleError } = require('../utils/responseHelpers');

const branchService = {
  getBranchIdByName: async (branchName) => {
    try {
      return await branchRepository.getBranchIdByName(branchName);
    } catch (error) {
      await handleError('[branchService] Error fetching branch ID:', error);
      throw error;
    }
  },
};

module.exports = branchService;
