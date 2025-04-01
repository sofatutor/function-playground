import { test, expect } from '@playwright/test';

test.describe('Grid Zoom', () => {
  test('should zoom in and out using buttons', async ({ page }) => {
    await page.goto('/');
    
    // Get the zoom percentage button
    const zoomPercentageButton = page.locator('[data-testid="grid-zoom-reset"]');
    
    // Initial zoom should be 100%
    await expect(zoomPercentageButton).toHaveText('100%');
    
    // Zoom in button should be the third button with aria-label
    const zoomInButton = page.locator('[data-testid="grid-zoom-in"]');
    
    // Click zoom in and wait for UI update
    await zoomInButton.click();
    await page.waitForTimeout(300); // Allow time for zoom change to reflect in UI
    
    // Zoom should increase
    await expect(zoomPercentageButton).not.toHaveText('100%');
    
    // Zoom out button should be the first button
    const zoomOutButton = page.locator('[data-testid="grid-zoom-out"]');
    
    // Click zoom out and wait for UI update
    await zoomOutButton.click();
    await page.waitForTimeout(300);
    
    // Zoom should return to 100%
    await expect(zoomPercentageButton).toHaveText('100%');
    
    // Reset should work by clicking the percentage button
    await zoomInButton.click();
    await page.waitForTimeout(300);
    await zoomPercentageButton.click();
    await page.waitForTimeout(300);
    await expect(zoomPercentageButton).toHaveText('100%');
  });
  
  test('should zoom with keyboard shortcuts', async ({ page }) => {
    await page.goto('/');
    
    // Get the zoom percentage button
    const zoomPercentageButton = page.locator('[data-testid="grid-zoom-reset"]');
    
    // Initial zoom should be 100%
    await expect(zoomPercentageButton).toHaveText('100%');
    
    // Zoom in with Ctrl+Plus
    await page.keyboard.press('Control+=');
    await page.waitForTimeout(300);
    
    // Check zoom increased
    await expect(zoomPercentageButton).not.toHaveText('100%');
    
    // Get current zoom value for comparison
    const zoomAfterIncrease = await zoomPercentageButton.textContent();
    
    // Zoom out with Ctrl+Minus
    await page.keyboard.press('Control+-');
    await page.waitForTimeout(300);
    
    // Check zoom decreased
    const zoomAfterDecrease = await zoomPercentageButton.textContent();
    expect(zoomAfterDecrease).not.toEqual(zoomAfterIncrease);
    
    // Reset with Ctrl+0
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(300);
    await expect(zoomPercentageButton).toHaveText('100%');
  });
  
  test('should respect zoom limits', async ({ page }) => {
    await page.goto('/');
    
    // Get the zoom percentage button
    const zoomPercentageButton = page.locator('[data-testid="grid-zoom-reset"]');
    
    // Try to zoom out below minimum
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Control+-');
      await page.waitForTimeout(50); // Small wait between keypresses
    }
    await page.waitForTimeout(300);
    
    // Zooming should stop at minimum (approximately 30%)
    const minZoomText = await zoomPercentageButton.textContent();
    const minZoomValue = parseInt(minZoomText?.replace('%', '') || '0');
    expect(minZoomValue).toBeGreaterThanOrEqual(30);
    expect(minZoomValue).toBeLessThanOrEqual(40); // Allow some flexibility
    
    // Reset to 100%
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(300);
    
    // Try to zoom in above maximum
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Control+=');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(300);
    
    // Zooming should stop at maximum (approximately 300%)
    const maxZoomText = await zoomPercentageButton.textContent();
    const maxZoomValue = parseInt(maxZoomText?.replace('%', '') || '0');
    expect(maxZoomValue).toBeGreaterThanOrEqual(295);
    expect(maxZoomValue).toBeLessThanOrEqual(305); // Allow some flexibility
  });
  
  test('should persist zoom level across page reloads', async ({ page }) => {
    await page.goto('/');
    
    // Get the zoom percentage button
    const zoomPercentageButton = page.locator('[data-testid="grid-zoom-reset"]');
    
    // Zoom in a few times
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Control+=');
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(300);
    
    // Get the current zoom level
    const zoomBeforeReload = await zoomPercentageButton.textContent();
    
    // Reload the page
    await page.reload();
    await page.waitForTimeout(500); // Wait longer for page reload
    
    // Check that zoom level is preserved
    await expect(zoomPercentageButton).toHaveText(zoomBeforeReload || '');
    
    // Reset to 100% for clean state
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(300);
    await expect(zoomPercentageButton).toHaveText('100%');
  });
}); 