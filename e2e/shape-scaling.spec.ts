import { test, expect } from '@playwright/test';

test.describe('Shape Scaling', () => {
  test('should maintain shape positions when zooming', async ({ page }) => {
    await page.goto('/');
    
    // Create a rectangle
    const canvas = page.locator('.geometry-canvas');
    await canvas.click({ position: { x: 300, y: 200 } });
    await page.keyboard.press('r');
    await page.mouse.down();
    await page.mouse.move(400, 300);
    await page.mouse.up();
    
    // Get the initial position of the rectangle
    const rectangle = page.locator('.geometry-canvas div[style*="width"][style*="height"]').first();
    const initialBoundingBox = await rectangle.boundingBox();
    if (!initialBoundingBox) {
      throw new Error('Could not get initial bounding box');
    }
    
    // Zoom in
    const zoomInButton = page.getByRole('button').filter({ hasText: '' }).last();
    await zoomInButton.click();
    await zoomInButton.click();
    
    // Get the position after zooming in
    const zoomedInBoundingBox = await rectangle.boundingBox();
    if (!zoomedInBoundingBox) {
      throw new Error('Could not get zoomed in bounding box');
    }
    
    // The center position should remain the same (with some tolerance for rounding)
    const initialCenterX = initialBoundingBox.x + initialBoundingBox.width / 2;
    const initialCenterY = initialBoundingBox.y + initialBoundingBox.height / 2;
    const zoomedInCenterX = zoomedInBoundingBox.x + zoomedInBoundingBox.width / 2;
    const zoomedInCenterY = zoomedInBoundingBox.y + zoomedInBoundingBox.height / 2;
    
    expect(Math.abs(zoomedInCenterX - initialCenterX)).toBeLessThan(2);
    expect(Math.abs(zoomedInCenterY - initialCenterY)).toBeLessThan(2);
    
    // The dimensions should be scaled up
    expect(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);
    expect(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
    
    // Zoom out back to 100%
    const zoomDisplay = page.getByRole('button', { name: /\d+%/ });
    await zoomDisplay.click();
    
    // Get the position after resetting zoom
    const resetBoundingBox = await rectangle.boundingBox();
    if (!resetBoundingBox) {
      throw new Error('Could not get reset bounding box');
    }
    
    // The dimensions should be back to the original
    expect(Math.abs(resetBoundingBox.width - initialBoundingBox.width)).toBeLessThan(2);
    expect(Math.abs(resetBoundingBox.height - initialBoundingBox.height)).toBeLessThan(2);
  });
  
  test('should not compound scaling when zooming multiple times', async ({ page }) => {
    await page.goto('/');
    
    // Create a rectangle
    const canvas = page.locator('.geometry-canvas');
    await canvas.click({ position: { x: 300, y: 200 } });
    await page.keyboard.press('r');
    await page.mouse.down();
    await page.mouse.move(400, 300);
    await page.mouse.up();
    
    // Get the initial dimensions of the rectangle
    const rectangle = page.locator('.geometry-canvas div[style*="width"][style*="height"]').first();
    const initialBoundingBox = await rectangle.boundingBox();
    if (!initialBoundingBox) {
      throw new Error('Could not get initial bounding box');
    }
    
    // Zoom in twice
    const zoomInButton = page.getByRole('button').filter({ hasText: '' }).last();
    await zoomInButton.click();
    await zoomInButton.click();
    
    // Get dimensions after first zoom
    const firstZoomBoundingBox = await rectangle.boundingBox();
    if (!firstZoomBoundingBox) {
      throw new Error('Could not get first zoom bounding box');
    }
    
    // Zoom out and then in again
    const zoomOutButton = page.getByRole('button').filter({ hasText: '' }).first();
    await zoomOutButton.click();
    await zoomOutButton.click();
    await zoomInButton.click();
    await zoomInButton.click();
    
    // Get dimensions after second zoom
    const secondZoomBoundingBox = await rectangle.boundingBox();
    if (!secondZoomBoundingBox) {
      throw new Error('Could not get second zoom bounding box');
    }
    
    // The dimensions should be the same after both zoom operations
    expect(Math.abs(secondZoomBoundingBox.width - firstZoomBoundingBox.width)).toBeLessThan(2);
    expect(Math.abs(secondZoomBoundingBox.height - firstZoomBoundingBox.height)).toBeLessThan(2);
  });
}); 