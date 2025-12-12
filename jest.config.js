/**
 * Jest Configuration for Node.js HTTP Server Test Suite
 * 
 * This configuration file defines the testing environment, coverage thresholds,
 * test file patterns, and reporting options for testing the server.js HTTP server.
 * 
 * Usage:
 *   npm test           - Run all tests with coverage
 *   npm run test:watch - Run tests in watch mode
 *   npm run test:ci    - Run tests for CI environment
 * 
 * Coverage Requirements:
 *   - Lines: 90% minimum
 *   - Functions: 100%
 *   - Branches: 100%
 *   - Statements: 90% minimum
 */

module.exports = {
  // Use Node.js test environment for HTTP server testing
  // This ensures proper handling of Node.js APIs and async operations
  testEnvironment: 'node',

  // Pattern for locating test files
  // Matches all .test.js files within the __tests__ directory and subdirectories
  testMatch: ['**/__tests__/**/*.test.js'],

  // Directory where Jest stores coverage reports
  // Reports include text, lcov, and HTML formats for CI/CD integration
  coverageDirectory: 'coverage',

  // Coverage thresholds that must be met for tests to pass
  // These enforce code quality standards across the codebase
  coverageThreshold: {
    // Global thresholds apply to all covered files
    global: {
      branches: 100,    // All conditional branches must be tested
      functions: 100,   // All functions must be called during tests
      lines: 90,        // 90% of lines must be executed
      statements: 90    // 90% of statements must be executed
    },
    // File-specific thresholds for the main server module
    './server.js': {
      branches: 100,    // All branches in server.js must be covered
      functions: 100,   // All functions in server.js must be tested
      lines: 90,        // 90% line coverage for server.js
      statements: 90    // 90% statement coverage for server.js
    }
  },

  // Enable verbose output for detailed test results during development
  // Shows individual test names and their pass/fail status
  verbose: true,

  // Specify which files to include in coverage analysis
  // Excludes test files and node_modules from coverage metrics
  collectCoverageFrom: [
    'server.js',           // Include main server file
    '!**/node_modules/**', // Exclude dependencies
    '!**/__tests__/**'     // Exclude test files themselves
  ],

  // Default timeout for each test in milliseconds
  // Individual tests can override this with a second argument to it()
  testTimeout: 5000,
  
  // Force Jest to exit after all tests complete
  // This prevents hanging due to open handles
  forceExit: true
};
