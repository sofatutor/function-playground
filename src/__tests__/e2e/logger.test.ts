import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';

/**
 * Test for the browser logger functionality
 * This test verifies that logs from the browser are properly sent to the Vite server
 */
test('browser logger sends logs to server', async ({ page }) => {
  // Start the Vite dev server
  const viteServer = await startViteServer();
  
  try {
    // Wait for the server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Navigate to the app
    await page.goto('http://localhost:8080');
    
    // Wait for the page to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Execute a script that logs messages
    await page.evaluate(() => {
      console.log('Playwright test log message');
      console.info('Playwright test info message');
      console.warn('Playwright test warning message');
      console.error('Playwright test error message');
    });
    
    // Wait for logs to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if the logs were received by the server
    const logs = viteServer.logs;
    
    // Verify that our test logs were received
    expect(logs.some(log => log.includes('Playwright test log message'))).toBeTruthy();
    expect(logs.some(log => log.includes('Playwright test info message'))).toBeTruthy();
    expect(logs.some(log => log.includes('Playwright test warning message'))).toBeTruthy();
    expect(logs.some(log => log.includes('Playwright test error message'))).toBeTruthy();
    
    // Verify that logs include context information
    expect(logs.some(log => /\[\d+\]/.test(log))).toBeTruthy();
    
    // Verify that logs include timestamps
    expect(logs.some(log => /\[\d{2}:\d{2}:\d{2}\.\d{3}\]/.test(log))).toBeTruthy();
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