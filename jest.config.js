  module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup/env.js'],
    coverageThreshold: {
      global: {
        branches: 83,
        functions: 97,
        lines: 95,
        statements: 95,
      },
    },
  };