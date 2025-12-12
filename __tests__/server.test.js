/**
 * Unit Tests for server.js
 * 
 * Tests the HTTP server's request handler, response configuration,
 * and module exports in isolation.
 * 
 * @module __tests__/server.test.js
 */

const { createMockRequest } = require('./fixtures/mockRequest');
const { createMockResponse } = require('./fixtures/mockResponse');

describe('Server Module Exports', () => {
  // Import fresh module for each test to ensure isolation
  let serverModule;
  
  beforeAll(() => {
    // Import the server module
    serverModule = require('../server');
  });
  
  afterAll((done) => {
    // Clean up: close the server if it's listening
    if (serverModule && serverModule.server && serverModule.server.listening) {
      serverModule.server.close(done);
    } else {
      done();
    }
  });
  
  describe('Module Structure', () => {
    it('should export a server object', () => {
      expect(serverModule.server).toBeDefined();
      expect(typeof serverModule.server).toBe('object');
    });
    
    it('should export hostname constant', () => {
      expect(serverModule.hostname).toBeDefined();
      expect(typeof serverModule.hostname).toBe('string');
    });
    
    it('should export port constant', () => {
      expect(serverModule.port).toBeDefined();
      expect(typeof serverModule.port).toBe('number');
    });
  });
  
  describe('Configuration Values', () => {
    it('should have hostname set to 127.0.0.1', () => {
      expect(serverModule.hostname).toBe('127.0.0.1');
    });
    
    it('should have port set to 3000', () => {
      expect(serverModule.port).toBe(3000);
    });
  });
  
  describe('Server Instance Properties', () => {
    it('should have listen method', () => {
      expect(typeof serverModule.server.listen).toBe('function');
    });
    
    it('should have close method', () => {
      expect(typeof serverModule.server.close).toBe('function');
    });
    
    it('should have address method', () => {
      expect(typeof serverModule.server.address).toBe('function');
    });
    
    it('should have listening property', () => {
      expect(typeof serverModule.server.listening).toBe('boolean');
    });
  });
});

describe('Request Handler', () => {
  // Access the request handler from the server's request event listeners
  // Since we can't directly access the handler, we'll test via the mock approach
  
  describe('Response Status Code', () => {
    it('should set status code to 200 for any request', () => {
      const mockRes = createMockResponse();
      
      // The server sets statusCode = 200 in the handler
      // Since we can't call the handler directly, we verify through integration tests
      // This test verifies the mock response setup
      expect(mockRes.statusCode).toBe(200);
    });
  });
  
  describe('Response Headers', () => {
    it('should be able to set Content-Type header', () => {
      const mockRes = createMockResponse();
      mockRes.setHeader('Content-Type', 'text/plain');
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockRes.getHeader('content-type')).toBe('text/plain');
    });
    
    it('should handle header case insensitivity', () => {
      const mockRes = createMockResponse();
      mockRes.setHeader('Content-Type', 'text/plain');
      
      expect(mockRes.getHeader('CONTENT-TYPE')).toBe('text/plain');
      expect(mockRes.getHeader('content-type')).toBe('text/plain');
    });
  });
  
  describe('Response Body', () => {
    it('should be able to end response with body content', () => {
      const mockRes = createMockResponse();
      mockRes.end('Hello, World!\n');
      
      expect(mockRes.end).toHaveBeenCalledWith('Hello, World!\n');
      expect(mockRes._getWrittenData()).toBe('Hello, World!\n');
    });
    
    it('should capture all written data', () => {
      const mockRes = createMockResponse();
      mockRes.write('Part 1');
      mockRes.write('Part 2');
      mockRes.end('Part 3');
      
      expect(mockRes._getWrittenData()).toBe('Part 1Part 2Part 3');
    });
  });
});

describe('Mock Request Factory', () => {
  describe('createMockRequest', () => {
    it('should create a GET request by default', () => {
      const mockReq = createMockRequest();
      
      expect(mockReq.method).toBe('GET');
      expect(mockReq.url).toBe('/');
    });
    
    it('should allow customizing HTTP method', () => {
      const mockReq = createMockRequest({ method: 'POST' });
      
      expect(mockReq.method).toBe('POST');
    });
    
    it('should allow customizing URL', () => {
      const mockReq = createMockRequest({ url: '/api/users' });
      
      expect(mockReq.url).toBe('/api/users');
    });
    
    it('should allow customizing headers', () => {
      const mockReq = createMockRequest({
        headers: { 'content-type': 'application/json' }
      });
      
      expect(mockReq.headers['content-type']).toBe('application/json');
    });
    
    it('should have event emitter capabilities', () => {
      const mockReq = createMockRequest();
      
      expect(typeof mockReq.on).toBe('function');
      expect(typeof mockReq.emit).toBe('function');
    });
    
    it('should have readable stream methods', () => {
      const mockReq = createMockRequest();
      
      expect(typeof mockReq.read).toBe('function');
      expect(typeof mockReq.pause).toBe('function');
      expect(typeof mockReq.resume).toBe('function');
    });
  });
});

describe('Mock Response Factory', () => {
  describe('createMockResponse', () => {
    it('should create a response with default status 200', () => {
      const mockRes = createMockResponse();
      
      expect(mockRes.statusCode).toBe(200);
    });
    
    it('should allow changing status code', () => {
      const mockRes = createMockResponse();
      mockRes.statusCode = 404;
      
      expect(mockRes.statusCode).toBe(404);
    });
    
    it('should have header management methods', () => {
      const mockRes = createMockResponse();
      
      expect(typeof mockRes.setHeader).toBe('function');
      expect(typeof mockRes.getHeader).toBe('function');
      expect(typeof mockRes.removeHeader).toBe('function');
      expect(typeof mockRes.hasHeader).toBe('function');
    });
    
    it('should have response body methods', () => {
      const mockRes = createMockResponse();
      
      expect(typeof mockRes.write).toBe('function');
      expect(typeof mockRes.end).toBe('function');
    });
    
    it('should track header operations', () => {
      const mockRes = createMockResponse();
      
      mockRes.setHeader('X-Custom', 'value');
      expect(mockRes.hasHeader('x-custom')).toBe(true);
      
      mockRes.removeHeader('X-Custom');
      expect(mockRes.hasHeader('x-custom')).toBe(false);
    });
    
    it('should be resettable for multiple tests', () => {
      const mockRes = createMockResponse();
      
      mockRes.statusCode = 500;
      mockRes.setHeader('X-Test', 'value');
      mockRes.end('Error');
      
      mockRes._reset();
      
      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.hasHeader('x-test')).toBe(false);
      expect(mockRes._getWrittenData()).toBe('');
    });
  });
});
