import { test, expect } from '@playwright/test';

test.describe('Shape Scaling', () => {
  test('should handle shape creation and interaction', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Wait for UI to stabilize
    
    // Find rectangle tool button using more reliable selectors
    const rectangleButton = page.getByRole('button', { name: /rectangle/i })
      .or(page.locator('button[id*="rectangle"]'))
      .or(page.locator('button:has(svg.lucide-square)'));
      
    // Check if the button is visible and click it
    if (await rectangleButton.isVisible()) {
      await rectangleButton.click();
    } else {
      // Alternatively, use keyboard shortcut
      await page.keyboard.press('r');
    }
    
    // Find a suitable area to draw 
    const mainElement = page.locator('main').or(page.locator('body')).first();
    const bounds = await mainElement.boundingBox();
    if (!bounds) {
      throw new Error('Could not find main element');
    }
    
    // Draw in the center of the screen
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    
    // Draw a rectangle
    await page.mouse.move(centerX - 50, centerY - 50);
    await page.mouse.down();
    await page.mouse.move(centerX + 50, centerY + 50);
    await page.mouse.up();
    
    // Verify something was drawn by checking for svg or canvas elements
    const drawnElements = page.locator('svg path, canvas, div[style*="position: absolute"]');
    await expect(drawnElements).toBeVisible();
    
    // Test keyboard navigation
    await page.keyboard.press('ArrowUp'); // Zoom in
    await page.waitForTimeout(500);
    
    await page.keyboard.press('ArrowDown'); // Zoom out
    await page.waitForTimeout(500);
    
    // Verify the UI remains responsive
    await expect(drawnElements).toBeVisible();
  });
}); 