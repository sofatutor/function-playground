import { expect } from '@playwright/test';
import { test } from './test-helper';
import { Logger } from './utils/logger';

test.describe('Shape Creation with Zoom', () => {
  test('should create shapes of consistent size regardless of zoom level', async ({ page }) => {
    // Navigate to the page and wait for it to load
    await page.goto('/');
    
    // Find the canvas element
    const canvasElement = page.locator('#geometry-canvas, .canvas-container');
    await expect(canvasElement).toBeVisible();
    
    const bounds = await canvasElement.boundingBox();
    if (!bounds) {
      throw new Error('Could not get bounds of canvas element');
    }
    
    // Get reference to zoom controls
    const zoomInButton = page.locator('[data-testid="grid-zoom-in"]');
    const zoomResetButton = page.locator('[data-testid="grid-zoom-reset"]');
    
    await expect(zoomInButton).toBeVisible();
    await expect(zoomResetButton).toBeVisible();
    
    // Zoom in several times to amplify the effect
    for (let i = 0; i < 10; i++) {
      await zoomInButton.click();
      await page.waitForTimeout(10); // Short wait for zoom to apply
    }
    
    // Find and click on the rectangle tool button
    const rectangleButton = page.locator('button[title="Rectangle"], button[aria-label="Rectangle"], #rectangle-tool, [data-tool="rectangle"]');
    await expect(rectangleButton).toBeVisible();
    await rectangleButton.click();
    
    // Calculate center and draw points
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const startX = centerX - 50;
    const startY = centerY - 50;
    const endX = centerX + 50;
    const endY = centerY + 50;
    
    // Create first shape at zoomed level
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    
    // Get the preview element - it's likely a div with a dashed/solid border
    const previewElement = page.locator('.pointer-events-none.absolute').first();
    const previewBounds = await previewElement.boundingBox();
    
    if (!previewBounds) {
      throw new Error('Could not get bounds of preview element');
    }
    
    // Log preview dimensions
    Logger.debug('Preview shape dimensions:', {
      width: previewBounds.width,
      height: previewBounds.height
    });
    
    // Now release the mouse to create the shape
    await page.mouse.up();
    
    // Wait for the shape to be created and rendered
    // Rectangle is rendered as a div with the 'absolute border-[1px]' classes
    const zoomedShape = page.locator('.absolute.border-\\[1px\\]').first();
    await expect(zoomedShape).toBeVisible({ timeout: 2000 });
    
    // Get dimensions of the zoomed shape
    const zoomedShapeBounds = await zoomedShape.boundingBox();
    if (!zoomedShapeBounds) {
      throw new Error('Could not get bounds of zoomed shape');
    }
    
    // Log the dimensions for comparison
    Logger.debug('Zoomed shape dimensions after creation:', {
      width: zoomedShapeBounds.width,
      height: zoomedShapeBounds.height
    });
    
    // Check if preview and created shape have similar dimensions (they should)
    Logger.debug('Difference between preview and created shape:', {
      widthDiff: Math.abs(previewBounds.width - zoomedShapeBounds.width),
      heightDiff: Math.abs(previewBounds.height - zoomedShapeBounds.height)
    });
    
    // Log more detailed information about the shape dimensions
    Logger.debug('Detailed shape comparison:', {
      zoomedPreview: {
        left: previewBounds.x,
        top: previewBounds.y,
        width: previewBounds.width,
        height: previewBounds.height,
        right: previewBounds.x + previewBounds.width,
        bottom: previewBounds.y + previewBounds.height
      },
      zoomedCreated: {
        left: zoomedShapeBounds.x,
        top: zoomedShapeBounds.y,
        width: zoomedShapeBounds.width,
        height: zoomedShapeBounds.height,
        right: zoomedShapeBounds.x + zoomedShapeBounds.width,
        bottom: zoomedShapeBounds.y + zoomedShapeBounds.height
      },
      zoomFactor: 1.2 ** 5 // Assuming default zoom factor increment is 1.2, zoomed in 5 times
    });
    
    // Return to 100% zoom
    await zoomResetButton.click();
    await page.waitForTimeout(100); // Wait for zoom to reset
    
    // Click rectangle tool button again
    await rectangleButton.click();
    
    // Create second shape with same mouse movements at 100% zoom
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    
    // Get the preview element for unzoomed shape
    const unzoomedPreviewElement = page.locator('.pointer-events-none.absolute').first();
    const unzoomedPreviewBounds = await unzoomedPreviewElement.boundingBox();
    
    if (!unzoomedPreviewBounds) {
      throw new Error('Could not get bounds of unzoomed preview element');
    }
    
    // Log unzoomed preview dimensions
    Logger.debug('Unzoomed preview shape dimensions:', {
      width: unzoomedPreviewBounds.width,
      height: unzoomedPreviewBounds.height
    });
    
    // Now release the mouse to create the shape
    await page.mouse.up();
    
    // Wait for the shape to be created
    const unzoomedShape = page.locator('.absolute.border-\\[1px\\]').nth(1);
    await expect(unzoomedShape).toBeVisible({ timeout: 2000 });
    
    // Get dimensions of the unzoomed shape
    const unzoomedShapeBounds = await unzoomedShape.boundingBox();
    if (!unzoomedShapeBounds) {
      throw new Error('Could not get bounds of unzoomed shape');
    }
    
    // Log all dimensions for comparison
    Logger.debug('Shapes comparison:', {
      zoomedPreview: {
        width: previewBounds.width,
        height: previewBounds.height
      },
      zoomedCreated: {
        width: zoomedShapeBounds.width,
        height: zoomedShapeBounds.height
      },
      unzoomedPreview: {
        width: unzoomedPreviewBounds.width,
        height: unzoomedPreviewBounds.height
      },
      unzoomedCreated: {
        width: unzoomedShapeBounds.width,
        height: unzoomedShapeBounds.height
      }
    });
    
    // Increase tolerance for zoom differences between preview and SVG shapes
    // We need a small tolerance for potential browser rendering differences
    const TOLERANCE = 3;
    
    // 1. Preview shape size should match created shape size when zoomed within the tolerance
    expect(Math.abs(previewBounds.width - zoomedShapeBounds.width)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(previewBounds.height - zoomedShapeBounds.height)).toBeLessThanOrEqual(TOLERANCE);
    
    // 2. Unzoomed preview should match unzoomed created shape within the tolerance
    expect(Math.abs(unzoomedPreviewBounds.width - unzoomedShapeBounds.width)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(unzoomedPreviewBounds.height - unzoomedShapeBounds.height)).toBeLessThanOrEqual(TOLERANCE);
    
    // 3. Both created shapes should have similar dimensions regardless of zoom level
    expect(Math.abs(zoomedShapeBounds.width - unzoomedShapeBounds.width)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(zoomedShapeBounds.height - unzoomedShapeBounds.height)).toBeLessThanOrEqual(TOLERANCE);
    
    // Test for line tool specifically 
    await page.locator('#line-tool').click();
    console.log('[DEBUG] Testing line tool specifically');
    
    // Draw a line from top-left to bottom-right
    await page.mouse.move(centerX - 50, centerY - 50);
    await page.mouse.down();
    
    // Wait briefly for the preview to appear
    await page.waitForTimeout(100);
    
    // Get the preview line dimensions
    const linePreviewBoundingBox = await page.locator('.pointer-events-none').first().boundingBox();
    console.log('[DEBUG] Line preview bounding box:', linePreviewBoundingBox);
    
    // Complete the drawing action
    await page.mouse.move(centerX + 50, centerY + 50);
    await page.mouse.up();
    
    // Wait for the shape to be created
    await page.waitForTimeout(200);
    
    // Get the created line's dimensions by finding the SVG container of the line
    const createdLine = await page.locator('line').first().boundingBox();
    console.log('[DEBUG] Created line bounding box:', createdLine);
    
    // Compare line dimensions
    if (linePreviewBoundingBox && createdLine) {
      const lineDiffs = {
        widthDiff: Math.abs(linePreviewBoundingBox.width - createdLine.width),
        heightDiff: Math.abs(linePreviewBoundingBox.height - createdLine.height)
      };
      
      console.log('[DEBUG] Line differences:', lineDiffs);
      
      // Verify the line dimensions are consistent
      expect(lineDiffs.widthDiff).toBeLessThanOrEqual(TOLERANCE);
      expect(lineDiffs.heightDiff).toBeLessThanOrEqual(TOLERANCE);
    }
  });
}); 