import { test as base } from '@playwright/test';
import { captureHtmlSnapshot } from './utils/snapshot-helpers';
import * as fs from 'fs';
import * as path from 'path';

// Extend window interface to include coverage property
declare global {
  interface Window {
    __coverage__?: Record<string, unknown>;
  }
}

/**
 * Enhanced test object with HTML snapshot capability and coverage collection
 */
export const test = base.extend({
  context: async ({ context }, runTest) => {
    // Create the coverage directory if it doesn't exist
    const coverageDir = path.join(process.cwd(), '.nyc_output');
    if (!fs.existsSync(coverageDir)) {
      fs.mkdirSync(coverageDir, { recursive: true });
    }

    // Add the coverage collection
    await context.addInitScript(() => {
      window.addEventListener('beforeunload', () => {
        if (window.__coverage__) {
          const coverage = JSON.stringify(window.__coverage__);
          const timestamp = new Date().getTime();
          // Use fetch to send the coverage data to the server
          fetch('/collect-coverage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              coverage,
              timestamp,
            }),
          });
        }
      });
    });

    await runTest(context);

    // Extract coverage from the page when the test is done
    for (const page of context.pages()) {
      try {
        const coverage = await page.evaluate(() => {
          return window.__coverage__;
        });

        if (coverage) {
          const timestamp = new Date().getTime();
          const id = Math.random().toString(36).substring(2, 12);
          const coverageFile = path.join(coverageDir, `playwright-${id}-${timestamp}.json`);
          
          fs.writeFileSync(coverageFile, JSON.stringify(coverage));
        }
      } catch (err) {
        // Ignore errors during coverage collection
        console.error('Error while collecting coverage:', err);
      }
    }
  },
});

// Add automatic HTML snapshot on failure for all tests using this helper
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await captureHtmlSnapshot(page, testInfo, 'page-failure');
  }
}); 