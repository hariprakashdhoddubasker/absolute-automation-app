// jest.e2e.config.js
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests/e2e'],
    testMatch: [
      '**/tests/e2e/**/*.test.js', // Only integration tests
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup/env.js'],
  };
  