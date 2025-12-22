# Technical Specification

# 0. Agent Action Plan

## 0.1 Intent Clarification

### 0.1.1 Core Testing Objective

Based on the provided requirements, the Blitzy platform understands that the testing objective is to **create comprehensive unit tests for the server.js file** using either Jest or Mocha as the test framework. This is a **new feature addition** that transforms the project from a zero-dependency test fixture into a testable application with a proper testing infrastructure.

**Request Classification:** Add new tests (greenfield test implementation)

**Testing Requirements with Enhanced Clarity:**

| Requirement | User-Stated | Enhanced Interpretation |
|-------------|-------------|-------------------------|
| HTTP Responses | Test HTTP responses | Validate response body content ("Hello, World!\n"), verify proper response termination via `res.end()` |
| Status Codes | Test status codes | Assert HTTP 200 OK for successful requests, verify proper status code assignment on the response object |
| Headers | Test headers | Validate `Content-Type: text/plain` header is properly set, verify header setting mechanism |
| Server Startup | Test server startup | Verify server binds to 127.0.0.1:3000, confirm callback execution on listen, test startup state transitions |
| Server Shutdown | Test shutdown | Implement graceful shutdown testing, verify `server.close()` functionality, test cleanup procedures |
| Error Handling | Test error handling | Cover network errors, port conflicts, malformed requests, and uncaught exception scenarios |
| Edge Cases | Test edge cases | Empty requests, large payloads, concurrent connections, rapid start/stop cycles |

**Implicit Testing Needs Surfaced:**

- **Request Method Handling:** The current server accepts all HTTP methods (GET, POST, PUT, DELETE, etc.) - tests should verify behavior across methods
- **Request Path Handling:** Any URL path returns the same response - tests should document this behavior
- **Connection Keep-Alive:** Verify TCP connection handling
- **Memory Leak Prevention:** Ensure no resource leaks during server lifecycle
- **Module Export Structure:** Server module may need restructuring for testability (exporting `server` instance)

### 0.1.2 Special Instructions and Constraints

**Framework Selection:** User explicitly stated "Jest or Mocha" - both are viable options for Node.js 20.x:

- **Jest 29.7.0:** Full compatibility with Node 20.x, built-in assertions, mocking, and coverage
- **Mocha 11.7.5:** Compatible with Node ^18.18.0 || ^20.9.0, requires external assertion library (Chai recommended)

**Recommendation:** Jest is recommended as the primary framework due to:
- Zero-configuration setup for Node.js projects
- Built-in code coverage via c8/istanbul
- Integrated mocking capabilities required for HTTP server testing
- Single package provides test runner, assertions, and coverage

**Testing Constraints Identified:**
- Server file currently auto-starts on `require()` - refactoring needed for test isolation
- No exports from server.js - module restructuring required for unit testing
- Port 3000 must be available during test execution
- Tests must handle asynchronous server lifecycle events

**Web Search Requirements Documented:**
- ✓ Jest Node.js 20 compatibility verified (supports Node 18.0+)
- ✓ Mocha Node.js 20 compatibility verified (supports Node 20.9.0+)
- ✓ Supertest HTTP testing patterns researched
- Best practices for Node.js HTTP server testing established

### 0.1.3 Technical Interpretation

These testing requirements translate to the following technical test implementation strategy:

- **To test HTTP responses,** we will create test files using Jest's `expect()` assertions to verify the response body matches `"Hello, World!\n"` using `supertest` or native HTTP client
- **To test status codes,** we will assert that `response.statusCode === 200` for all valid requests
- **To test headers,** we will verify `response.headers['content-type']` equals `'text/plain'` using matcher assertions
- **To test server startup,** we will create lifecycle tests that spawn the server, verify binding, and assert callback execution
- **To test server shutdown,** we will implement `server.close()` tests with callback verification and ensure no hanging connections
- **To test error handling,** we will simulate port conflicts, EADDRINUSE errors, and network failures using mocked scenarios
- **To test edge cases,** we will create parameterized tests covering concurrent requests, various HTTP methods, and malformed inputs

### 0.1.4 Coverage Requirements Interpretation

**Explicit Coverage Targets:** Not specified by user - applying industry standards

**Implicit Coverage Expectations Based On:**

| Source | Coverage Standard |
|--------|-------------------|
| Industry standard for critical HTTP servers | 80%+ line coverage |
| Node.js server testing best practices | 100% function coverage for public APIs |
| Existing repository patterns | N/A (no existing tests) |
| Critical path analysis | 100% coverage on request handler, startup, and shutdown logic |

**To achieve comprehensive testing, coverage should include:**

- **Line Coverage Target:** 90% minimum (achievable given the 15-line codebase)
- **Branch Coverage Target:** 100% (limited branching in current implementation)
- **Function Coverage Target:** 100% for all exported/testable functions
- **Statement Coverage Target:** 90% minimum

**Critical Paths Requiring 100% Coverage:**
- HTTP request handler function (lines 6-9)
- Server creation and configuration (lines 3-10)
- Server listen callback (lines 12-14)

## 0.2 Test Discovery and Analysis

### 0.2.1 Existing Test Infrastructure Assessment

**Repository Analysis Conducted:**

An extensive search of the repository revealed the following test infrastructure status:

```
Search Pattern Results:
├── *test* files: LoginTest.java (placeholder), test.py.txt (empty placeholder)
├── *spec* files: None found
├── test_* files: None found
├── *_test.* files: None found
├── *_spec.* files: None found
├── jest.config.*: Not present
├── mocha.*: Not present
├── .mocharc.*: Not present
└── package.json test script: "echo \"Error: no test specified\" && exit 1"
```

**Repository Analysis Reveals:** The project has **zero operational testing infrastructure**. The discovered placeholder files (`LoginTest.java`, `test.py.txt`) are empty test fixture artifacts not intended for actual testing.

**Current Testing Framework:** None installed

| Assessment Category | Finding |
|---------------------|---------|
| Test Runner | Not present |
| Test Configuration | Not present |
| Coverage Tools | Not present |
| Mock/Stub Libraries | Not present |
| Test Data Fixtures | Not present |
| Assertion Libraries | Not present |

**Key Discovery:** The `package.json` explicitly configures the test script to fail:
```json
"test": "echo \"Error: no test specified\" && exit 1"
```

This confirms the project was intentionally created without testing capability, which this initiative will transform.

### 0.2.2 Test Target Code Analysis

**Source File:** `server.js` (15 lines)

```javascript
// Line-by-line analysis for test targeting:
const http = require('http');              // L1: Native module import
const hostname = '127.0.0.1';              // L3: Configuration constant
const port = 3000;                         // L4: Configuration constant
const server = http.createServer(/*...*/); // L6-10: Server creation with handler
server.listen(port, hostname, /*...*/);    // L12-14: Server startup
```

**Testable Components Identified:**

| Component | Lines | Test Categories Required | Complexity |
|-----------|-------|--------------------------|------------|
| Request Handler | 6-9 | Unit tests, Integration tests | Low |
| Server Instance Creation | 6 | Unit tests | Low |
| Response Configuration | 7-9 | Unit tests | Low |
| Server Binding | 12-13 | Integration tests, Lifecycle tests | Medium |
| Startup Callback | 13 | Unit tests, Integration tests | Low |

### 0.2.3 Testability Assessment

**Current Testability Issues:**

1. **Auto-execution on import:** Server starts immediately when `require('./server.js')` is called
2. **No exports:** Module does not export `server` instance or factory function
3. **Hardcoded configuration:** Hostname and port are constants, not injectable
4. **Singleton pattern:** Only one server instance can exist per module load

**Required Refactoring for Testability:**

The server.js file requires minimal restructuring to enable unit testing:

```javascript
// Proposed testable structure (documentation only)
module.exports = { server, hostname, port };
// Or: module.exports = createServer;
```

### 0.2.4 Web Search Research Conducted

| Research Topic | Findings Applied |
|----------------|------------------|
| Jest testing patterns for Node.js HTTP servers | Use `beforeAll`/`afterAll` hooks for server lifecycle; `supertest` for HTTP assertions |
| Supertest integration with Jest | Supertest wraps server instances for declarative HTTP testing |
| Node.js 20 native test runner vs Jest | Jest provides richer ecosystem; native runner is lighter but lacks coverage tooling |
| HTTP server unit testing strategies | Mock `http.createServer`, test handler in isolation, integration test full stack |
| Best practices for testing server startup/shutdown | Use async/await with server.close(), implement timeout guards |

**Recommended Mocking Strategies:**

- **External HTTP calls:** Use `nock` or Jest's built-in mocks
- **Server instance:** Use `supertest` to wrap the server without binding to actual port
- **Console output:** Mock `console.log` to verify startup message
- **Network errors:** Use Jest's mock functions to simulate EADDRINUSE, ECONNREFUSED

**Test Organization Conventions for Node.js/Jest:**

```
project/
├── __tests__/           # Jest default test directory
│   ├── server.test.js   # Primary test file
│   └── integration/     # Integration test subdirectory
├── jest.config.js       # Jest configuration
└── server.js            # Source file
```

**Common Pitfalls to Avoid:**

- Forgetting to close server after tests (causes hanging process)
- Not awaiting async server operations
- Port conflicts between parallel test runs
- Testing implementation details instead of behavior
- Hardcoding timeouts without CI considerations

## 0.3 Testing Scope Analysis

### 0.3.1 Test Target Identification

**Primary Code to be Tested:**

| Module/Component | Path | Test Categories Required |
|------------------|------|--------------------------|
| HTTP Server Module | `server.js` | Unit tests, Integration tests, Lifecycle tests |
| Request Handler | `server.js:6-9` | Unit tests, Edge case tests |
| Server Configuration | `server.js:3-4` | Unit tests (constants verification) |
| Server Lifecycle | `server.js:12-14` | Integration tests, Startup/Shutdown tests |

**Functions Requiring Tests:**

| Function/Handler | Test Categories Needed |
|------------------|------------------------|
| `http.createServer` callback (request handler) | Happy path, Edge cases, Error handling |
| `server.listen` callback | Startup verification, Callback execution |
| Response methods (`res.statusCode`, `res.setHeader`, `res.end`) | Unit tests for each operation |

**Existing Test File Mapping:**

| Source File | Existing Test File | Test Categories Present |
|-------------|-------------------|-------------------------|
| `server.js` | None | None - greenfield implementation |

### 0.3.2 Dependencies Requiring Mocking

**External Services to Mock:**

| Dependency | Mock Strategy | Purpose |
|------------|---------------|---------|
| `http` module | Partial mock via Jest | Isolate server creation logic |
| Network layer | `supertest` abstraction | Avoid actual port binding in unit tests |
| `console.log` | Jest spy/mock | Verify startup message without stdout |
| TCP socket binding | Error simulation | Test EADDRINUSE and connection errors |

**Database Interactions:** None (no database in this project)

**File System Operations:** None to virtualize

### 0.3.3 Version Compatibility Research

**Runtime Environment:** Node.js v20.19.6 (verified in environment)

**Based on current Node.js version 20.19.6, recommended testing stack:**

| Component | Package | Version | Compatibility Rationale |
|-----------|---------|---------|-------------------------|
| Testing Framework | `jest` | 29.7.0 | Stable release, supports Node 18.0+, extensive ecosystem |
| HTTP Testing | `supertest` | 7.0.0 | Latest stable, compatible with Jest 29.x |
| Coverage Tool | Built-in (c8/istanbul via Jest) | - | Included with Jest |
| Assertion Library | Jest built-in (`expect`) | - | No additional package needed |

**Alternative Stack (Mocha-based):**

| Component | Package | Version | Compatibility Rationale |
|-----------|---------|---------|-------------------------|
| Testing Framework | `mocha` | 11.7.5 | Supports Node ^18.18.0 or ^20.9.0+ |
| Assertion Library | `chai` | 5.1.2 | Modern ES module support |
| HTTP Testing | `supertest` | 7.0.0 | Framework-agnostic |
| Coverage Tool | `c8` | 10.1.3 | Native V8 coverage for Node.js |

**Version Conflicts to Resolve:** None identified. Both Jest 29.x and Mocha 11.x are fully compatible with Node.js 20.19.6.

### 0.3.4 Test Categories Matrix

| Test Category | Description | Priority | Files Affected |
|---------------|-------------|----------|----------------|
| **Unit Tests** | Isolated component testing | High | `server.test.js` |
| **Integration Tests** | Full HTTP request/response cycle | High | `server.integration.test.js` |
| **Lifecycle Tests** | Startup and shutdown verification | High | `server.lifecycle.test.js` |
| **Edge Case Tests** | Boundary conditions and unusual inputs | Medium | `server.edge.test.js` |
| **Error Handling Tests** | Failure scenario coverage | High | `server.error.test.js` |

### 0.3.5 Test Scope Boundaries

**What Will Be Tested:**

- HTTP response body content verification
- HTTP status code assertions
- HTTP header configuration validation
- Server startup sequence and callback execution
- Server shutdown and resource cleanup
- Error handling for port conflicts and network issues
- Edge cases for various HTTP methods and request patterns

**What Will NOT Be Tested (Out of Scope):**

- Performance benchmarking (not requested)
- Load testing / stress testing
- Security penetration testing
- Browser-based testing
- External service integration (none exist)
- CI/CD pipeline configuration (deployment concern)

## 0.4 Test Implementation Design

### 0.4.1 Test Strategy Selection

**Test Types to Implement:**

| Test Type | Focus Area | Implementation Approach |
|-----------|------------|-------------------------|
| **Unit Tests** | Isolated request handler logic | Mock HTTP request/response objects, test handler function directly |
| **Integration Tests** | Full HTTP request/response cycle | Use `supertest` to make actual HTTP requests to running server |
| **Lifecycle Tests** | Server startup/shutdown sequences | Test `server.listen()` and `server.close()` with callbacks |
| **Edge Case Tests** | Boundary conditions | Various HTTP methods, empty requests, large headers |
| **Error Handling Tests** | Failure scenarios | Port conflicts, network errors, malformed requests |

### 0.4.2 Test Case Blueprint

**Component: Request Handler (lines 6-9)**

```
Component: HTTP Request Handler
Test Categories:
- Happy path: 
  - Returns "Hello, World!\n" for GET request
  - Returns "Hello, World!\n" for POST request  
  - Returns "Hello, World!\n" for any URL path
- Edge cases:
  - Handles requests with no URL path
  - Handles requests with query parameters
  - Handles requests with various HTTP methods (PUT, DELETE, PATCH, OPTIONS)
  - Handles concurrent simultaneous requests
- Error cases:
  - Response handling when connection drops mid-response
  - Behavior when response is already sent
- Performance boundaries:
  - Response time under load (informational)
```

**Component: Response Configuration (lines 7-9)**

```
Component: Response Configuration
Test Categories:
- Happy path:
  - Sets statusCode to 200
  - Sets Content-Type header to text/plain
  - Ends response with correct body
- Edge cases:
  - Verify header case-insensitivity
  - Verify response is properly terminated
- Error cases:
  - N/A (simple synchronous operations)
```

**Component: Server Lifecycle (lines 12-14)**

```
Component: Server Startup/Shutdown
Test Categories:
- Happy path:
  - Server binds to 127.0.0.1:3000
  - Callback fires after successful binding
  - Console.log outputs correct message
  - Server.close() terminates gracefully
- Edge cases:
  - Multiple start/stop cycles
  - Close with pending connections
- Error cases:
  - Port already in use (EADDRINUSE)
  - Permission denied on binding
  - Invalid hostname/port
```

### 0.4.3 Existing Test Extension Strategy

Since this is a **greenfield test implementation**, there are no existing tests to extend. All tests will be newly created.

### 0.4.4 Test Data and Fixtures Design

**Required Test Data Structures:**

| Fixture Type | Purpose | Location |
|--------------|---------|----------|
| Mock Request Objects | Simulate HTTP IncomingMessage | In-test or `__tests__/fixtures/` |
| Mock Response Objects | Simulate HTTP ServerResponse | In-test or `__tests__/fixtures/` |
| Test Configuration | Port assignments, timeouts | `jest.config.js` |

**Fixture Organization Strategy:**

```
__tests__/
├── fixtures/
│   ├── mockRequest.js      # Factory for mock request objects
│   └── mockResponse.js     # Factory for mock response objects
├── helpers/
│   └── serverUtils.js      # Server start/stop utilities
└── *.test.js               # Test files
```

**Mock Object Specifications:**

```javascript
// Mock Request Object Shape (documentation)
const mockRequest = {
  method: 'GET',
  url: '/',
  headers: {},
  // ... event emitter methods if needed
};

// Mock Response Object Shape (documentation)  
const mockResponse = {
  statusCode: null,
  headers: {},
  setHeader: jest.fn(),
  end: jest.fn(),
  // ... writable stream methods if needed
};
```

**Test Database/State Management:**

- No database state to manage
- Server instances must be created fresh for each test suite
- Port management: Use dynamic port assignment or sequential allocation to avoid conflicts

### 0.4.5 Test Isolation Strategy

**Isolation Requirements:**

| Concern | Strategy |
|---------|----------|
| Port Conflicts | Use `supertest` which auto-assigns ephemeral ports |
| Shared State | Create new server instance per `describe` block |
| Async Cleanup | Use `afterAll` hooks with proper async handling |
| Parallel Execution | Configure Jest for sequential execution if needed |

**Test Execution Order:**

1. Unit tests (fastest, no I/O)
2. Integration tests (require server binding)
3. Lifecycle tests (full startup/shutdown cycles)
4. Edge case tests (various scenarios)
5. Error handling tests (simulated failures)

## 0.5 Test File Transformation Mapping

### 0.5.1 File-by-File Test Plan

**Complete Test Transformation Map:**

| Target Test File | Transformation | Source File/Reference | Purpose/Changes |
|-----------------|----------------|----------------------|-----------------|
| `__tests__/server.test.js` | CREATE | `server.js` | Primary unit test suite covering request handler, response configuration, and basic assertions |
| `__tests__/server.integration.test.js` | CREATE | `server.js` | Integration tests using supertest for full HTTP request/response cycle testing |
| `__tests__/server.lifecycle.test.js` | CREATE | `server.js` | Server startup, shutdown, and lifecycle event testing |
| `__tests__/server.error.test.js` | CREATE | `server.js` | Error handling tests for port conflicts, network errors, and edge failure scenarios |
| `__tests__/fixtures/mockRequest.js` | CREATE | N/A | Factory functions for creating mock HTTP request objects |
| `__tests__/fixtures/mockResponse.js` | CREATE | N/A | Factory functions for creating mock HTTP response objects |
| `__tests__/helpers/serverUtils.js` | CREATE | N/A | Utility functions for server management in tests (start, stop, wait) |
| `jest.config.js` | CREATE | N/A | Jest configuration file with test environment settings |
| `package.json` | UPDATE | `package.json` | Update test script, add devDependencies for jest and supertest |
| `server.js` | UPDATE | `server.js` | Add module exports for testability (export server instance) |
| `LoginTest.java` | DELETE | `LoginTest.java` | Remove placeholder test file not relevant to JavaScript testing |
| `test.py.txt` | DELETE | `test.py.txt` | Remove empty placeholder test file |

### 0.5.2 New Test Files Detail

**`__tests__/server.test.js` - Unit Test Suite**

```
Purpose: Core unit tests for server.js components
Test Categories: 
- Happy path: Response body, status code, headers
- Edge cases: Various HTTP methods, URL paths
- Assertions: All response properties correctly set

Mock Dependencies:
- http module (partial mock for isolated testing)
- console.log (spy for startup verification)

Assertions Focus:
- Response statusCode equals 200
- Response Content-Type header equals 'text/plain'
- Response body equals 'Hello, World!\n'
```

**`__tests__/server.integration.test.js` - Integration Test Suite**

```
Purpose: Full HTTP request/response cycle testing
Test Categories:
- Happy path: GET request returns expected response
- Edge cases: POST, PUT, DELETE, OPTIONS methods
- Integration points: supertest → server → response

Integration Points:
- supertest wrapping server instance
- Actual HTTP protocol validation

Test Data Requirements:
- None (stateless server)
```

**`__tests__/server.lifecycle.test.js` - Lifecycle Test Suite**

```
Purpose: Server startup and shutdown verification
Test Categories:
- Happy path: Server starts, callback fires, server stops
- Edge cases: Multiple start/stop cycles
- Error cases: Double-start, double-stop scenarios

Mock Dependencies:
- console.log (spy to verify startup message)

Assertions Focus:
- Server successfully binds to port
- Callback is invoked after binding
- Server closes gracefully
- Resources are properly released
```

**`__tests__/server.error.test.js` - Error Handling Test Suite**

```
Purpose: Verify error handling for failure scenarios
Test Categories:
- Error cases: EADDRINUSE, ECONNREFUSED, EACCES
- Edge cases: Invalid port, invalid hostname

Mock Dependencies:
- net/http modules for error simulation

Assertions Focus:
- Appropriate error events are emitted
- Error messages are descriptive
- Server state is consistent after errors
```

**`__tests__/fixtures/mockRequest.js` - Mock Factory**

```
Purpose: Create mock HTTP IncomingMessage objects
Fixture Types:
- Basic GET request mock
- POST request with body mock
- Request with headers mock

Usage: Import and call factory in unit tests
```

**`__tests__/fixtures/mockResponse.js` - Mock Factory**

```
Purpose: Create mock HTTP ServerResponse objects
Fixture Types:
- Spy-enabled response mock
- Writable stream mock

Usage: Import and call factory in unit tests
```

**`__tests__/helpers/serverUtils.js` - Test Utilities**

```
Purpose: Common server management functions
Functions:
- startServer(): Promise-based server start
- stopServer(): Promise-based server stop
- waitForServer(): Health check utility

Usage: Import in lifecycle and integration tests
```

### 0.5.3 Test Files to Modify Detail

**`package.json` - Configuration Updates**

```
Changes Required:
- Update "test" script: "jest --coverage"
- Add "test:watch" script: "jest --watch"
- Add "test:ci" script: "jest --ci --coverage"
- Add devDependencies section with jest, supertest

Updated Scripts:
{
  "test": "jest --coverage",
  "test:watch": "jest --watch",  
  "test:ci": "jest --ci --coverage --runInBand"
}
```

**`server.js` - Testability Modifications**

```
Changes Required:
- Add module.exports at end of file
- Export server instance for test access
- Optionally wrap startup in conditional

Modification Scope:
- Add 1-3 lines for exports
- Preserve all existing functionality
- No behavioral changes to production code
```

### 0.5.4 Test Configuration Updates

| Config File | Purpose | Key Settings |
|-------------|---------|--------------|
| `jest.config.js` | Jest configuration | testEnvironment: 'node', coverageThreshold, testMatch |

**Jest Configuration Contents:**

```javascript
// jest.config.js structure (for documentation)
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: { lines: 90, functions: 100 }
  },
  verbose: true
};
```

### 0.5.5 Cross-File Test Dependencies

**Shared Fixtures:**

| Fixture | Location | Used By |
|---------|----------|---------|
| `mockRequest.js` | `__tests__/fixtures/` | `server.test.js` |
| `mockResponse.js` | `__tests__/fixtures/` | `server.test.js` |
| `serverUtils.js` | `__tests__/helpers/` | `server.lifecycle.test.js`, `server.integration.test.js` |

**Mock Objects:**

| Mock | Location | Purpose |
|------|----------|---------|
| Request mock factory | `__tests__/fixtures/mockRequest.js` | Isolated handler testing |
| Response mock factory | `__tests__/fixtures/mockResponse.js` | Isolated handler testing |

**Test Utilities:**

| Helper | Location | Functions Provided |
|--------|----------|-------------------|
| Server utilities | `__tests__/helpers/serverUtils.js` | `startServer()`, `stopServer()`, `getServerUrl()` |

**Import Updates Required:**

- All test files import from `jest` globals (describe, it, expect)
- Integration tests import `supertest` from node_modules
- Test files import server from `../server.js` (after export modification)

## 0.6 Dependency Inventory

### 0.6.1 Testing Dependencies

**Primary Testing Stack (Jest-based - Recommended):**

| Registry | Package Name | Version | Purpose |
|----------|--------------|---------|---------|
| npm | jest | 29.7.0 | Testing framework with built-in assertions, mocking, and coverage |
| npm | supertest | 7.0.0 | HTTP assertion library for integration testing |

**Alternative Testing Stack (Mocha-based):**

| Registry | Package Name | Version | Purpose |
|----------|--------------|---------|---------|
| npm | mocha | 11.7.5 | Test framework and runner |
| npm | chai | 5.1.2 | Assertion library with BDD/TDD styles |
| npm | supertest | 7.0.0 | HTTP assertion library for integration testing |
| npm | c8 | 10.1.3 | Native V8 code coverage tool |

**Version Verification:**

All versions have been verified as:
- Currently published on npm registry
- Compatible with Node.js v20.19.6
- Actively maintained with recent updates

### 0.6.2 Dependency Installation Commands

**For Jest Stack (Recommended):**

```bash
npm install --save-dev jest@29.7.0 supertest@7.0.0
```

**For Mocha Stack (Alternative):**

```bash
npm install --save-dev mocha@11.7.5 chai@5.1.2 supertest@7.0.0 c8@10.1.3
```

### 0.6.3 Package.json Updates Required

**Current `devDependencies`:** None (empty dependency tree)

**Updated `devDependencies` (Jest Stack):**

```json
{
  "devDependencies": {
    "jest": "29.7.0",
    "supertest": "7.0.0"
  }
}
```

**Updated `scripts` Section:**

```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --runInBand"
  }
}
```

### 0.6.4 Import Updates

**Test Files Requiring Imports:**

| Test File | Required Imports |
|-----------|------------------|
| `__tests__/server.test.js` | `server` from source, Jest globals (auto-injected) |
| `__tests__/server.integration.test.js` | `supertest`, `server` from source |
| `__tests__/server.lifecycle.test.js` | `server` from source, Jest globals |
| `__tests__/server.error.test.js` | `server` from source, Jest globals |

**Import Patterns:**

```javascript
// Integration test imports (example pattern)
const request = require('supertest');
const { server } = require('../server');

// Unit test imports (example pattern)
const { createMockRequest } = require('./fixtures/mockRequest');
const { createMockResponse } = require('./fixtures/mockResponse');
```

### 0.6.5 Source File Modifications for Testability

**File:** `server.js`

**Current State:** No exports

**Required Modification:**

```javascript
// Add at end of server.js
module.exports = { server, hostname, port };
```

**Import Transformation Rules:**

| Context | Before | After |
|---------|--------|-------|
| Server access in tests | Not possible | `const { server } = require('../server');` |
| Configuration access | Not possible | `const { hostname, port } = require('../server');` |

**Apply to:** All test files that need direct server access

### 0.6.6 Dependency Tree Impact

**Before Implementation:**

```
project/
└── (no node_modules)
    └── Zero dependencies
```

**After Implementation (Jest Stack):**

```
project/
├── node_modules/
│   ├── jest/                  # ~270 transitive packages
│   └── supertest/             # ~15 transitive packages
├── package.json               # Updated with devDependencies
└── package-lock.json          # Generated lockfile
```

**Estimated Package Count:**

| Stack | Direct Dependencies | Transitive Dependencies |
|-------|---------------------|------------------------|
| Jest + Supertest | 2 | ~285 packages |
| Mocha + Chai + Supertest + c8 | 4 | ~150 packages |

**Note:** This transforms the project from zero-dependency to a standard Node.js project with development dependencies. Production dependencies remain at zero.

## 0.7 Coverage and Quality Targets

### 0.7.1 Coverage Metrics

**Current Coverage:** 0% (no tests exist)

**Target Coverage Based on Best Practices:**

| Metric | Target | Rationale |
|--------|--------|-----------|
| Line Coverage | 90% minimum | Achievable with 15-line codebase; accounts for unreachable error paths |
| Branch Coverage | 100% | Limited branching in current implementation |
| Function Coverage | 100% | All callable functions must be tested |
| Statement Coverage | 90% minimum | Matches line coverage target |

**Coverage Gaps to Address:**

| Component | Current | Target | Focus Areas |
|-----------|---------|--------|-------------|
| Request Handler | 0% | 100% | All response methods |
| Server Configuration | 0% | 100% | Constants verification |
| Server Lifecycle | 0% | 90%+ | Startup callback, shutdown handling |
| Error Paths | 0% | 80%+ | Network errors, port conflicts |

### 0.7.2 Per-File Coverage Targets

| File | Line Coverage | Function Coverage | Notes |
|------|---------------|-------------------|-------|
| `server.js` | 90% | 100% | Some error paths may be difficult to reach |
| `__tests__/fixtures/*.js` | N/A | N/A | Test utilities excluded from coverage |
| `__tests__/helpers/*.js` | N/A | N/A | Test utilities excluded from coverage |

### 0.7.3 Jest Coverage Configuration

```javascript
// Coverage thresholds for jest.config.js
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
}
```

### 0.7.4 Test Quality Criteria

**Assertion Density Expectations:**

| Test Category | Minimum Assertions per Test |
|---------------|----------------------------|
| Unit Tests | 2-3 assertions per test case |
| Integration Tests | 3-5 assertions per test case |
| Lifecycle Tests | 2-4 assertions per test case |
| Error Handling Tests | 2-3 assertions per test case |

**Test Isolation Requirements:**

- Each test must be independently runnable
- No shared state between test files
- Server instances created and destroyed per test suite
- No dependency on test execution order

**Performance Constraints:**

| Constraint | Target | Enforcement |
|------------|--------|-------------|
| Individual test timeout | 5000ms (default) | Jest configuration |
| Total suite execution | < 30 seconds | CI/CD gate |
| Memory usage | < 512MB | Monitoring |

**Maintainability Standards:**

- Descriptive test names following pattern: `should [expected behavior] when [condition]`
- One logical assertion per test when possible
- DRY principles applied via shared fixtures and helpers
- Comments for non-obvious test setup or assertions

### 0.7.5 Test Naming Conventions

**Test Suite Naming:**

```javascript
describe('Server', () => {
  describe('Request Handler', () => {
    describe('when receiving a GET request', () => {
      it('should return 200 status code', () => {});
      it('should return "Hello, World!" body', () => {});
    });
  });
});
```

**Test Case Naming Pattern:**

- Format: `should [action/result] when [condition/context]`
- Examples:
  - `should return status code 200 when request is received`
  - `should set Content-Type header to text/plain`
  - `should emit listening event when server starts`
  - `should close gracefully when close() is called`

### 0.7.6 Quality Gates

**Pre-Commit Quality Gates:**

| Gate | Requirement | Enforcement |
|------|-------------|-------------|
| All tests pass | 100% pass rate | `npm test` exit code |
| Coverage thresholds met | Per configuration | Jest `--coverage` |
| No skipped tests in commit | 0 `.skip()` calls | Code review |

**CI/CD Quality Gates:**

| Gate | Requirement | Action on Failure |
|------|-------------|-------------------|
| Test Suite | All tests pass | Block merge |
| Coverage | Meet thresholds | Block merge |
| Test Duration | < 30 seconds | Warning |

## 0.8 Scope Boundaries

### 0.8.1 Exhaustively In Scope

**New Test Files:**

| Pattern | Description |
|---------|-------------|
| `__tests__/**/*.test.js` | All Jest test files in test directory |
| `__tests__/server.test.js` | Primary unit test suite |
| `__tests__/server.integration.test.js` | HTTP integration tests |
| `__tests__/server.lifecycle.test.js` | Startup/shutdown tests |
| `__tests__/server.error.test.js` | Error handling tests |

**Test Fixtures and Helpers:**

| Pattern | Description |
|---------|-------------|
| `__tests__/fixtures/**/*.js` | All test fixture files |
| `__tests__/fixtures/mockRequest.js` | Request mock factory |
| `__tests__/fixtures/mockResponse.js` | Response mock factory |
| `__tests__/helpers/**/*.js` | All test helper files |
| `__tests__/helpers/serverUtils.js` | Server management utilities |

**Test Configuration Files:**

| File | Description |
|------|-------------|
| `jest.config.js` | Jest framework configuration |
| `package.json` | Scripts and devDependencies updates |
| `package-lock.json` | Dependency lockfile (auto-generated) |

**Source Code Modifications (Minimal):**

| File | Modification | Purpose |
|------|--------------|---------|
| `server.js` | Add `module.exports` | Enable testability |

**Documentation Updates:**

| File | Section | Change |
|------|---------|--------|
| `README.md` | Testing section | Add test execution instructions |

### 0.8.2 Explicitly Out of Scope

**Source Code Changes Not Included:**

- Refactoring server logic beyond export statement
- Adding new features or endpoints
- Performance optimizations
- Error handling improvements in source code
- Adding new HTTP routes or methods

**Test Types Not Included:**

- End-to-end (E2E) browser tests
- Performance/load testing
- Security penetration testing
- Fuzz testing
- Snapshot testing (not applicable)
- Visual regression testing

**Infrastructure Not Included:**

- CI/CD pipeline configuration
- Docker containerization
- Deployment scripts
- Monitoring setup
- Log aggregation

**Files Explicitly Excluded:**

| File | Reason |
|------|--------|
| `industry.csv` | Data file, not testable code |
| `LoginTest.java` | To be deleted (placeholder) |
| `test.py.txt` | To be deleted (placeholder) |

**Items Excluded per User Instruction:**

- No items explicitly excluded by user in this request

### 0.8.3 Conditional Scope Items

**May Be Included If Required for Testability:**

| Item | Condition | Inclusion Criteria |
|------|-----------|-------------------|
| Additional server.js exports | If more granular testing needed | Only if unit tests require isolated handler access |
| Test environment variables | If port configuration needed | Only if test isolation requires dynamic ports |
| Custom Jest matchers | If complex assertions needed | Only if existing matchers are insufficient |

### 0.8.4 Scope Validation Checklist

| Requirement | In Scope | Verified |
|-------------|----------|----------|
| HTTP response testing | ✓ | `server.integration.test.js` |
| Status code testing | ✓ | `server.test.js`, `server.integration.test.js` |
| Header testing | ✓ | `server.test.js`, `server.integration.test.js` |
| Server startup testing | ✓ | `server.lifecycle.test.js` |
| Server shutdown testing | ✓ | `server.lifecycle.test.js` |
| Error handling testing | ✓ | `server.error.test.js` |
| Edge case testing | ✓ | Distributed across test files |

All user-specified testing requirements are addressed within scope.

## 0.9 Execution Parameters

### 0.9.1 Testing-Specific Instructions

**Test Execution Commands:**

| Command | Purpose | Usage Context |
|---------|---------|---------------|
| `npm test` | Run all tests with coverage | Default execution |
| `npm run test:watch` | Run tests in watch mode | Development |
| `npm run test:ci` | Run tests for CI environment | CI/CD pipelines |

**Full Command Specifications:**

```bash
# Standard test execution with coverage
npm test
# Equivalent to: jest --coverage

#### Watch mode for development
npm run test:watch
#### Equivalent to: jest --watch

#### CI-optimized execution (sequential, coverage, no interaction)
npm run test:ci
#### Equivalent to: jest --ci --coverage --runInBand
```

**Coverage Measurement Command:**

```bash
# Generate coverage report
npm test -- --coverage

#### Generate specific coverage formats
npm test -- --coverage --coverageReporters="text" --coverageReporters="lcov"
```

**Single Test Execution Patterns:**

```bash
# Run specific test file
npm test -- __tests__/server.test.js

#### Run tests matching pattern
npm test -- --testNamePattern="should return 200"

#### Run tests in specific directory
npm test -- __tests__/
```

**Debug Mode Execution:**

```bash
# Run with Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand

#### Run with verbose output
npm test -- --verbose
```

### 0.9.2 Test Patterns and Conventions

**Repository Test Patterns:**

Since this is a greenfield implementation, the following patterns will be established:

| Pattern | Convention |
|---------|------------|
| Test file naming | `*.test.js` |
| Test directory | `__tests__/` |
| Fixture directory | `__tests__/fixtures/` |
| Helper directory | `__tests__/helpers/` |
| Test runner | Jest |
| Assertion style | Jest built-in `expect()` |

**Excluded Test Categories:**

- None explicitly excluded by user

### 0.9.3 Environment Setup Requirements

**Pre-Test Environment Checks:**

| Requirement | Verification Command | Expected Result |
|-------------|---------------------|-----------------|
| Node.js version | `node --version` | v20.x.x |
| npm version | `npm --version` | 10.x.x or higher |
| Dependencies installed | `npm ls jest` | jest@29.7.0 |
| Port 3000 availability | `lsof -i :3000` | No output (port free) |

**Environment Variables:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `CI` | Indicates CI environment | `undefined` (local) |
| `NODE_ENV` | Node environment | `test` during test runs |
| `JEST_WORKER_ID` | Parallel worker identification | Auto-assigned |

**Test Environment Initialization:**

```javascript
// jest.config.js settings
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [],  // No global setup required
  globalSetup: undefined,   // No global setup script
  globalTeardown: undefined // No global teardown script
};
```

### 0.9.4 Timeout Configuration

| Context | Timeout | Configuration |
|---------|---------|---------------|
| Individual test | 5000ms | Jest default |
| Test suite | No limit | - |
| Async operations | 5000ms | Jest default |
| Server startup | 2000ms | Custom in test |
| Server shutdown | 1000ms | Custom in test |

**Custom Timeout Example:**

```javascript
// For slow operations in tests
it('should handle slow operations', async () => {
  // Custom timeout for this test
}, 10000);
```

### 0.9.5 Parallel Execution Configuration

**Jest Parallelization Settings:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| `--runInBand` | For CI | Prevents port conflicts |
| `--maxWorkers` | 50% (default) | Local development |
| `--maxWorkers=1` | For debugging | Sequential execution |

**Port Conflict Prevention:**

- Use `supertest` which handles port assignment automatically
- For lifecycle tests, ensure proper server cleanup in `afterAll`
- Consider dynamic port assignment if parallel execution needed

### 0.9.6 Output and Reporting

**Test Output Formats:**

| Reporter | Purpose | Command Flag |
|----------|---------|--------------|
| default | Console output | (default) |
| verbose | Detailed test results | `--verbose` |
| json | Machine-readable | `--json` |
| junit | CI integration | `--reporters=jest-junit` |

**Coverage Report Formats:**

| Format | Purpose | Location |
|--------|---------|----------|
| text | Console summary | stdout |
| lcov | IDE/tool integration | `coverage/lcov.info` |
| html | Browser viewing | `coverage/lcov-report/index.html` |

## 0.10 Special Instructions for Testing

### 0.10.1 Testing-Specific Requirements

**User Request Analysis:**

The user requested: *"Create comprehensive unit tests for server.js using Jest or Mocha. Test HTTP responses, status codes, headers, server startup/shutdown, error handling, and edge cases."*

**Explicit Directives Extracted:**

| Directive | Implementation |
|-----------|----------------|
| Use Jest or Mocha | Jest 29.7.0 recommended (single-package solution) |
| Test HTTP responses | Integration tests via supertest |
| Test status codes | Assertions on `response.statusCode` |
| Test headers | Assertions on `response.headers` |
| Test server startup | Lifecycle tests with `server.listen()` |
| Test server shutdown | Lifecycle tests with `server.close()` |
| Test error handling | Error scenario tests with mocks |
| Test edge cases | Various HTTP methods, paths, concurrent requests |

### 0.10.2 Source Code Modification Guidelines

**Minimal Change Principle:**

- **ONLY** add `module.exports` to `server.js` for testability
- **DO NOT** refactor existing server logic
- **DO NOT** add new features while adding tests
- **DO NOT** change the server's runtime behavior

**Required server.js Modification:**

```javascript
// Add to end of server.js (lines 16-17)
module.exports = { server, hostname, port };
```

**Modification Scope:**

| Allowed | Not Allowed |
|---------|-------------|
| Adding exports | Changing request handler logic |
| Adding conditional startup (optional) | Adding new routes |
| - | Changing response content |
| - | Modifying port/hostname |

### 0.10.3 Test Pattern Conventions

**Follow Existing Test Patterns:**

Since this is a greenfield implementation, establish these patterns:

- Use Jest's `describe`/`it` block structure
- Group related tests in nested `describe` blocks
- Use `beforeAll`/`afterAll` for server lifecycle
- Use `beforeEach`/`afterEach` sparingly (prefer test isolation)

**Test Isolation Requirements:**

- Each test file should be independently runnable
- Tests should not depend on execution order
- Server instances should not leak between tests
- Console output should be captured/mocked when asserting

**Mocking Guidelines:**

| Component | Mock Strategy |
|-----------|---------------|
| HTTP server (unit tests) | Create mock req/res objects |
| HTTP server (integration) | Use supertest wrapper |
| Console output | Use `jest.spyOn(console, 'log')` |
| Network errors | Mock server events |

### 0.10.4 Test Independence Requirements

**Ensure All Tests Can Run:**

- Independently: Any single test file should pass in isolation
- In Parallel: Tests should not conflict over resources
- In Any Order: No dependency on other test execution

**Resource Management:**

```javascript
// Pattern for server lifecycle in tests
let server;

beforeAll(async () => {
  // Start server before tests
});

afterAll(async () => {
  // Ensure server is closed after tests
  if (server && server.listening) {
    await new Promise(resolve => server.close(resolve));
  }
});
```

### 0.10.5 Backward Compatibility

**Maintain Test Utility Compatibility:**

- Test utilities should work with both Jest and Mocha (if switching needed)
- Mock factories should be framework-agnostic where possible
- Assertions should use common patterns

### 0.10.6 Code Style and Naming Conventions

**Match Existing Code Style:**

| Aspect | Convention |
|--------|------------|
| Indentation | 2 spaces (matching server.js) |
| Quotes | Single quotes (matching server.js) |
| Semicolons | Yes (matching server.js) |
| Line endings | LF (Unix-style) |

**Test File Naming:**

| Pattern | Example |
|---------|---------|
| Unit tests | `server.test.js` |
| Integration tests | `server.integration.test.js` |
| Lifecycle tests | `server.lifecycle.test.js` |
| Error tests | `server.error.test.js` |

**Test Case Naming:**

- Use descriptive names: `should return 200 OK for GET requests`
- Avoid generic names: `test1`, `works`, `basic test`
- Include context: `when server is running`, `when port is unavailable`

### 0.10.7 Constraint Override Notice

**Important:** This testing implementation explicitly overrides the following constraints from the existing Technical Specification (Section 6.6):

| Previous Constraint | Override Justification |
|---------------------|------------------------|
| C-001: Repository must remain frozen | User explicitly requested tests |
| C-002: Zero external npm dependencies | Testing requires Jest/Supertest |
| C-004: npm test must exit with error | npm test will now execute Jest |

This transformation is authorized by the user's explicit request to "create comprehensive unit tests" which supersedes the repository's previous "test fixture" status.

