import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test for the browser logger functionality
 * This test verifies that logs from the browser are properly sent to the Vite server
 * with the correct file context information
 */
test('browser logger sends logs with correct file context', async ({ page }) => {
  // Start the Vite dev server
  const viteServer = await startViteServer();
  let serverPort = 8080; // Default port
  
  try {
    // Wait for the server to start and detect the actual port
    await new Promise<void>((resolve) => {
      const portRegex = /Local:\s+http:\/\/localhost:(\d+)/;
      const checkLogs = () => {
        for (const log of viteServer.logs) {
          const match = log.match(portRegex);
          if (match && match[1]) {
            serverPort = parseInt(match[1], 10);
            console.log(`Detected Vite server running on port: ${serverPort}`);
            resolve();
            return;
          }
        }
        
        // If port not found yet, check again after a short delay
        setTimeout(checkLogs, 500);
      };
      
      // Start checking logs
      checkLogs();
      
      // Timeout after 10 seconds
      setTimeout(() => {
        console.warn('Could not detect Vite server port, using default: 8080');
        resolve();
      }, 10000);
    });
    
    // Navigate to the app
    await page.goto(`http://localhost:${serverPort}`);
    
    // Wait for the page to load (more generic selector)
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Create a test file with known line numbers for logging
    const testFilePath = path.join(process.cwd(), 'src', 'test-logger.ts');
    const testFileContent = `
// This is a test file for logging
// Line 3
// Line 4
function testLogging() {
  // Line 6
  console.log('Test log from line 7');
  // Line 8
  console.info('Test info from line 9');
  // Line 10
  console.warn('Test warning from line 11');
  // Line 12
  console.error('Test error from line 13');
  // Line 14
}
// Line 16
testLogging();
// Line 18
`;
    fs.writeFileSync(testFilePath, testFileContent);
    
    // Log that we're executing the test file
    console.log(`Created test file at: ${testFilePath}`);
    
    // Execute the test file in the browser
    await page.evaluate(async (testFilePath) => {
      console.log(`Executing test file: ${testFilePath}`);
      
      // Log directly to test browser logger
      console.log('Direct browser log test');
      console.info('Direct browser info test');
      console.warn('Direct browser warn test');
      console.error('Direct browser error test');
      
      // Create a script element to load the test file
      const script = document.createElement('script');
      script.type = 'module';
      script.src = '/src/test-logger.ts';
      document.head.appendChild(script);
      
      // Wait for the script to load and execute
      await new Promise(resolve => {
        script.onload = () => {
          console.log('Test script loaded successfully');
          resolve(true);
        };
        script.onerror = (e) => {
          console.error('Error loading test script:', e);
          resolve(false);
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
          console.warn('Test script load timed out');
          resolve(false);
        }, 5000);
      });
    }, testFilePath);
    
    // Wait for logs to be processed
    console.log('Waiting for logs to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if the logs were received by the server
    const logs = viteServer.logs;
    
    // Log all captured logs for debugging
    console.log('Captured logs:');
    logs.forEach((log, index) => {
      if (log.includes('Test log from line') || 
          log.includes('Direct browser') || 
          log.includes('test-logger.ts')) {
        console.log(`[${index}] ${log}`);
      }
    });
    
    // Verify that our direct test logs were received
    const directLogLine = logs.find(log => log.includes('Direct browser log test'));
    const directInfoLine = logs.find(log => log.includes('Direct browser info test'));
    const directWarnLine = logs.find(log => log.includes('Direct browser warn test'));
    const directErrorLine = logs.find(log => log.includes('Direct browser error test'));
    
    // Check if direct logs were received
    expect(directLogLine).toBeTruthy();
    expect(directInfoLine).toBeTruthy();
    expect(directWarnLine).toBeTruthy();
    expect(directErrorLine).toBeTruthy();
    
    // Verify that our test file logs were received
    const testLogLine = logs.find(log => log.includes('Test log from line 7'));
    const testInfoLine = logs.find(log => log.includes('Test info from line 9'));
    const testWarnLine = logs.find(log => log.includes('Test warning from line 11'));
    const testErrorLine = logs.find(log => log.includes('Test error from line 13'));
    
    // Log the results of our search
    console.log('Test log line found:', !!testLogLine);
    console.log('Test info line found:', !!testInfoLine);
    console.log('Test warn line found:', !!testWarnLine);
    console.log('Test error line found:', !!testErrorLine);
    
    // Check if logs were received
    expect(testLogLine).toBeTruthy();
    expect(testInfoLine).toBeTruthy();
    expect(testWarnLine).toBeTruthy();
    expect(testErrorLine).toBeTruthy();
    
    // Check if logs include correct file context with line and column numbers
    if (testLogLine) {
      console.log('Test log line:', testLogLine);
      expect(testLogLine).toMatch(/\[test-logger\.ts:7:\d+\]/);
    }
    if (testInfoLine) {
      console.log('Test info line:', testInfoLine);
      expect(testInfoLine).toMatch(/\[test-logger\.ts:9:\d+\]/);
    }
    if (testWarnLine) {
      console.log('Test warn line:', testWarnLine);
      expect(testWarnLine).toMatch(/\[test-logger\.ts:11:\d+\]/);
    }
    if (testErrorLine) {
      console.log('Test error line:', testErrorLine);
      expect(testErrorLine).toMatch(/\[test-logger\.ts:13:\d+\]/);
    }
    
    // Clean up the test file
    fs.unlinkSync(testFilePath);
  } finally {
    // Stop the Vite server
    await stopViteServer(viteServer.process);
  }
});

/**
 * Helper function to start the Vite dev server
 * @returns The Vite server process and captured logs
 */
async function startViteServer(): Promise<{ process: ChildProcess; logs: string[] }> {
  const logs: string[] = [];
  
  // Start the Vite dev server
  const viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });
  
  // Capture stdout
  const stdout = createInterface({ input: viteProcess.stdout! });
  stdout.on('line', (line) => {
    logs.push(line);
    console.log(`[Vite Server] ${line}`);
  });
  
  // Capture stderr
  const stderr = createInterface({ input: viteProcess.stderr! });
  stderr.on('line', (line) => {
    logs.push(line);
    console.error(`[Vite Server Error] ${line}`);
  });
  
  return { process: viteProcess, logs };
}

/**
 * Helper function to stop the Vite dev server
 * @param process The Vite server process
 */
async function stopViteServer(process: ChildProcess): Promise<void> {
  if (process.pid) {
    // Kill the process
    process.kill('SIGTERM');
    
    // Wait for the process to exit
    await new Promise<void>((resolve) => {
      process.on('exit', () => {
        resolve();
      });
      
      // Force kill after timeout
      setTimeout(() => {
        process.kill('SIGKILL');
        resolve();
      }, 5000);
    });
  }
} 