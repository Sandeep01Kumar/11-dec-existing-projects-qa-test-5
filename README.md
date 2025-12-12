# hao-backprop-test

Test project for backprop integration.

> **Historical Note:** This repository was originally created as a frozen test fixture with the directive "Do not touch!" Testing infrastructure has been added per explicit user request to create comprehensive unit tests for the server.js file.

## Overview

A simple Node.js HTTP server that responds with "Hello, World!" to all requests. This project serves as an integration test fixture for the Blitzy platform.

## Testing

### Testing Framework

This project uses **Jest 29.7.0** as the primary testing framework, along with **supertest 7.0.0** for HTTP assertion testing. Jest was chosen for its:

- Zero-configuration setup for Node.js projects
- Built-in assertions, mocking, and code coverage
- Extensive ecosystem and active maintenance
- Full compatibility with Node.js 20.x

### Test Execution Commands

| Command | Purpose | Description |
|---------|---------|-------------|
| `npm test` | Run all tests with coverage | Standard test execution with coverage report |
| `npm run test:watch` | Watch mode | Runs tests on file changes during development |
| `npm run test:ci` | CI environment | Sequential execution optimized for CI/CD pipelines |

```bash
# Run all tests with coverage report
npm test

# Run tests in watch mode for development
npm run test:watch

# Run tests for CI environment (sequential, no interaction)
npm run test:ci
```

### Test Categories

The test suite is organized into focused test files covering different aspects of the server:

| Test File | Category | Description |
|-----------|----------|-------------|
| `__tests__/server.test.js` | Unit Tests | Core unit tests for request handler, response configuration, and basic assertions |
| `__tests__/server.integration.test.js` | Integration Tests | Full HTTP request/response cycle testing using supertest |
| `__tests__/server.lifecycle.test.js` | Lifecycle Tests | Server startup, shutdown, and lifecycle event testing |
| `__tests__/server.error.test.js` | Error Handling Tests | Error scenarios including port conflicts and network errors |

### Test Fixtures and Helpers

| File | Purpose |
|------|---------|
| `__tests__/fixtures/mockRequest.js` | Factory functions for creating mock HTTP request objects |
| `__tests__/fixtures/mockResponse.js` | Factory functions for creating mock HTTP response objects |
| `__tests__/helpers/serverUtils.js` | Utility functions for server management in tests |

### Coverage Targets

The project maintains strict coverage requirements to ensure code quality:

| Metric | Target | Description |
|--------|--------|-------------|
| Line Coverage | 90% minimum | Achievable with the compact codebase |
| Branch Coverage | 100% | All code branches must be tested |
| Function Coverage | 100% | All callable functions must be tested |
| Statement Coverage | 90% minimum | Matches line coverage target |

Coverage reports are generated in the `coverage/` directory after running tests. View the HTML report at `coverage/lcov-report/index.html`.

### Test Conventions

- **Test Naming:** Uses descriptive format `should [action/result] when [condition]`
- **Test Isolation:** Each test file can run independently
- **Resource Cleanup:** Server instances are properly closed after tests
- **Mocking Strategy:** Uses Jest mocks for console output and supertest for HTTP testing

## Running the Server

```bash
# Start the server
node server.js

# Server will be available at http://127.0.0.1:3000
```

## Project Structure

```
├── server.js                           # Main HTTP server
├── package.json                        # Project configuration and scripts
├── jest.config.js                      # Jest test configuration
├── __tests__/                          # Test directory
│   ├── server.test.js                  # Unit tests
│   ├── server.integration.test.js      # Integration tests
│   ├── server.lifecycle.test.js        # Lifecycle tests
│   ├── server.error.test.js            # Error handling tests
│   ├── fixtures/                       # Test fixtures
│   │   ├── mockRequest.js              # Request mock factory
│   │   └── mockResponse.js             # Response mock factory
│   └── helpers/                        # Test helpers
│       └── serverUtils.js              # Server utilities
└── README.md                           # This file
```

## License

This project is a test fixture and is not intended for production use.
