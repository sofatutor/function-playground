import { expect } from '@playwright/test';
import { test } from './test-helper';
import { Logger } from './utils/logger';

test.describe('Grid Zoom Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should display zoom controls', async ({ page }) => {
    await page.goto('/');

    // Look for specific zoom buttons based on component structure
    const zoomOutButton = page.locator('button:has(svg:has(path[d*="M8 11H14"]), svg.lucide-zoom-out)');
    const zoomInButton = page.locator('button:has(svg:has(path[d*="M11 8V14"]), svg.lucide-zoom-in)');
    const zoomPercentButton = page.locator('button:has-text("100%"), button:has-text("50%"), button:has-text("200%")');
    
    // Check if at least one of the zoom controls is visible
    const zoomOutVisible = await zoomOutButton.isVisible();
    const zoomInVisible = await zoomInButton.isVisible();
    const zoomPercentVisible = await zoomPercentButton.isVisible();
    
    const zoomControlsVisible = zoomOutVisible || zoomInVisible || zoomPercentVisible;
    expect(zoomControlsVisible).toBeTruthy();
    
    // If the percentage button is visible, verify it shows a number with %
    if (zoomPercentVisible) {
      const zoomText = await zoomPercentButton.textContent();
      expect(zoomText).toMatch(/\d+%/);
    }
  });
  
  test('should handle zooming with keyboard shortcuts', async ({ page }) => {
    await page.goto('/');

    // Get initial canvas state - look for any drawing surface element
    const canvas = page
      .locator('#geometry-canvas, .canvas-container, main.app-main')
      .or(page.locator('[id*="canvas"]'));
    
    await expect(canvas).toBeVisible({ timeout: 10000 });
    
    // Use keyboard shortcuts to zoom in
    await page.keyboard.press('Control+=');
    
    // Check that the canvas is still visible after zooming
    await expect(canvas).toBeVisible();
    
    // Try alternative zoom with arrow keys
    await page.keyboard.press('ArrowUp');
    
    // Check that the canvas is still visible after zooming
    await expect(canvas).toBeVisible();
    
    // Ensure the UI is still responsive
    await expect(page.locator('body')).toBeVisible();
  });
});