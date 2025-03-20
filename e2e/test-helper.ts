import { test as base } from '@playwright/test';
import { captureHtmlSnapshot } from './utils/snapshot-helpers';

/**
 * Enhanced test object with HTML snapshot capability
 */
export const test = base.extend({});

// Add automatic HTML snapshot on failure for all tests using this helper
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await captureHtmlSnapshot(page, testInfo, 'page-failure');
  }
}); 