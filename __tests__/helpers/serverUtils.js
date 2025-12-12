/**
 * Server Utilities for Testing
 *
 * Provides promise-based utility functions for HTTP server lifecycle management
 * during tests. These utilities simplify starting, stopping, and health-checking
 * servers in integration and lifecycle tests.
 *
 * @module serverUtils
 *
 * Usage:
 *   const { startServer, stopServer, waitForServer, getServerUrl } = require('./helpers/serverUtils');
 *
 * Example:
 *   const http = require('http');
 *   const server = http.createServer((req, res) => res.end('OK'));
 *   await startServer(server, 0); // Use ephemeral port
 *   const url = getServerUrl(server);
 *   await waitForServer(url);
 *   // ... run tests ...
 *   await stopServer(server);
 */

'use strict';

const http = require('http');

/**
 * Starts an HTTP server on the specified port and hostname.
 *
 * This function wraps the server.listen() callback in a Promise for use with
 * async/await patterns. It also handles error events during startup to properly
 * reject the Promise if binding fails.
 *
 * @param {http.Server} server - The HTTP server instance to start
 * @param {number} [port=0] - Port number to bind to. Default 0 assigns an ephemeral port
 * @param {string} [hostname='127.0.0.1'] - Hostname/IP address to bind to
 * @returns {Promise<http.Server>} Resolves with the server instance when listening
 * @throws {Error} Rejects if server fails to start (e.g., EADDRINUSE, EACCES)
 *
 * @example
 * const http = require('http');
 * const server = http.createServer(handler);
 *
 * // Start on ephemeral port (recommended for tests)
 * await startServer(server);
 * console.log('Server listening on port:', server.address().port);
 *
 * @example
 * // Start on specific port
 * await startServer(server, 3001, 'localhost');
 */
function startServer(server, port = 0, hostname = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    // Handle errors during startup (e.g., EADDRINUSE, EACCES)
    const onError = (err) => {
      // Remove the listening handler to prevent memory leaks
      server.removeListener('listening', onListening);
      reject(err);
    };

    const onListening = () => {
      // Remove the error handler since we successfully started
      server.removeListener('error', onError);
      resolve(server);
    };

    // Use 'once' to automatically remove listeners after first emit
    server.once('error', onError);
    server.once('listening', onListening);

    // Initiate the listen operation
    server.listen(port, hostname);
  });
}

/**
 * Stops an HTTP server gracefully.
 *
 * This function wraps server.close() in a Promise. It safely handles cases
 * where the server is null, undefined, or already closed by resolving
 * immediately without error.
 *
 * @param {http.Server} server - The HTTP server instance to stop
 * @returns {Promise<void>} Resolves when server is fully closed
 * @throws {Error} Rejects if server.close() encounters an error
 *
 * @example
 * // Graceful shutdown in afterAll hook
 * afterAll(async () => {
 *   await stopServer(server);
 * });
 *
 * @example
 * // Safe to call on already-stopped server
 * await stopServer(server); // Resolves immediately if not listening
 */
function stopServer(server) {
  return new Promise((resolve, reject) => {
    // Handle null/undefined server gracefully
    if (!server) {
      resolve();
      return;
    }

    // Handle server that's not currently listening
    if (!server.listening) {
      resolve();
      return;
    }

    // Close the server and handle completion/error
    server.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Waits for a server to be ready by polling with HTTP health checks.
 *
 * This function repeatedly attempts to connect to the specified URL until
 * either a successful response is received or the timeout is exceeded.
 * Useful for integration tests that need to wait for a server to be fully
 * ready before running assertions.
 *
 * @param {string} url - The URL to poll for readiness (e.g., 'http://127.0.0.1:3000')
 * @param {number} [timeout=5000] - Maximum wait time in milliseconds
 * @param {number} [interval=100] - Polling interval in milliseconds between attempts
 * @returns {Promise<void>} Resolves when server responds successfully
 * @throws {Error} Rejects with timeout error if server doesn't respond within timeout
 *
 * @example
 * // Wait for server with default settings
 * await waitForServer('http://127.0.0.1:3000');
 *
 * @example
 * // Wait with custom timeout and interval
 * await waitForServer('http://localhost:8080', 10000, 200);
 */
function waitForServer(url, timeout = 5000, interval = 100) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    /**
     * Internal function to perform a single health check attempt.
     * Reschedules itself if the server isn't ready and timeout hasn't been reached.
     */
    const checkServer = () => {
      const req = http.get(url, (res) => {
        // Consume response data to free up memory
        res.resume();

        // Any response (even errors like 404/500) means server is running
        res.on('end', () => {
          resolve();
        });

        res.on('error', () => {
          // Response error, but connection was made - server is up
          resolve();
        });
      });

      req.on('error', (err) => {
        // Calculate elapsed time
        const elapsed = Date.now() - startTime;

        if (elapsed >= timeout) {
          // Timeout exceeded, reject with descriptive error
          reject(new Error(`Server not ready after ${timeout}ms: ${err.message}`));
        } else {
          // Schedule next attempt after interval
          setTimeout(checkServer, interval);
        }
      });

      // Set a request-level timeout to prevent hanging connections
      req.setTimeout(Math.min(interval * 2, 1000), () => {
        req.destroy();
      });
    };

    // Start the polling process
    checkServer();
  });
}

/**
 * Gets the full URL for a running server based on its address info.
 *
 * This function extracts the address information from a server instance and
 * constructs a proper HTTP URL. It handles both IPv4 and IPv6 addresses,
 * mapping IPv6 localhost (::) to 'localhost' for compatibility.
 *
 * @param {http.Server} server - The HTTP server instance (must be listening)
 * @returns {string|null} The full URL (e.g., 'http://127.0.0.1:3000') or null if not listening
 *
 * @example
 * await startServer(server, 0);
 * const url = getServerUrl(server);
 * console.log(url); // 'http://127.0.0.1:54321' (ephemeral port)
 *
 * @example
 * // Returns null if server is not listening
 * const url = getServerUrl(stoppedServer);
 * if (!url) {
 *   console.log('Server is not running');
 * }
 */
function getServerUrl(server) {
  // Get the address info from the server
  const address = server.address();

  // Return null if server is not listening (address() returns null)
  if (!address) {
    return null;
  }

  // Handle IPv6 localhost (::) by mapping to 'localhost' for compatibility
  // Also handle IPv6 loopback (::1)
  let host = address.address;
  if (host === '::' || host === '::1') {
    host = 'localhost';
  } else if (address.family === 'IPv6') {
    // Wrap IPv6 addresses in brackets as per RFC 3986
    host = `[${host}]`;
  }

  return `http://${host}:${address.port}`;
}

// Export the utility functions
module.exports = {
  startServer,
  stopServer,
  waitForServer,
  getServerUrl
};
