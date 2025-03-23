import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { Logger } from './utils/logger';

export const coverageDir = path.join(process.cwd(), 'coverage/e2e/tmp');

// This file is used in playwright.config.ts for global setup
async function globalSetup(config: FullConfig) {
  Logger.info('Global setup running...');
  
  // Register a global error handler
  process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit process as it would terminate the tests
  });
  
  // Setup code coverage collection if needed
  setupCoverage();
  
  // Ensure the server is running (handled by webServer in config)
  
  // You can set up global state here if needed
  // For example: auth tokens, database setup, etc.
  
  Logger.info('Global setup complete');
}

/**
 * Set up coverage collection for Playwright
 */
function setupCoverage() {
  // Create output directory for V8 coverage if it doesn't exist
  if (!fs.existsSync(coverageDir)) {
    fs.mkdirSync(coverageDir, { recursive: true });
  } else {
    // Clear the coverage directory
    fs.readdirSync(coverageDir).forEach(file => {
      fs.unlinkSync(path.join(coverageDir, file));
    });
  }
  
  Logger.info(`E2E tests configured for coverage collection. Output: ${coverageDir}`);
  
  // Register a process exit handler to convert coverage
  process.on('exit', () => {
    try {
      // Only attempt to convert if the coverage directory exists and has files
      if (fs.existsSync(coverageDir) && fs.readdirSync(coverageDir).length > 0) {
        Logger.info('Converting V8 coverage to JSON format...');
        execSync(`npx c8 report --reporter=json --report-dir=coverage/e2e --temp-dir=coverage/e2e/tmp`, {
          stdio: 'inherit'
        });
      }
    } catch (error) {
      Logger.error('Failed to convert coverage:', error);
    }
  });
}

export default globalSetup;

// You could also create a custom reporter to handle failures
export class FailureCaptureReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== 'passed') {
      Logger.warn(`Reporter detected test failure: ${test.title}`);
      // Note: We can't capture DOM here as we don't have page object
      // This is why the afterEach hook is more powerful
    }
  }
}