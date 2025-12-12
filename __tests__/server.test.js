/**
 * Unit Tests for server.js
 * 
 * Primary unit test suite for server.js that tests the HTTP request handler
 * function in isolation. Contains happy path tests for response body, status
 * code, and Content-Type header assertions. Uses mock request/response objects
 * for isolated unit testing without actual network binding.
 * 
 * Test Coverage:
 * - Server module exports verification (server instance, hostname, port)
 * - Request handler response status code (200 OK)
 * - Request handler response headers (Content-Type: text/plain)
 * - Request handler response body ("Hello, World!\n")
 * - HTTP method handling (GET, POST, PUT, DELETE, OPTIONS)
 * - URL path handling (root, nested paths, query parameters)
 * 
 * @module __tests__/server.test.js
 * @requires ../server - Server module with exported server, hostname, port
 * @requires ./fixtures/mockRequest - Mock request factory
 * @requires ./fixtures/mockResponse - Mock response factory with Jest spies
 */

'use strict';

// =============================================================================
// IMPORTS
// =============================================================================

// Import server module exports for testing configuration and accessing handler
const { server, hostname, port } = require('../server');

// Import mock factories for isolated unit testing without network binding
const { createMockRequest } = require('./fixtures/mockRequest');
const { createMockResponse } = require('./fixtures/mockResponse');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extracts the request handler callback from the server instance.
 * The handler is stored in server._events.request when http.createServer()
 * is called with a callback function.
 * 
 * @returns {Function} The request handler function (req, res) => {...}
 * @throws {Error} If the request handler cannot be found
 */
function getRequestHandler() {
  // The request handler is attached to the server's 'request' event
  // It can be accessed via server._events.request
  const handler = server._events.request;
  
  if (typeof handler !== 'function') {
    throw new Error('Could not extract request handler from server._events.request');
  }
  
  return handler;
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Server', () => {
  // Extract the request handler once for use across all tests
  let requestHandler;
  
  beforeAll(() => {
    // Extract the request handler from the server instance
    requestHandler = getRequestHandler();
  });
  
  afterAll((done) => {
    // Clean up: close the server if it's listening to prevent test hanging
    if (server && server.listening) {
      server.close(done);
    } else {
      done();
    }
  });
  
  // ===========================================================================
  // Configuration Tests
  // ===========================================================================
  
  describe('Configuration', () => {
    /**
     * Tests that the server module exports the server instance
     */
    it('should export server instance', () => {
      expect(server).toBeDefined();
      expect(typeof server).toBe('object');
      expect(server).not.toBeNull();
    });
    
    /**
     * Tests that the exported hostname matches the expected value
     */
    it('should export hostname as 127.0.0.1', () => {
      expect(hostname).toBeDefined();
      expect(hostname).toBe('127.0.0.1');
    });
    
    /**
     * Tests that the exported port matches the expected value
     */
    it('should export port as 3000', () => {
      expect(port).toBeDefined();
      expect(port).toBe(3000);
    });
    
    /**
     * Tests that the server instance has required HTTP server methods
     */
    it('should have standard HTTP server methods', () => {
      expect(typeof server.listen).toBe('function');
      expect(typeof server.close).toBe('function');
      expect(typeof server.address).toBe('function');
    });
    
    /**
     * Tests that the request handler exists and is a function
     */
    it('should have a request handler attached', () => {
      expect(requestHandler).toBeDefined();
      expect(typeof requestHandler).toBe('function');
    });
  });
  
  // ===========================================================================
  // Request Handler Tests
  // ===========================================================================
  
  describe('Request Handler', () => {
    // Fresh mock objects for each test to ensure isolation
    let mockReq;
    let mockRes;
    
    beforeEach(() => {
      // Create fresh mock objects before each test
      mockReq = createMockRequest();
      mockRes = createMockResponse();
    });
    
    // -------------------------------------------------------------------------
    // Response Status Code Tests
    // -------------------------------------------------------------------------
    
    describe('Response Status Code', () => {
      /**
       * Tests that the handler sets the response status code to 200
       */
      it('should set statusCode to 200', () => {
        // Invoke the request handler with mock objects
        requestHandler(mockReq, mockRes);
        
        // Verify status code is set to 200 OK
        expect(mockRes.statusCode).toBe(200);
      });
      
      /**
       * Tests that the status code is 200 regardless of the request method
       */
      it('should set statusCode to 200 for any HTTP method', () => {
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        
        methods.forEach((method) => {
          const req = createMockRequest({ method });
          const res = createMockResponse();
          
          requestHandler(req, res);
          
          expect(res.statusCode).toBe(200);
        });
      });
    });
    
    // -------------------------------------------------------------------------
    // Response Headers Tests
    // -------------------------------------------------------------------------
    
    describe('Response Headers', () => {
      /**
       * Tests that Content-Type header is set to text/plain
       */
      it('should set Content-Type header to text/plain', () => {
        // Invoke the request handler
        requestHandler(mockReq, mockRes);
        
        // Verify setHeader was called with correct arguments
        expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      });
      
      /**
       * Tests that the Content-Type header value is retrievable
       */
      it('should have text/plain as retrievable Content-Type', () => {
        // Invoke the request handler
        requestHandler(mockReq, mockRes);
        
        // Verify header is stored and retrievable
        expect(mockRes.getHeader('Content-Type')).toBe('text/plain');
      });
      
      /**
       * Tests that setHeader is called exactly once
       */
      it('should call setHeader exactly once', () => {
        // Invoke the request handler
        requestHandler(mockReq, mockRes);
        
        // Verify setHeader was called only once (for Content-Type)
        expect(mockRes.setHeader).toHaveBeenCalledTimes(1);
      });
      
      /**
       * Tests header retrieval is case-insensitive (as per HTTP spec)
       */
      it('should store header in case-insensitive manner', () => {
        // Invoke the request handler
        requestHandler(mockReq, mockRes);
        
        // Verify header is retrievable with different cases
        expect(mockRes.getHeader('content-type')).toBe('text/plain');
        expect(mockRes.getHeader('CONTENT-TYPE')).toBe('text/plain');
      });
    });
    
    // -------------------------------------------------------------------------
    // Response Body Tests
    // -------------------------------------------------------------------------
    
    describe('Response Body', () => {
      /**
       * Tests that response ends with "Hello, World!\n"
       */
      it('should end response with "Hello, World!\\n"', () => {
        // Invoke the request handler
        requestHandler(mockReq, mockRes);
        
        // Verify end() was called with correct body content
        expect(mockRes.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that end() is called exactly once
       */
      it('should call end() exactly once', () => {
        // Invoke the request handler
        requestHandler(mockReq, mockRes);
        
        // Verify end() was called only once
        expect(mockRes.end).toHaveBeenCalledTimes(1);
      });
      
      /**
       * Tests that the response body content is stored correctly
       */
      it('should have correct body content stored', () => {
        // Invoke the request handler
        requestHandler(mockReq, mockRes);
        
        // Verify body content via internal storage
        expect(mockRes._getWrittenData()).toBe('Hello, World!\n');
      });
      
      /**
       * Tests that response body includes newline character
       */
      it('should include trailing newline in response body', () => {
        // Invoke the request handler
        requestHandler(mockReq, mockRes);
        
        // Verify the body ends with newline
        const body = mockRes._getWrittenData();
        expect(body.endsWith('\n')).toBe(true);
        expect(body).toBe('Hello, World!\n');
      });
      
      /**
       * Tests that response is marked as finished after end() is called
       */
      it('should mark response as finished after end()', () => {
        // Invoke the request handler
        requestHandler(mockReq, mockRes);
        
        // Verify response is marked as finished
        expect(mockRes.finished).toBe(true);
      });
    });
    
    // -------------------------------------------------------------------------
    // HTTP Methods Tests
    // -------------------------------------------------------------------------
    
    describe('HTTP Methods', () => {
      /**
       * Tests that GET request returns the expected response
       */
      it('should return same response for GET request', () => {
        const req = createMockRequest({ method: 'GET' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that POST request returns the expected response
       */
      it('should return same response for POST request', () => {
        const req = createMockRequest({ method: 'POST' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that PUT request returns the expected response
       */
      it('should return same response for PUT request', () => {
        const req = createMockRequest({ method: 'PUT' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that DELETE request returns the expected response
       */
      it('should return same response for DELETE request', () => {
        const req = createMockRequest({ method: 'DELETE' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that OPTIONS request returns the expected response
       */
      it('should return same response for OPTIONS request', () => {
        const req = createMockRequest({ method: 'OPTIONS' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that PATCH request returns the expected response
       */
      it('should return same response for PATCH request', () => {
        const req = createMockRequest({ method: 'PATCH' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that HEAD request returns the expected response
       */
      it('should return same response for HEAD request', () => {
        const req = createMockRequest({ method: 'HEAD' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests all standard HTTP methods return identical responses
       */
      it('should return identical response for all HTTP methods', () => {
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
        const responses = [];
        
        methods.forEach((method) => {
          const req = createMockRequest({ method });
          const res = createMockResponse();
          
          requestHandler(req, res);
          
          responses.push({
            method,
            statusCode: res.statusCode,
            contentType: res.getHeader('Content-Type'),
            body: res._getWrittenData()
          });
        });
        
        // All responses should be identical
        responses.forEach((response) => {
          expect(response.statusCode).toBe(200);
          expect(response.contentType).toBe('text/plain');
          expect(response.body).toBe('Hello, World!\n');
        });
      });
    });
    
    // -------------------------------------------------------------------------
    // URL Paths Tests
    // -------------------------------------------------------------------------
    
    describe('URL Paths', () => {
      /**
       * Tests that root path returns the expected response
       */
      it('should return same response for root path /', () => {
        const req = createMockRequest({ url: '/' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that nested path returns the expected response
       */
      it('should return same response for /any/path', () => {
        const req = createMockRequest({ url: '/any/path' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that path with query parameters returns the expected response
       */
      it('should return same response for path with query params', () => {
        const req = createMockRequest({ url: '/search?q=hello&lang=en' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that deeply nested path returns the expected response
       */
      it('should return same response for deeply nested path', () => {
        const req = createMockRequest({ url: '/api/v1/users/123/profile' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that path with fragment returns the expected response
       */
      it('should return same response for path with hash fragment', () => {
        const req = createMockRequest({ url: '/page#section' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that path with special characters returns the expected response
       */
      it('should return same response for path with encoded characters', () => {
        const req = createMockRequest({ url: '/path%20with%20spaces' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that empty URL returns the expected response
       */
      it('should return same response for empty URL', () => {
        const req = createMockRequest({ url: '' });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests all URL variations return identical responses
       */
      it('should return identical response for all URL paths', () => {
        const urls = [
          '/',
          '/about',
          '/api/users',
          '/path/to/resource',
          '/search?q=test',
          '/page?foo=bar&baz=qux',
          '/deeply/nested/path/to/resource'
        ];
        
        urls.forEach((url) => {
          const req = createMockRequest({ url });
          const res = createMockResponse();
          
          requestHandler(req, res);
          
          expect(res.statusCode).toBe(200);
          expect(res.getHeader('Content-Type')).toBe('text/plain');
          expect(res._getWrittenData()).toBe('Hello, World!\n');
        });
      });
    });
    
    // -------------------------------------------------------------------------
    // Request with Headers Tests
    // -------------------------------------------------------------------------
    
    describe('Request with Headers', () => {
      /**
       * Tests that request with custom headers still returns expected response
       */
      it('should return same response regardless of request headers', () => {
        const req = createMockRequest({
          method: 'GET',
          url: '/api',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': 'Bearer token123',
            'user-agent': 'TestClient/1.0',
            'accept-language': 'en-US,en;q=0.9'
          }
        });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
      
      /**
       * Tests that request without headers returns expected response
       */
      it('should return same response for request with empty headers', () => {
        const req = createMockRequest({
          method: 'GET',
          url: '/',
          headers: {}
        });
        const res = createMockResponse();
        
        requestHandler(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(res.end).toHaveBeenCalledWith('Hello, World!\n');
      });
    });
    
    // -------------------------------------------------------------------------
    // Response Operation Order Tests
    // -------------------------------------------------------------------------
    
    describe('Response Operation Order', () => {
      /**
       * Tests that operations are performed in correct order
       * (statusCode, setHeader, end)
       */
      it('should set statusCode before calling setHeader', () => {
        const callOrder = [];
        const res = createMockResponse();
        
        // Override statusCode setter to track when it's set
        let statusCodeValue = 200;
        Object.defineProperty(res, 'statusCode', {
          get: () => statusCodeValue,
          set: (value) => {
            callOrder.push('statusCode');
            statusCodeValue = value;
          }
        });
        
        // Override setHeader to track call order
        const originalSetHeader = res.setHeader;
        res.setHeader = jest.fn((...args) => {
          callOrder.push('setHeader');
          return originalSetHeader.apply(res, args);
        });
        
        // Override end to track call order
        const originalEnd = res.end;
        res.end = jest.fn((...args) => {
          callOrder.push('end');
          return originalEnd.apply(res, args);
        });
        
        requestHandler(mockReq, res);
        
        // Verify correct order: statusCode -> setHeader -> end
        expect(callOrder).toEqual(['statusCode', 'setHeader', 'end']);
      });
    });
  });
  
  // ===========================================================================
  // Handler Extraction Tests
  // ===========================================================================
  
  describe('Handler Extraction', () => {
    /**
     * Tests that the request handler can be extracted from server._events
     */
    it('should have request handler accessible via server._events.request', () => {
      expect(server._events).toBeDefined();
      expect(server._events.request).toBeDefined();
      expect(typeof server._events.request).toBe('function');
    });
    
    /**
     * Tests that the handler is the same function used by the server
     */
    it('should have handler as a two-parameter function', () => {
      const handler = server._events.request;
      
      // The handler should accept request and response parameters
      expect(handler.length).toBe(2);
    });
  });
});

// =============================================================================
// MOCK FACTORY VALIDATION TESTS
// =============================================================================

describe('Mock Factories Integration', () => {
  describe('createMockRequest factory', () => {
    /**
     * Tests that createMockRequest creates valid mock request objects
     */
    it('should create mock request with default GET method', () => {
      const mockReq = createMockRequest();
      
      expect(mockReq.method).toBe('GET');
      expect(mockReq.url).toBe('/');
      expect(mockReq.headers).toEqual({});
      expect(mockReq.httpVersion).toBe('1.1');
    });
    
    /**
     * Tests that mock request options override defaults
     */
    it('should allow customizing all request properties', () => {
      const mockReq = createMockRequest({
        method: 'POST',
        url: '/api/data',
        headers: { 'content-type': 'application/json' },
        httpVersion: '2.0'
      });
      
      expect(mockReq.method).toBe('POST');
      expect(mockReq.url).toBe('/api/data');
      expect(mockReq.headers['content-type']).toBe('application/json');
      expect(mockReq.httpVersion).toBe('2.0');
    });
    
    /**
     * Tests that mock request has event emitter methods
     */
    it('should have Jest mock event emitter methods', () => {
      const mockReq = createMockRequest();
      
      expect(jest.isMockFunction(mockReq.on)).toBe(true);
      expect(jest.isMockFunction(mockReq.once)).toBe(true);
      expect(jest.isMockFunction(mockReq.emit)).toBe(true);
    });
  });
  
  describe('createMockResponse factory', () => {
    /**
     * Tests that createMockResponse creates valid mock response objects
     */
    it('should create mock response with default status 200', () => {
      const mockRes = createMockResponse();
      
      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.finished).toBe(false);
    });
    
    /**
     * Tests that mock response has Jest spy methods
     */
    it('should have Jest spy methods for setHeader and end', () => {
      const mockRes = createMockResponse();
      
      expect(jest.isMockFunction(mockRes.setHeader)).toBe(true);
      expect(jest.isMockFunction(mockRes.end)).toBe(true);
      expect(jest.isMockFunction(mockRes.write)).toBe(true);
    });
    
    /**
     * Tests that mock response tracks header operations correctly
     */
    it('should track headers set via setHeader', () => {
      const mockRes = createMockResponse();
      
      mockRes.setHeader('Content-Type', 'text/plain');
      mockRes.setHeader('X-Custom', 'value');
      
      expect(mockRes.getHeader('content-type')).toBe('text/plain');
      expect(mockRes.getHeader('x-custom')).toBe('value');
    });
    
    /**
     * Tests that mock response tracks body content correctly
     */
    it('should track body content via _getWrittenData', () => {
      const mockRes = createMockResponse();
      
      mockRes.end('Test body');
      
      expect(mockRes._getWrittenData()).toBe('Test body');
      expect(mockRes.finished).toBe(true);
    });
  });
});
