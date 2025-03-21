import { test, expect } from '@playwright/test';
import { captureHtmlSnapshot } from './utils/snapshot-helpers';

test.describe('Circle Drawing', () => {
  test('should draw a circle that stays at the drawn position', async ({ page }) => {
    // Navigate to the page and wait for it to load
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for the UI to stabilize

    // Take a screenshot of the initial state
    await page.screenshot({ path: 'test-results/circle-before.png' });

    // Find and click the circle tool button
    const circleButton = page.locator('#circle-tool');
    await expect(circleButton).toBeVisible({ timeout: 5000 });
    
    try {
      await circleButton.click();
    } catch (e) {
      console.log('Could not click circle button, trying keyboard shortcut');
      await page.keyboard.press('c'); // Assuming 'c' is shortcut for circle
    }
    
    await page.waitForTimeout(1000); // Wait for tool selection to take effect

    // Find the canvas container
    const canvasContainer = page.locator('#geometry-canvas, .canvas-container');
    await expect(canvasContainer).toBeVisible();
    
    const bounds = await canvasContainer.boundingBox();
    if (!bounds) {
      throw new Error('Could not get bounds of canvas container');
    }

    // Calculate center and draw a circle
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    
    // Starting position (center of circle)
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    
    // Move to create circle with radius 100px
    await page.mouse.move(centerX + 100, centerY);
    await page.mouse.up();
    
    await page.waitForTimeout(1000); // Wait for drawing to complete

    // Take a screenshot after drawing
    await page.screenshot({ path: 'test-results/circle-after-draw.png' });
    
    // Save a snapshot of the HTML content
    await captureHtmlSnapshot(page, test.info(), 'circle-after-draw');

    // Verify the circle is visible and in the correct position
    // We'll look for div elements with rounded borders (circles)
    const circleElements = page.locator('.rounded-full');
    await expect(circleElements).toBeVisible();
    
    // Get the position of the drawn circle
    const circleElement = circleElements.first();
    const circleBounds = await circleElement.boundingBox();
    
    if (!circleBounds) {
      throw new Error('Could not get bounds of circle element');
    }
    
    // Calculate center point of the drawn circle
    const circleCenter = {
      x: circleBounds.x + circleBounds.width / 2,
      y: circleBounds.y + circleBounds.height / 2
    };
    
    // The center of the circle should be close to where we started drawing
    expect(Math.abs(circleCenter.x - centerX)).toBeLessThan(10);
    expect(Math.abs(circleCenter.y - centerY)).toBeLessThan(10);
    
    console.log(`Expected circle center: (${centerX}, ${centerY})`);
    console.log(`Actual circle center: (${circleCenter.x}, ${circleCenter.y})`);
    
    // Take a final screenshot
    await page.screenshot({ path: 'test-results/circle-final.png' });
  });
}); 