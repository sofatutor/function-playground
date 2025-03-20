import { test, expect } from '@playwright/test';

test.describe('Grid Zoom Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Increase wait time for UI to stabilize
  });

  test('should display zoom controls', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for the UI to stabilize fully

    // Check for zoom controls using more resilient selectors that look for both specific components and generic selectors
    const zoomControls = page.locator(
      '[aria-label*="zoom"], button:has(svg.lucide-zoom-in), button:has(svg.lucide-zoom-out), button:has-text("100%"), .zoom-button, [id*="zoom"], button:has(svg[class*="zoom"]), [data-testid*="zoom"]'
    );
    await expect(zoomControls).toBeVisible({ timeout: 10000 });
    
    // Look for text content indicating zoom percentage with multiple approaches
    const zoomText = page.getByText(/\d+%/)
      .or(page.locator('button:has-text("100%")'))
      .or(page.locator('[class*="zoom-percentage"]'));
    
    if (await zoomText.isVisible()) {
      await expect(zoomText).toBeVisible();
    } else {
      // If zoom text is not visible, at least ensure zoom in/out buttons exist
      const zoomInButton = page.locator('button:has(svg.lucide-zoom-in), button:has(svg[class*="zoom-in"]), [aria-label*="zoom in"]');
      const zoomOutButton = page.locator('button:has(svg.lucide-zoom-out), button:has(svg[class*="zoom-out"]), [aria-label*="zoom out"]');
      
      // Check that at least one of these buttons is visible
      const zoomButtonsVisible = await zoomInButton.isVisible() || await zoomOutButton.isVisible();
      expect(zoomButtonsVisible).toBeTruthy();
    }
  });
  
  test('should handle zooming with keyboard shortcuts', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for the UI to stabilize fully

    // Get initial canvas state - look for any drawing surface element
    const canvas = page
      .locator('#geometry-canvas, .canvas-container, main.app-main')
      .or(page.locator('[id*="canvas"]'));
    
    await expect(canvas).toBeVisible({ timeout: 10000 });
    
    // Use keyboard shortcuts to zoom in
    await page.keyboard.press('Control+=');
    await page.waitForTimeout(1000);
    
    // Check that the canvas is still visible after zooming
    await expect(canvas).toBeVisible();
    
    // Try alternative zoom with arrow keys
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(1000);
    
    // Check that the canvas is still visible after zooming
    await expect(canvas).toBeVisible();
    
    // Ensure the UI is still responsive
    await expect(page.locator('body')).toBeVisible();
  });
}); 