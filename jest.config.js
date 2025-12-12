module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 90,
      statements: 90
    },
    './server.js': {
      branches: 100,
      functions: 100,
      lines: 90,
      statements: 90
    }
  },
  verbose: true,
  collectCoverageFrom: [
    'server.js',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  testTimeout: 5000
};
