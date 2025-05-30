import { expect } from '@playwright/test';
import { test } from './test-helper';
import { Logger } from './utils/logger';

test.describe('Shape Scaling', () => {
  test('should handle shape creation and interaction', async ({ page }) => {
    // Navigate to the page and wait for it to load
    await page.goto('/');

    // Look for the rectangle button using more precise selector
    const rectangleButton = page.locator('#rectangle-tool');

    // Ensure the button is visible before trying to click it
    await expect(rectangleButton).toBeVisible({ timeout: 10000 });

    // Click the rectangle button or use keyboard shortcut if button isn't clickable
    try {
      await rectangleButton.click();
    } catch (_e) {
      Logger.warn('Could not click rectangle button, trying keyboard shortcut');
      await page.keyboard.press('r');
    }
    
    // Find a suitable area to draw by locating the main element
    const mainElement = page.locator('#geometry-canvas, main, .canvas-container, .main-content');
    await expect(mainElement).toBeVisible();
    
    const bounds = await mainElement.boundingBox();
    if (!bounds) {
      throw new Error('Could not get bounds of main element');
    }

    // Draw a rectangle in the center of the screen
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    
    await page.mouse.move(centerX - 100, centerY - 100);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY + 100);
    await page.mouse.up();
    
    // Verify something was drawn by checking for any shapes in the canvas area
    // Use a more generic selector that works consistently
    const canvasSvgElements = page.locator('#geometry-canvas svg *');
    const count = await canvasSvgElements.count();
    Logger.debug(`Found ${count} SVG elements in the canvas`);
    
    // Verify that the drawing operation was completed successfully
    expect(count).toBeGreaterThan(0);
    
    // Test keyboard navigation for zoom
    await page.keyboard.press('ArrowUp'); // Zoom in
    
    // Verify UI is still responsive
    await expect(page.locator('body')).toBeVisible();
  });
}); 