import { FullConfig } from '@playwright/test';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

// This file is used in playwright.config.ts for global setup
async function globalSetup(config: FullConfig) {
  console.log('Global setup running...');
  
  // Register a global error handler
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit process as it would terminate the tests
  });
  
  console.log('Global setup complete');
}

export default globalSetup;

// You could also create a custom reporter to handle failures
export class FailureCaptureReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== 'passed') {
      console.log(`Reporter detected test failure: ${test.title}`);
      // Note: We can't capture DOM here as we don't have page object
      // This is why the afterEach hook is more powerful
    }
  }
} 