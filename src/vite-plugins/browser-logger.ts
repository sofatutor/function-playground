import type { Plugin } from 'vite';
import chalk from 'chalk';

/**
 * Vite plugin to capture browser logs and display them in the terminal
 * This plugin adds a dedicated endpoint for browser logs
 */
export function browserLogger(): Plugin {
  // Track active connections
  let activeConnectionId: string | null = null;
  let connectionCount = 0;
  // Track last heartbeat time for active connection
  let lastHeartbeatTime: number = 0;
  // Timeout duration in milliseconds (10 seconds)
  const CONNECTION_TIMEOUT = 10000;
  // Interval for checking connection timeouts
  let timeoutCheckInterval: NodeJS.Timeout | null = null;

  // Function to check for timed-out connections
  const checkConnectionTimeout = () => {
    if (activeConnectionId && Date.now() - lastHeartbeatTime > CONNECTION_TIMEOUT) {
      console.log(chalk.yellow(`⚠ Browser logger connection timed out (ID: ${activeConnectionId.substring(0, 12)}...)`));
      activeConnectionId = null;
    }
  };

  return {
    name: 'vite-plugin-browser-logger',
    apply: 'serve', // Only apply this plugin during development
    
    configureServer(server) {
      // Start the timeout check interval
      timeoutCheckInterval = setInterval(checkConnectionTimeout, CONNECTION_TIMEOUT / 2);

      // Add middleware to handle browser logs
      server.middlewares.use('/vite-browser-log', (req, res) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Handle OPTIONS request (preflight)
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }
        
        // Handle handshake request
        if (req.method === 'GET') {
          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const action = url.searchParams.get('action');
          
          if (action === 'handshake') {
            // Generate a new connection ID
            const connectionId = `browser-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            // Check if the current active connection has timed out
            const hasActiveConnectionTimedOut = activeConnectionId && (Date.now() - lastHeartbeatTime > CONNECTION_TIMEOUT);
            
            // If this is the first connection or the active connection has timed out, make it active
            if (activeConnectionId === null || hasActiveConnectionTimedOut) {
              // If there was a timed out connection, log it
              if (hasActiveConnectionTimedOut) {
                console.log(chalk.yellow(`⚠ Browser logger connection timed out (ID: ${activeConnectionId.substring(0, 12)}...)`));
              }
              
              activeConnectionId = connectionId;
              connectionCount++;
              // Set initial heartbeat time
              lastHeartbeatTime = Date.now();
              console.log(chalk.green(`✓ Browser Logger connected (ID: ${connectionId.substring(0, 12)}...)`));
              
              // Send success response with connection ID
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                status: 'active', 
                connectionId, 
                message: 'Connection established as primary logger' 
              }));
            } else {
              // Another connection is already active
              connectionCount++;
              console.log(chalk.yellow(`⚠ Additional browser connection attempted (total: ${connectionCount})`));
              
              // Send response indicating this is not the active connection
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                status: 'inactive', 
                connectionId, 
                message: 'Another browser is already connected as primary logger' 
              }));
            }
            return;
          }
          
          // Handle heartbeat request
          if (action === 'heartbeat') {
            const connectionId = url.searchParams.get('connectionId');
            
            // Check if this is the active connection
            if (connectionId === activeConnectionId) {
              // Update last heartbeat time
              lastHeartbeatTime = Date.now();
              // Send success response
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'active' }));
            } else if (activeConnectionId === null) {
              // If there's no active connection, this one can become active
              activeConnectionId = connectionId;
              lastHeartbeatTime = Date.now();
              console.log(chalk.green(`✓ Browser Logger reconnected (ID: ${connectionId?.substring(0, 12)}...)`));
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'active' }));
            } else {
              // Check if the current active connection has timed out
              const hasActiveConnectionTimedOut = Date.now() - lastHeartbeatTime > CONNECTION_TIMEOUT;
              
              if (hasActiveConnectionTimedOut) {
                // If the active connection has timed out, make this one active
                console.log(chalk.yellow(`⚠ Browser logger connection timed out (ID: ${activeConnectionId.substring(0, 12)}...)`));
                activeConnectionId = connectionId;
                lastHeartbeatTime = Date.now();
                console.log(chalk.green(`✓ Browser Logger promoted (ID: ${connectionId?.substring(0, 12)}...)`));
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'active' }));
              } else {
                // Send inactive response
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'inactive' }));
              }
            }
            return;
          }
          
          // Handle disconnect request
          if (action === 'disconnect') {
            const connectionId = url.searchParams.get('connectionId');
            
            // Check if this is the active connection
            if (connectionId === activeConnectionId) {
              activeConnectionId = null;
              connectionCount = Math.max(0, connectionCount - 1);
              console.log(chalk.yellow(`⚠ Primary browser logger disconnected (remaining: ${connectionCount})`));
            } else {
              connectionCount = Math.max(0, connectionCount - 1);
            }
            
            // Send success response
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'disconnected' }));
            return;
          }
          
          // Handle unknown GET request
          res.statusCode = 400;
          res.end('Bad Request');
          return;
        }
        
        // Only handle POST requests for logs
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        
        // Get the request body
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', () => {
          try {
            // Parse the log data
            const data = JSON.parse(body);
            const { connectionId, level, message, timestamp, context } = data;
            
            // Only process logs from the active connection
            if (connectionId !== activeConnectionId) {
              res.statusCode = 403;
              res.end('Not Active Logger');
              return;
            }
            
            // Update last heartbeat time on any successful log
            lastHeartbeatTime = Date.now();
            
            // Format the log message with colors based on the log level
            let color;
            switch (level.toLowerCase()) {
              case 'error':
                color = chalk.red;
                break;
              case 'warn':
                color = chalk.yellow;
                break;
              case 'info':
                color = chalk.blue;
                break;
              case 'debug':
                color = chalk.magenta;
                break;
              default:
                color = chalk.white;
            }
            
            // Format the timestamp and context
            const formattedTimestamp = timestamp ? chalk.dim(timestamp) : '';
            const formattedContext = context ? chalk.cyan(context) : '';
            
            // Clean up the message - remove any remaining URL artifacts
            const cleanedMessage = message.replace(/\?(?:grid|t)=[^:]+:(\d+)/g, ':$1');
            
            // Output the log message to the terminal
            console.log(
              chalk.bold.bgBlack('[BROWSER]'), 
              formattedTimestamp, 
              formattedContext, 
              color(cleanedMessage)
            );
            
            // Send a response
            res.statusCode = 200;
            res.end('OK');
          } catch (e) {
            // Handle errors
            console.error('Error processing browser log:', e);
            res.statusCode = 400;
            res.end('Bad Request');
          }
        });
      });
      
      // Log a message to confirm the plugin is loaded
      console.log(chalk.green('✓ Browser Logger plugin initialized'));
      
      // Clean up interval when server closes
      server.httpServer?.on('close', () => {
        if (timeoutCheckInterval) {
          clearInterval(timeoutCheckInterval);
          timeoutCheckInterval = null;
        }
      });
    },
    
    // Inject client code to handle browser logs
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: `
            // Browser Logger Client
            (function() {
              if (window.__vite_browser_logger_installed__) return;
              window.__vite_browser_logger_installed__ = true;
              
              // Connection state
              let connectionId = null;
              let isActiveLogger = false;
              let heartbeatInterval = null;
              let logQueue = [];
              let isProcessingQueue = false;
              
              // Heartbeat interval in milliseconds (10 seconds)
              const HEARTBEAT_INTERVAL = 10000;
              
              // Helper to format timestamp
              const getTimestamp = () => {
                const now = new Date();
                return \`[\${now.toISOString().split('T')[1].slice(0, 12)}]\`;
              };
              
              // Process the log queue
              const processLogQueue = async () => {
                if (isProcessingQueue || logQueue.length === 0 || !isActiveLogger || !connectionId) {
                  return;
                }
                
                isProcessingQueue = true;
                
                try {
                  const logItem = logQueue.shift();
                  if (logItem) {
                    const { level, args, timestamp, context } = logItem;
                    
                    // Format the message
                    const formattedArgs = args.map(arg => {
                      if (typeof arg === 'object' && arg !== null) {
                        try {
                          return JSON.stringify(arg);
                        } catch (e) {
                          return String(arg);
                        }
                      }
                      return String(arg);
                    });
                    
                    // Clean up any file paths with query parameters in the message
                    const message = formattedArgs.join(' ').replace(/[?](?:grid|t)=[^:]+:([0-9]+)/g, ':$1');
                    
                    // Send the log to the server via fetch
                    await fetch('/vite-browser-log', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ connectionId, level, message, timestamp, context })
                    });
                  }
                } catch (e) {
                  // Silently fail
                } finally {
                  isProcessingQueue = false;
                  
                  // Process the next item in the queue
                  if (logQueue.length > 0) {
                    setTimeout(processLogQueue, 0);
                  }
                }
              };
              
              // Establish connection with server
              const connectToServer = async () => {
                try {
                  const response = await fetch('/vite-browser-log?action=handshake', {
                    method: 'GET'
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    connectionId = data.connectionId;
                    isActiveLogger = data.status === 'active';
                    
                    if (isActiveLogger) {
                      console.log('[Browser Logger] Connected as primary logger');
                      
                      // Start heartbeat to maintain connection
                      heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
                      
                      // Set up disconnect on page unload
                      window.addEventListener('beforeunload', disconnectFromServer);
                      
                      // Process any queued logs
                      processLogQueue();
                    } else {
                      console.log('[Browser Logger] Connected as secondary logger (logs will not be sent to server)');
                      
                      // Even inactive loggers should send heartbeats to check if they can become active
                      heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
                    }
                  }
                } catch (e) {
                  console.error('[Browser Logger] Failed to connect to server:', e);
                }
              };
              
              // Send heartbeat to keep connection alive
              const sendHeartbeat = async () => {
                if (!connectionId) return;
                
                try {
                  const response = await fetch(\`/vite-browser-log?action=heartbeat&connectionId=\${connectionId}\`, {
                    method: 'GET'
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    const wasActive = isActiveLogger;
                    isActiveLogger = data.status === 'active';
                    
                    if (!wasActive && isActiveLogger) {
                      console.log('[Browser Logger] Promoted to primary logger');
                      // Process any queued logs now that we're active
                      processLogQueue();
                    } else if (wasActive && !isActiveLogger) {
                      console.log('[Browser Logger] No longer the primary logger');
                    }
                  }
                } catch (e) {
                  console.error('[Browser Logger] Failed to send heartbeat:', e);
                }
              };
              
              // Disconnect from server
              const disconnectFromServer = async () => {
                if (!connectionId) return;
                
                try {
                  await fetch(\`/vite-browser-log?action=disconnect&connectionId=\${connectionId}\`, {
                    method: 'GET'
                  });
                  
                  clearInterval(heartbeatInterval);
                  connectionId = null;
                  isActiveLogger = false;
                } catch (e) {
                  // Silently fail on disconnect errors
                }
              };
              
              // Create a function to send logs to the server
              window.__vite_log_to_server = function(level, ...args) {
                // Get timestamp
                const timestamp = getTimestamp();
                
                // Get caller information with detailed file path
                let context = '';
                try {
                  // Create a new Error to get the stack trace
                  const error = new Error();
                  const stackLines = error.stack?.split('\\n') || [];
                  
                  // Find the first relevant caller (skipping this function and console methods)
                  let relevantLine = '';
                  for (let i = 3; i < stackLines.length; i++) {
                    const line = stackLines[i];
                    // Skip internal browser-logger and logger code
                    if (!line.includes('browser-logger.ts') && 
                        !line.includes('logger.ts') && 
                        !line.includes('__vite_log_to_server')) {
                      relevantLine = line;
                      break;
                    }
                  }
                  
                  if (relevantLine) {
                    // Extract file path and line numbers using string operations
                    const parts = relevantLine.split('/src/');
                    if (parts.length > 1) {
                      const srcPart = parts[1];
                      const colonIndex = srcPart.indexOf(':');
                      if (colonIndex > 0) {
                        const filePath = srcPart.substring(0, colonIndex);
                        const lineInfo = srcPart.substring(colonIndex + 1);
                        const lineColParts = lineInfo.split(':');
                        if (lineColParts.length >= 1) {
                          const lineNumber = lineColParts[0];
                          context = \`[src/\${filePath}:\${lineNumber}]\`;
                        } else {
                          context = \`[src/\${filePath}]\`;
                        }
                      } else {
                        context = \`[src/\${srcPart}]\`;
                      }
                    } else {
                      // Fallback: just use a simplified version of the stack trace
                      context = '[stack trace]';
                    }
                  } else {
                    context = '[unknown source]';
                  }
                } catch (e) {
                  context = '[error getting source]';
                }
                
                // Add to queue
                logQueue.push({ level, args, timestamp, context });
                
                // Process queue
                processLogQueue();
              };
              
              // Store original console methods
              const originalConsole = {
                log: console.log,
                info: console.info,
                warn: console.warn,
                error: console.error,
                debug: console.debug
              };
              
              // Override console.log
              console.log = function(...args) {
                originalConsole.log(...args);
                window.__vite_log_to_server('log', ...args);
              };
              
              // Override console.info
              console.info = function(...args) {
                originalConsole.info(...args);
                window.__vite_log_to_server('info', ...args);
              };
              
              // Override console.warn
              console.warn = function(...args) {
                originalConsole.warn(...args);
                window.__vite_log_to_server('warn', ...args);
              };
              
              // Override console.error
              console.error = function(...args) {
                originalConsole.error(...args);
                window.__vite_log_to_server('error', ...args);
              };
              
              // Override console.debug
              console.debug = function(...args) {
                originalConsole.debug(...args);
                window.__vite_log_to_server('debug', ...args);
              };
              
              // Connect to the server
              connectToServer();
            })();
          `,
          injectTo: 'head'
        }
      ];
    }
  };
} 