import { type Page, type TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Captures HTML content of the page and saves it to a file
 * @param page Playwright page object
 * @param testInfo Test info object
 * @param name Optional name for the snapshot
 */
export async function captureHtmlSnapshot(page: Page, testInfo: TestInfo, name = 'snapshot') {
  const htmlContent = await page.content();
  const outputPath = testInfo.outputPath(`${name}.html`);
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, htmlContent);
  testInfo.attachments.push({
    name: `${name}.html`,
    contentType: 'text/html',
    path: outputPath,
  });
} 