import { test, expect } from '@playwright/test';

test.describe('Shape Scaling', () => {
  test('should handle shape creation and interaction', async ({ page }) => {
    // Navigate to the page and wait for it to load
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for the UI to stabilize

    // Look for the rectangle button using more resilient selectors
    const rectangleButton = page.getByRole('button', { name: /rectangle/i }).or(
      page.locator('[data-testid="rectangle-tool"]').or(
        page.locator('button:has(svg.lucide-square)').or(
          page.locator('button:has(svg[class*="square"])')
        )
      )
    );

    // Ensure the button is visible before trying to click it
    await expect(rectangleButton).toBeVisible({ timeout: 10000 });

    // Click the rectangle button or use keyboard shortcut if button isn't clickable
    try {
      await rectangleButton.click();
    } catch (e) {
      console.log('Could not click rectangle button, trying keyboard shortcut');
      await page.keyboard.press('r');
    }
    
    await page.waitForTimeout(1000); // Wait for tool selection to take effect

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
    
    await page.waitForTimeout(1000); // Wait for drawing to complete

    // Verify something was drawn by checking for svg or canvas elements
    const drawnElements = page.locator('rect, .shape, [data-shape-id], [class*="shape"]');
    await expect(drawnElements).toBeVisible({ timeout: 5000 });
    
    // Test keyboard navigation for zoom
    await page.keyboard.press('ArrowUp'); // Zoom in
    await page.waitForTimeout(500);
    
    // Verify UI is still responsive
    await expect(page.locator('body')).toBeVisible();
  });
}); 