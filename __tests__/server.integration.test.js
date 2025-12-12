/**
 * Integration Tests for server.js
 *
 * This test suite performs full HTTP request/response cycle testing using supertest
 * to make actual HTTP requests to the running server. Tests verify the server's
 * behavior as a complete HTTP service rather than isolated components.
 *
 * Test Coverage:
 * - GET request handling and response verification
 * - POST, PUT, DELETE, OPTIONS, PATCH, HEAD method handling
 * - Response body content verification ("Hello, World!\n")
 * - HTTP status code validation (200 OK)
 * - Content-Type header assertions (text/plain)
 * - URL path handling (various paths return same response)
 * - Concurrent simultaneous request handling
 * - Request header processing
 *
 * @module __tests__/server.integration.test.js
 * @requires supertest - HTTP assertion library for integration testing
 * @requires ../server - Server instance for testing
 */

'use strict';

const request = require('supertest');
const { server } = require('../server');

/**
 * Server Integration Tests
 *
 * Tests the HTTP server as a running service through actual HTTP protocol interactions.
 * supertest handles ephemeral port binding automatically, eliminating the need for
 * manual port management and avoiding conflicts with the default port 3000.
 */
describe('Server Integration Tests', () => {
  /**
   * Cleanup hook - ensures the server is properly closed after all tests complete.
   * This prevents resource leaks and hanging test processes.
   * Checks if server exists and is actively listening before attempting to close.
   */
  afterAll(async () => {
    // Ensure server is closed after all tests to prevent resource leaks
    if (server && server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  /**
   * GET Request Test Suite
   *
   * Tests HTTP GET request handling including:
   * - Root path requests
   * - Various URL paths (server returns same response for any path)
   * - Query parameter handling
   * - Response body, status code, and header verification
   */
  describe('GET Requests', () => {
    it('should return 200 OK for GET /', async () => {
      const response = await request(server).get('/');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should return same response for any path', async () => {
      const response = await request(server).get('/any/path');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should handle query parameters', async () => {
      const response = await request(server).get('/?foo=bar');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should handle complex query strings', async () => {
      const response = await request(server).get('/?name=test&value=123&flag=true');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should handle deeply nested paths', async () => {
      const response = await request(server).get('/api/v1/users/123/profile');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should handle paths with file extensions', async () => {
      const response = await request(server).get('/static/style.css');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should handle URL encoded paths', async () => {
      const response = await request(server).get('/path%20with%20spaces');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should handle paths with special characters', async () => {
      const response = await request(server).get('/path-with_special.chars');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });
  });

  /**
   * Other HTTP Methods Test Suite
   *
   * Tests that the server responds identically to all HTTP methods.
   * The current server implementation does not differentiate between methods
   * and returns the same "Hello, World!" response for all requests.
   */
  describe('Other HTTP Methods', () => {
    it('should return 200 OK for POST request', async () => {
      const response = await request(server).post('/');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should return 200 OK for PUT request', async () => {
      const response = await request(server).put('/');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should return 200 OK for DELETE request', async () => {
      const response = await request(server).delete('/');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should return 200 OK for OPTIONS request', async () => {
      const response = await request(server).options('/');

      expect(response.status).toBe(200);
    });

    it('should return 200 OK for PATCH request', async () => {
      const response = await request(server).patch('/');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should return 200 OK for HEAD request', async () => {
      const response = await request(server).head('/');

      expect(response.status).toBe(200);
      // HEAD requests should not have a body
      expect(response.text).toBe('');
    });

    it('should handle POST request with JSON body', async () => {
      const response = await request(server)
        .post('/')
        .send({ key: 'value', nested: { data: 'test' } })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should handle POST request with form data', async () => {
      const response = await request(server)
        .post('/')
        .send('field1=value1&field2=value2')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should handle PUT request with body', async () => {
      const response = await request(server)
        .put('/resource/123')
        .send({ updated: true })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should handle PATCH request with body', async () => {
      const response = await request(server)
        .patch('/resource/456')
        .send({ partial: 'update' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });
  });

  /**
   * Response Headers Test Suite
   *
   * Validates that the server sets the correct headers on all responses.
   * Currently verifies Content-Type is set to text/plain.
   */
  describe('Response Headers', () => {
    it('should set Content-Type to text/plain', async () => {
      const response = await request(server).get('/');

      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should set Content-Type header regardless of request path', async () => {
      const response = await request(server).get('/some/random/path');

      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should set Content-Type header regardless of HTTP method', async () => {
      const getResponse = await request(server).get('/');
      const postResponse = await request(server).post('/');
      const putResponse = await request(server).put('/');

      expect(getResponse.headers['content-type']).toBe('text/plain');
      expect(postResponse.headers['content-type']).toBe('text/plain');
      expect(putResponse.headers['content-type']).toBe('text/plain');
    });

    it('should include standard HTTP headers', async () => {
      const response = await request(server).get('/');

      // Content-Type should always be present
      expect(response.headers['content-type']).toBeDefined();

      // Response should have Date header (standard HTTP)
      expect(response.headers['date']).toBeDefined();
    });
  });

  /**
   * Response Body Verification Test Suite
   *
   * Thoroughly tests the response body content to ensure it exactly matches
   * the expected "Hello, World!\n" string including the newline character.
   */
  describe('Response Body Verification', () => {
    it('should return exact "Hello, World!\\n" body', async () => {
      const response = await request(server).get('/');

      expect(response.text).toBe('Hello, World!\n');
    });

    it('should include newline character at end of response', async () => {
      const response = await request(server).get('/');

      expect(response.text.endsWith('\n')).toBe(true);
    });

    it('should return string type response', async () => {
      const response = await request(server).get('/');

      expect(typeof response.text).toBe('string');
    });

    it('should return response of correct length', async () => {
      const response = await request(server).get('/');

      // "Hello, World!\n" is 14 characters
      expect(response.text.length).toBe(14);
    });

    it('should contain "Hello, World!" in response', async () => {
      const response = await request(server).get('/');

      expect(response.text).toContain('Hello, World!');
    });

    it('should return same body for different HTTP methods', async () => {
      const getResponse = await request(server).get('/');
      const postResponse = await request(server).post('/');
      const putResponse = await request(server).put('/');
      const deleteResponse = await request(server).delete('/');
      const patchResponse = await request(server).patch('/');

      const expectedBody = 'Hello, World!\n';

      expect(getResponse.text).toBe(expectedBody);
      expect(postResponse.text).toBe(expectedBody);
      expect(putResponse.text).toBe(expectedBody);
      expect(deleteResponse.text).toBe(expectedBody);
      expect(patchResponse.text).toBe(expectedBody);
    });
  });

  /**
   * Status Code Verification Test Suite
   *
   * Validates that the server returns HTTP 200 OK status for all requests.
   */
  describe('Status Code Verification', () => {
    it('should return 200 status code for root path', async () => {
      const response = await request(server).get('/');

      expect(response.status).toBe(200);
      expect(response.statusCode).toBe(200);
    });

    it('should return 200 status code for nested paths', async () => {
      const response = await request(server).get('/deeply/nested/path/here');

      expect(response.status).toBe(200);
    });

    it('should return 200 status code for all HTTP methods', async () => {
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

      for (const method of methods) {
        const response = await request(server)[method]('/');
        expect(response.status).toBe(200);
      }
    });

    it('should have ok property set to true', async () => {
      const response = await request(server).get('/');

      expect(response.ok).toBe(true);
    });

    it('should not return error status codes', async () => {
      const response = await request(server).get('/nonexistent');

      // Server returns 200 for all paths, not 404
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(500);
      expect(response.status).toBeLessThan(400);
    });
  });

  /**
   * Concurrent Requests Test Suite
   *
   * Tests the server's ability to handle multiple simultaneous requests.
   * Verifies that all concurrent requests receive correct responses.
   */
  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array(10).fill().map(() =>
        request(server).get('/')
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.text).toBe('Hello, World!\n');
      });
    });

    it('should handle concurrent requests to different paths', async () => {
      const paths = [
        '/',
        '/path1',
        '/path2',
        '/api/users',
        '/api/data',
        '/static/file.js',
        '/nested/deep/path',
        '/?query=param',
        '/another/route',
        '/final/path'
      ];

      const promises = paths.map((path) =>
        request(server).get(path)
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.text).toBe('Hello, World!\n');
      });
    });

    it('should handle concurrent requests with different methods', async () => {
      const requests = [
        request(server).get('/'),
        request(server).post('/'),
        request(server).put('/'),
        request(server).delete('/'),
        request(server).patch('/')
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.text).toBe('Hello, World!\n');
      });
    });

    it('should maintain response consistency under load', async () => {
      // Send 20 concurrent requests
      const promises = Array(20).fill().map((_, index) =>
        request(server).get(`/request-${index}`)
      );

      const responses = await Promise.all(promises);

      // All responses should be identical
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.text).toBe('Hello, World!\n');
        expect(response.headers['content-type']).toBe('text/plain');
      });
    });

    it('should handle rapid sequential requests', async () => {
      // Send 5 requests in quick succession
      for (let i = 0; i < 5; i++) {
        const response = await request(server).get('/');

        expect(response.status).toBe(200);
        expect(response.text).toBe('Hello, World!\n');
      }
    });
  });

  /**
   * Request Headers Test Suite
   *
   * Tests that the server accepts and processes requests with various headers.
   * The server ignores request headers but should still respond correctly.
   */
  describe('Request Headers', () => {
    it('should accept requests with custom headers', async () => {
      const response = await request(server)
        .get('/')
        .set('X-Custom-Header', 'custom-value')
        .set('X-Another-Header', 'another-value');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should accept requests with Authorization header', async () => {
      const response = await request(server)
        .get('/')
        .set('Authorization', 'Bearer token123');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should accept requests with Accept header', async () => {
      const response = await request(server)
        .get('/')
        .set('Accept', 'text/plain');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should accept requests with Accept-Encoding header', async () => {
      const response = await request(server)
        .get('/')
        .set('Accept-Encoding', 'gzip, deflate, br');

      expect(response.status).toBe(200);
    });

    it('should accept requests with User-Agent header', async () => {
      const response = await request(server)
        .get('/')
        .set('User-Agent', 'TestClient/1.0');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should accept requests with Content-Type header', async () => {
      const response = await request(server)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' });

      expect(response.status).toBe(200);
    });

    it('should accept requests with multiple standard headers', async () => {
      const response = await request(server)
        .get('/')
        .set('Accept', 'text/plain')
        .set('Accept-Language', 'en-US,en;q=0.9')
        .set('Accept-Encoding', 'gzip')
        .set('Cache-Control', 'no-cache')
        .set('Connection', 'keep-alive');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });
  });

  /**
   * Edge Cases Test Suite
   *
   * Tests unusual or boundary conditions that the server should handle gracefully.
   */
  describe('Edge Cases', () => {
    it('should handle empty path components', async () => {
      const response = await request(server).get('//');

      expect(response.status).toBe(200);
    });

    it('should handle trailing slashes', async () => {
      const response = await request(server).get('/path/');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should handle very long paths', async () => {
      const longPath = '/a'.repeat(100);
      const response = await request(server).get(longPath);

      expect(response.status).toBe(200);
    });

    it('should handle requests with empty body', async () => {
      const response = await request(server)
        .post('/')
        .send('');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should handle requests with large headers', async () => {
      const largeHeaderValue = 'x'.repeat(1000);
      const response = await request(server)
        .get('/')
        .set('X-Large-Header', largeHeaderValue);

      expect(response.status).toBe(200);
    });

    it('should handle paths with unicode characters', async () => {
      const response = await request(server).get('/日本語/路径');

      expect(response.status).toBe(200);
    });

    it('should handle multiple query parameters with same key', async () => {
      const response = await request(server).get('/?key=value1&key=value2&key=value3');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should handle fragment identifiers in URL (stripped by HTTP)', async () => {
      // Note: Fragment identifiers are typically stripped by HTTP clients
      // This tests that the base path still works
      const response = await request(server).get('/page');

      expect(response.status).toBe(200);
    });
  });
});
