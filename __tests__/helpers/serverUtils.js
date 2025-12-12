/**
 * Server Utilities for Testing
 * 
 * Provides utility functions for server management during tests,
 * including startup, shutdown, and health check operations.
 * 
 * Usage:
 *   const { startServer, stopServer, waitForServer } = require('./helpers/serverUtils');
 */

/**
 * Starts a server and returns a promise that resolves when the server is listening
 * 
 * @param {Object} server - HTTP server instance
 * @param {number} port - Port number to bind to
 * @param {string} [hostname='127.0.0.1'] - Hostname to bind to
 * @returns {Promise<Object>} Promise that resolves to server address info
 * 
 * @example
 * const { server } = require('../../server');
 * const addressInfo = await startServer(server, 3001);
 * console.log(`Server started on port ${addressInfo.port}`);
 */
function startServer(server, port, hostname = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    // Check if server is already listening
    if (server.listening) {
      resolve(server.address());
      return;
    }
    
    const onError = (err) => {
      server.removeListener('listening', onListening);
      reject(err);
    };
    
    const onListening = () => {
      server.removeListener('error', onError);
      resolve(server.address());
    };
    
    server.once('error', onError);
    server.once('listening', onListening);
    
    server.listen(port, hostname);
  });
}

/**
 * Stops a server and returns a promise that resolves when the server is closed
 * 
 * @param {Object} server - HTTP server instance
 * @param {number} [timeout=5000] - Maximum time to wait for close in milliseconds
 * @returns {Promise<void>} Promise that resolves when server is closed
 * 
 * @example
 * await stopServer(server);
 */
function stopServer(server, timeout = 5000) {
  return new Promise((resolve, reject) => {
    // Check if server is not listening
    if (!server.listening) {
      resolve();
      return;
    }
    
    // Set up timeout for forceful close
    const timeoutId = setTimeout(() => {
      reject(new Error(`Server close timed out after ${timeout}ms`));
    }, timeout);
    
    server.close((err) => {
      clearTimeout(timeoutId);
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Waits for a server to be ready by polling its health endpoint
 * 
 * @param {string} url - URL to check for server readiness
 * @param {number} [maxAttempts=10] - Maximum number of retry attempts
 * @param {number} [intervalMs=100] - Milliseconds between retry attempts
 * @returns {Promise<boolean>} Promise that resolves to true when server is ready
 * 
 * @example
 * await waitForServer('http://127.0.0.1:3000');
 */
async function waitForServer(url, maxAttempts = 10, intervalMs = 100) {
  const http = require('http');
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.on('data', () => {}); // Consume response
          res.on('end', () => resolve(true));
        });
        
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
      
      return true;
    } catch (err) {
      if (attempt < maxAttempts - 1) {
        await sleep(intervalMs);
      }
    }
  }
  
  throw new Error(`Server at ${url} did not become ready after ${maxAttempts} attempts`);
}

/**
 * Returns the URL for a server based on its address info
 * 
 * @param {Object} server - HTTP server instance
 * @returns {string|null} Server URL or null if not listening
 * 
 * @example
 * const url = getServerUrl(server);
 * console.log(url); // 'http://127.0.0.1:3000'
 */
function getServerUrl(server) {
  const address = server.address();
  
  if (!address) {
    return null;
  }
  
  // Handle IPv6 addresses
  const host = address.family === 'IPv6' 
    ? `[${address.address}]` 
    : address.address;
  
  return `http://${host}:${address.port}`;
}

/**
 * Utility function to sleep for a specified duration
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} Promise that resolves after the delay
 * 
 * @example
 * await sleep(1000); // Sleep for 1 second
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if a port is available for binding
 * 
 * @param {number} port - Port number to check
 * @param {string} [hostname='127.0.0.1'] - Hostname to check
 * @returns {Promise<boolean>} Promise that resolves to true if port is available
 * 
 * @example
 * const available = await isPortAvailable(3000);
 * if (available) {
 *   // Safe to bind to port 3000
 * }
 */
function isPortAvailable(port, hostname = '127.0.0.1') {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', () => {
      resolve(false);
    });
    
    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });
    
    server.listen(port, hostname);
  });
}

/**
 * Creates a new HTTP server for testing with the same handler as the main server
 * 
 * @param {Function} handler - Request handler function
 * @returns {Object} HTTP server instance
 * 
 * @example
 * const testServer = createTestServer((req, res) => {
 *   res.end('test');
 * });
 */
function createTestServer(handler) {
  const http = require('http');
  return http.createServer(handler);
}

/**
 * Destroys all connections on a server for immediate cleanup
 * 
 * @param {Object} server - HTTP server instance with tracked connections
 * @returns {void}
 */
function destroyAllConnections(server) {
  if (server._connections) {
    server._connections.forEach(conn => {
      conn.destroy();
    });
  }
}

module.exports = {
  startServer,
  stopServer,
  waitForServer,
  getServerUrl,
  sleep,
  isPortAvailable,
  createTestServer,
  destroyAllConnections
};
