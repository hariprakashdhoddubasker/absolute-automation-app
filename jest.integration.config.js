// jest.integration.config.js
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: [
      '**/tests/integration/**/*.test.js', // Only integration tests
    ],
    collectCoverage: true,
    coverageDirectory: 'coverage/integration',
    coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup/env.js'],
  };
  