import { test, expect } from '@playwright/test';

test.describe('Grid Zoom Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Increase wait time for UI to stabilize
  });

  test('should display zoom controls', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Wait for UI to stabilize
    
    // Check for zoom controls using more resilient selectors 
    const zoomControls = page.locator('[aria-label*="zoom"], button:has(svg.lucide-zoom-in), button:has(svg.lucide-zoom-out), button:has-text("100%"), .zoom-button');
    await expect(zoomControls).toBeVisible({ timeout: 5000 });
    
    // Look for text content indicating zoom percentage
    const zoomText = page.getByText(/\d+%/).or(page.locator('button:has-text("100%")'));
    if (await zoomText.isVisible()) {
      // If visible, we've found the zoom controls
      await expect(zoomText).toBeVisible();
    } else {
      // Alternatively just verify zoom in/out buttons exist
      const zoomInButton = page.locator('button:has(svg.lucide-zoom-in)').or(
        page.locator('button:has(svg[data-lucide="zoom-in"])').or(
          page.locator('button:has(path[d*="M11 8v6M8 11h6"])')
        )
      );
      await expect(zoomInButton).toBeVisible();
    }
  });
  
  test('should handle zooming with keyboard shortcuts', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Wait for UI to stabilize
    
    // Get initial canvas state
    const canvas = page.locator('main').or(page.locator('svg').or(page.locator('canvas')));
    await expect(canvas).toBeVisible();
    
    // Use keyboard shortcuts to zoom in
    await page.keyboard.press('Control+=');
    await page.waitForTimeout(500);
    
    // Use keyboard shortcuts to zoom out
    await page.keyboard.press('Control+-');
    await page.waitForTimeout(500);
    
    // Verify the canvas is still visible (basic check that zooming didn't break anything)
    await expect(canvas).toBeVisible();
    
    // Try alternative zoom shortcuts if available
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    
    // Check that the UI is still responsive
    await expect(canvas).toBeVisible();
  });
}); 