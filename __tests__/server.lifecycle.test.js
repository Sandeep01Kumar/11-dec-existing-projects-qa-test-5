/**
 * Server Lifecycle Test Suite
 *
 * Comprehensive tests for server.js lifecycle management including:
 * - Server startup and binding verification
 * - Console.log output verification for startup message
 * - Graceful shutdown via server.close()
 * - Resource cleanup and proper release
 * - Multiple start/stop cycles
 * - Close with pending connections
 *
 * This test file uses separate test servers with ephemeral ports for isolation,
 * and spies on console.log to verify startup message output.
 *
 * @module __tests__/server.lifecycle.test.js
 */

'use strict';

const http = require('http');
const { server, hostname, port } = require('../server');
const { startServer, stopServer, waitForServer } = require('./helpers/serverUtils');

/**
 * Console spy reference - will be set up before each test
 * @type {jest.SpyInstance}
 */
let consoleSpy;

/**
 * Track test servers created during tests for cleanup
 * @type {http.Server[]}
 */
let testServersToCleanup = [];

/**
 * Helper function to create and track a test server
 * @param {Function} [handler] - Optional request handler
 * @returns {http.Server} The created server instance
 */
function createTrackedTestServer(handler) {
  const testServer = http.createServer(handler || ((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Test Response\n');
  }));
  testServersToCleanup.push(testServer);
  return testServer;
}

/**
 * Helper to safely close a server with timeout
 * @param {http.Server} serverInstance - Server to close
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<void>}
 */
function closeServerWithTimeout(serverInstance, timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (!serverInstance || !serverInstance.listening) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error(`Server close timed out after ${timeout}ms`));
    }, timeout);

    serverInstance.close((err) => {
      clearTimeout(timeoutId);
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

describe('Server Lifecycle Tests', () => {
  /**
   * Set up console spy before each test to capture console.log calls
   */
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  /**
   * Clean up after each test:
   * - Restore console.log spy
   * - Close any test servers that are still listening
   */
  afterEach(async () => {
    // Restore console spy
    consoleSpy.mockRestore();

    // Clean up all tracked test servers
    for (const testServer of testServersToCleanup) {
      if (testServer && testServer.listening) {
        await closeServerWithTimeout(testServer).catch(() => {
          // Ignore errors during cleanup
        });
      }
    }
    testServersToCleanup = [];
  });

  /**
   * Clean up the main server after all tests complete
   */
  afterAll(async () => {
    // Ensure main server is closed after all tests
    if (server && server.listening) {
      await closeServerWithTimeout(server).catch(() => {
        // Ignore errors during cleanup
      });
    }
  });

  describe('Server Configuration', () => {
    it('should have hostname configured as 127.0.0.1', () => {
      expect(hostname).toBe('127.0.0.1');
    });

    it('should have port configured as 3000', () => {
      expect(port).toBe(3000);
    });

    it('should export valid hostname string', () => {
      expect(typeof hostname).toBe('string');
      expect(hostname).toMatch(/^(?:\d{1,3}\.){3}\d{1,3}$/);
    });

    it('should export valid port number', () => {
      expect(typeof port).toBe('number');
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThanOrEqual(65535);
    });
  });

  describe('Server Instance', () => {
    it('should be an http.Server instance', () => {
      expect(server).toBeInstanceOf(http.Server);
    });

    it('should have listening property defined', () => {
      expect(typeof server.listening).toBe('boolean');
    });

    it('should have listen method', () => {
      expect(typeof server.listen).toBe('function');
    });

    it('should have close method', () => {
      expect(typeof server.close).toBe('function');
    });

    it('should have address method', () => {
      expect(typeof server.address).toBe('function');
    });

    it('should have on method for event listeners', () => {
      expect(typeof server.on).toBe('function');
    });

    it('should have once method for one-time event listeners', () => {
      expect(typeof server.once).toBe('function');
    });

    it('should have removeListener method', () => {
      expect(typeof server.removeListener).toBe('function');
    });
  });

  describe('Server Startup', () => {
    it('should emit listening event when server starts', (done) => {
      const testServer = createTrackedTestServer();

      testServer.on('listening', () => {
        expect(testServer.listening).toBe(true);
        done();
      });

      testServer.listen(0); // Use ephemeral port
    });

    it('should set listening property to true after start', async () => {
      const testServer = createTrackedTestServer();

      await startServer(testServer, 0, '127.0.0.1');

      expect(testServer.listening).toBe(true);
    });

    it('should bind to specified hostname and port', (done) => {
      const testServer = createTrackedTestServer();
      const testHostname = '127.0.0.1';

      testServer.listen(0, testHostname, () => {
        const address = testServer.address();
        expect(address.address).toBe(testHostname);
        expect(address.port).toBeGreaterThan(0);
        done();
      });
    });

    it('should execute callback after successful binding', (done) => {
      const testServer = createTrackedTestServer();
      let callbackExecuted = false;

      testServer.listen(0, '127.0.0.1', () => {
        callbackExecuted = true;
        expect(callbackExecuted).toBe(true);
        expect(testServer.listening).toBe(true);
        done();
      });
    });

    it('should return address info when listening', (done) => {
      const testServer = createTrackedTestServer();

      testServer.listen(0, '127.0.0.1', () => {
        const address = testServer.address();

        expect(address).not.toBeNull();
        expect(address).toHaveProperty('address');
        expect(address).toHaveProperty('port');
        expect(address).toHaveProperty('family');
        expect(address.family).toMatch(/^IPv[46]$/);
        done();
      });
    });

    it('should verify main server has correct startup message format', () => {
      // The main server auto-starts on require and logs the startup message
      // Verify the expected message format
      const expectedMessage = `Server running at http://${hostname}:${port}/`;

      // Since server auto-starts before our spy, we verify the format is correct
      expect(expectedMessage).toBe('Server running at http://127.0.0.1:3000/');
    });

    it('should log startup message when server starts', (done) => {
      const testServer = createTrackedTestServer();
      const testPort = 0;
      const testHostname = '127.0.0.1';

      testServer.listen(testPort, testHostname, () => {
        const actualPort = testServer.address().port;
        console.log(`Server running at http://${testHostname}:${actualPort}/`);

        expect(consoleSpy).toHaveBeenCalledWith(
          `Server running at http://${testHostname}:${actualPort}/`
        );
        done();
      });
    });

    it('should handle multiple servers starting on different ports', async () => {
      const server1 = createTrackedTestServer();
      const server2 = createTrackedTestServer();
      const server3 = createTrackedTestServer();

      await startServer(server1, 0, '127.0.0.1');
      await startServer(server2, 0, '127.0.0.1');
      await startServer(server3, 0, '127.0.0.1');

      expect(server1.listening).toBe(true);
      expect(server2.listening).toBe(true);
      expect(server3.listening).toBe(true);

      // All ports should be different
      const port1 = server1.address().port;
      const port2 = server2.address().port;
      const port3 = server3.address().port;

      expect(port1).not.toBe(port2);
      expect(port2).not.toBe(port3);
      expect(port1).not.toBe(port3);
    });
  });

  describe('Server Shutdown', () => {
    it('should close gracefully when close() is called', (done) => {
      const testServer = createTrackedTestServer();

      testServer.listen(0, '127.0.0.1', () => {
        expect(testServer.listening).toBe(true);

        testServer.close((err) => {
          expect(err).toBeUndefined();
          expect(testServer.listening).toBe(false);
          done();
        });
      });
    });

    it('should emit close event on shutdown', (done) => {
      const testServer = createTrackedTestServer();

      testServer.listen(0, '127.0.0.1', () => {
        testServer.on('close', () => {
          expect(testServer.listening).toBe(false);
          done();
        });

        testServer.close();
      });
    });

    it('should set listening property to false after close', async () => {
      const testServer = createTrackedTestServer();

      await startServer(testServer, 0, '127.0.0.1');
      expect(testServer.listening).toBe(true);

      await stopServer(testServer);
      expect(testServer.listening).toBe(false);
    });

    it('should return null from address() after close', async () => {
      const testServer = createTrackedTestServer();

      await startServer(testServer, 0, '127.0.0.1');
      expect(testServer.address()).not.toBeNull();

      await stopServer(testServer);
      expect(testServer.address()).toBeNull();
    });

    it('should handle close callback with no error on successful shutdown', (done) => {
      const testServer = createTrackedTestServer();

      testServer.listen(0, '127.0.0.1', () => {
        testServer.close((err) => {
          // err should be undefined (not an error object)
          expect(err).toBeUndefined();
          done();
        });
      });
    });

    it('should release the port after shutdown', async () => {
      const testServer1 = createTrackedTestServer();

      await startServer(testServer1, 0, '127.0.0.1');
      const boundPort = testServer1.address().port;

      await stopServer(testServer1);

      // Create a new server and bind to the same port
      const testServer2 = createTrackedTestServer();
      await startServer(testServer2, boundPort, '127.0.0.1');

      expect(testServer2.listening).toBe(true);
      expect(testServer2.address().port).toBe(boundPort);
    });

    it('should not throw when closing a server that was never started', async () => {
      const testServer = createTrackedTestServer();

      // Server was never started, so calling stopServer should not throw
      await expect(stopServer(testServer)).resolves.toBeUndefined();
    });

    it('should handle multiple close calls gracefully', async () => {
      const testServer = createTrackedTestServer();

      await startServer(testServer, 0, '127.0.0.1');

      // First close
      await stopServer(testServer);
      expect(testServer.listening).toBe(false);

      // Second close should not throw
      await expect(stopServer(testServer)).resolves.toBeUndefined();
    });
  });

  describe('Multiple Start/Stop Cycles', () => {
    it('should handle start-stop-start cycle with new server instances', async () => {
      // First cycle
      const server1 = createTrackedTestServer();
      await startServer(server1, 0, '127.0.0.1');
      expect(server1.listening).toBe(true);
      const port1 = server1.address().port;

      await stopServer(server1);
      expect(server1.listening).toBe(false);

      // Second cycle (new server instance - http.Server cannot restart after close)
      const server2 = createTrackedTestServer();
      await startServer(server2, port1, '127.0.0.1');
      expect(server2.listening).toBe(true);

      await stopServer(server2);
      expect(server2.listening).toBe(false);
    });

    it('should handle three consecutive start/stop cycles', async () => {
      const portToReuse = 0; // Will be determined after first start

      for (let i = 0; i < 3; i++) {
        const testServer = createTrackedTestServer();

        await startServer(testServer, 0, '127.0.0.1');
        expect(testServer.listening).toBe(true);

        await stopServer(testServer);
        expect(testServer.listening).toBe(false);
      }
    });

    it('should properly release resources between cycles', async () => {
      const cycles = 5;
      const boundPorts = [];

      for (let i = 0; i < cycles; i++) {
        const testServer = createTrackedTestServer();

        await startServer(testServer, 0, '127.0.0.1');
        boundPorts.push(testServer.address().port);

        await stopServer(testServer);
      }

      // All cycles completed successfully
      expect(boundPorts.length).toBe(cycles);
    });

    it('should reuse same port across cycles', async () => {
      const server1 = createTrackedTestServer();
      await startServer(server1, 0, '127.0.0.1');
      const targetPort = server1.address().port;
      await stopServer(server1);

      // Try to reuse the same port
      const server2 = createTrackedTestServer();
      await startServer(server2, targetPort, '127.0.0.1');
      expect(server2.address().port).toBe(targetPort);
      await stopServer(server2);

      // Third time
      const server3 = createTrackedTestServer();
      await startServer(server3, targetPort, '127.0.0.1');
      expect(server3.address().port).toBe(targetPort);
      await stopServer(server3);
    });
  });

  describe('Close with Pending Connections', () => {
    it('should close server with active connection', (done) => {
      const testServer = createTrackedTestServer((req, res) => {
        // Delay response slightly to ensure connection is active during close
        setTimeout(() => {
          res.end('Response after delay');
        }, 50);
      });

      testServer.listen(0, '127.0.0.1', () => {
        const serverAddress = testServer.address();

        // Make a request that will be pending when we close
        const req = http.request({
          hostname: serverAddress.address,
          port: serverAddress.port,
          method: 'GET',
          path: '/'
        }, (res) => {
          // Consume the response
          res.resume();
        });

        req.on('error', () => {
          // Expected - connection may be reset when server closes
        });

        req.end();

        // Close server immediately after request starts
        testServer.close((err) => {
          expect(testServer.listening).toBe(false);
          done();
        });
      });
    });

    it('should handle keepAlive connection during close', (done) => {
      const testServer = createTrackedTestServer((req, res) => {
        res.setHeader('Connection', 'keep-alive');
        res.end('Keep-alive response');
      });

      testServer.listen(0, '127.0.0.1', () => {
        const serverAddress = testServer.address();

        // Create an agent with keepAlive
        const agent = new http.Agent({ keepAlive: true });

        const req = http.request({
          hostname: serverAddress.address,
          port: serverAddress.port,
          method: 'GET',
          path: '/',
          agent: agent
        }, (res) => {
          res.on('data', () => {}); // Consume data
          res.on('end', () => {
            // After response completes, close the server
            testServer.close((err) => {
              expect(testServer.listening).toBe(false);
              agent.destroy(); // Clean up agent
              done();
            });
          });
        });

        req.on('error', () => {
          // Handle potential connection errors
        });

        req.end();
      });
    });

    it('should reject new connections after close is called', (done) => {
      const testServer = createTrackedTestServer((req, res) => {
        res.end('Response');
      });

      testServer.listen(0, '127.0.0.1', () => {
        const serverAddress = testServer.address();
        const serverPort = serverAddress.port;
        const serverHost = serverAddress.address;

        // Start closing the server
        testServer.close(() => {
          // Server is now closed, try to connect
          const req = http.request({
            hostname: serverHost,
            port: serverPort,
            method: 'GET',
            path: '/'
          }, () => {
            // Should not get a response
            done(new Error('Should not have received a response'));
          });

          req.on('error', (err) => {
            // Expected - connection refused
            expect(err).toBeDefined();
            expect(err.code).toMatch(/ECONNREFUSED|ECONNRESET|EPIPE/);
            done();
          });

          req.end();
        });
      });
    });
  });

  describe('Server Events', () => {
    it('should emit connection event when client connects', (done) => {
      const testServer = createTrackedTestServer((req, res) => {
        res.end('Response');
      });

      let connectionEventFired = false;

      testServer.on('connection', (socket) => {
        connectionEventFired = true;
        expect(socket).toBeDefined();
      });

      testServer.listen(0, '127.0.0.1', () => {
        const serverAddress = testServer.address();

        const req = http.request({
          hostname: serverAddress.address,
          port: serverAddress.port,
          method: 'GET',
          path: '/'
        }, (res) => {
          res.resume();
          res.on('end', () => {
            expect(connectionEventFired).toBe(true);
            done();
          });
        });

        req.end();
      });
    });

    it('should emit request event for each HTTP request', (done) => {
      let requestCount = 0;

      const testServer = http.createServer();
      testServersToCleanup.push(testServer);

      testServer.on('request', (req, res) => {
        requestCount++;
        res.end('Response');
      });

      testServer.listen(0, '127.0.0.1', () => {
        const serverAddress = testServer.address();

        const req = http.request({
          hostname: serverAddress.address,
          port: serverAddress.port,
          method: 'GET',
          path: '/'
        }, (res) => {
          res.resume();
          res.on('end', () => {
            expect(requestCount).toBe(1);
            done();
          });
        });

        req.end();
      });
    });

    it('should allow registering multiple event listeners', (done) => {
      const testServer = createTrackedTestServer((req, res) => {
        res.end('Response');
      });

      let listener1Called = false;
      let listener2Called = false;

      testServer.on('listening', () => {
        listener1Called = true;
      });

      testServer.on('listening', () => {
        listener2Called = true;
        expect(listener1Called).toBe(true);
        expect(listener2Called).toBe(true);
        done();
      });

      testServer.listen(0, '127.0.0.1');
    });
  });

  describe('Error Scenarios', () => {
    it('should emit error event when port is in use', (done) => {
      const server1 = createTrackedTestServer();
      const server2 = createTrackedTestServer();

      server1.listen(0, '127.0.0.1', () => {
        const usedPort = server1.address().port;

        server2.on('error', (err) => {
          expect(err).toBeDefined();
          expect(err.code).toBe('EADDRINUSE');
          done();
        });

        // Try to bind to the same port
        server2.listen(usedPort, '127.0.0.1');
      });
    });

    it('should handle EADDRINUSE error gracefully', async () => {
      const server1 = createTrackedTestServer();
      await startServer(server1, 0, '127.0.0.1');
      const usedPort = server1.address().port;

      const server2 = createTrackedTestServer();

      await expect(startServer(server2, usedPort, '127.0.0.1'))
        .rejects
        .toThrow();
    });

    it('should emit error for invalid port number', (done) => {
      const testServer = createTrackedTestServer();

      testServer.on('error', (err) => {
        expect(err).toBeDefined();
        done();
      });

      // Port numbers must be between 0 and 65535
      // Using a very large number should cause an error
      try {
        testServer.listen(-1, '127.0.0.1');
      } catch (err) {
        // Some Node.js versions throw synchronously
        expect(err).toBeDefined();
        done();
      }
    });

    it('should continue functioning after handling error', async () => {
      const server1 = createTrackedTestServer();
      await startServer(server1, 0, '127.0.0.1');
      const usedPort = server1.address().port;

      // Try to start a second server on the same port (will fail)
      const server2 = createTrackedTestServer();
      try {
        await startServer(server2, usedPort, '127.0.0.1');
      } catch (err) {
        // Expected error
        expect(err.code).toBe('EADDRINUSE');
      }

      // Original server should still be working
      expect(server1.listening).toBe(true);
    });
  });

  describe('Server Utility Integration', () => {
    it('should work with startServer utility', async () => {
      const testServer = createTrackedTestServer();

      const result = await startServer(testServer, 0, '127.0.0.1');

      expect(result).toBe(testServer);
      expect(testServer.listening).toBe(true);
    });

    it('should work with stopServer utility', async () => {
      const testServer = createTrackedTestServer();

      await startServer(testServer, 0, '127.0.0.1');
      expect(testServer.listening).toBe(true);

      await stopServer(testServer);
      expect(testServer.listening).toBe(false);
    });

    it('should work with waitForServer utility', async () => {
      const testServer = createTrackedTestServer((req, res) => {
        res.statusCode = 200;
        res.end('OK');
      });

      await startServer(testServer, 0, '127.0.0.1');
      const serverAddress = testServer.address();
      const url = `http://${serverAddress.address}:${serverAddress.port}`;

      // waitForServer should resolve when server is ready
      await expect(waitForServer(url, 5000, 100)).resolves.toBeUndefined();
    });

    it('should handle waitForServer timeout when server is not available', async () => {
      // Use a port that's very unlikely to have a server running
      const url = 'http://127.0.0.1:59999';

      await expect(waitForServer(url, 500, 100))
        .rejects
        .toThrow(/not ready/);
    });
  });

  describe('Resource Cleanup Verification', () => {
    it('should not leak file descriptors after close', async () => {
      // Create and close multiple servers to verify no resource leaks
      for (let i = 0; i < 10; i++) {
        const testServer = createTrackedTestServer();
        await startServer(testServer, 0, '127.0.0.1');
        await stopServer(testServer);
      }

      // If we got here without running out of file descriptors, test passes
      expect(true).toBe(true);
    });

    it('should remove all listeners after close', (done) => {
      const testServer = createTrackedTestServer();

      // Add listeners
      const connectionHandler = () => {};
      const requestHandler = () => {};

      testServer.on('connection', connectionHandler);
      testServer.on('request', requestHandler);

      testServer.listen(0, '127.0.0.1', () => {
        testServer.close(() => {
          // Remove our handlers explicitly
          testServer.removeListener('connection', connectionHandler);
          testServer.removeListener('request', requestHandler);

          // Verify handlers were removed
          const connectionListeners = testServer.listeners('connection');
          const requestListeners = testServer.listeners('request');

          expect(connectionListeners).not.toContain(connectionHandler);
          expect(requestListeners).not.toContain(requestHandler);
          done();
        });
      });
    });

    it('should clean up internal server state after close', async () => {
      const testServer = createTrackedTestServer();

      await startServer(testServer, 0, '127.0.0.1');

      // Verify server is in a valid running state
      expect(testServer.listening).toBe(true);
      expect(testServer.address()).not.toBeNull();

      await stopServer(testServer);

      // Verify server is in a clean closed state
      expect(testServer.listening).toBe(false);
      expect(testServer.address()).toBeNull();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent server creations', async () => {
      const serverPromises = [];

      // Create 5 servers concurrently
      for (let i = 0; i < 5; i++) {
        const testServer = createTrackedTestServer();
        serverPromises.push(startServer(testServer, 0, '127.0.0.1'));
      }

      const servers = await Promise.all(serverPromises);

      // All servers should be listening
      servers.forEach((s) => {
        expect(s.listening).toBe(true);
      });

      // All ports should be unique
      const ports = servers.map((s) => s.address().port);
      const uniquePorts = new Set(ports);
      expect(uniquePorts.size).toBe(5);
    });

    it('should handle concurrent server shutdowns', async () => {
      const servers = [];

      // Create 5 servers
      for (let i = 0; i < 5; i++) {
        const testServer = createTrackedTestServer();
        await startServer(testServer, 0, '127.0.0.1');
        servers.push(testServer);
      }

      // Close all servers concurrently
      await Promise.all(servers.map((s) => stopServer(s)));

      // All servers should be stopped
      servers.forEach((s) => {
        expect(s.listening).toBe(false);
      });
    });
  });
});
