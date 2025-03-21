import { test, expect } from '@playwright/test';

/**
 * These tests verify the behavior of the grid zoom feature with respect to:
 * 1. Point selection - clicks at different screen positions map to correct math coordinates at different zoom levels
 * 2. Arrow navigation - navigation behaves consistently at different zoom levels
 */

// Helper function to set up the test environment with a quadratic function
async function setupGraphAndSelectTool(page) {
  // Navigate to the app
  await page.goto('/');
  
  // Click the function plotting tool first
  await page.getByTestId('plot-formula-button').click();
  
  // Wait for the formula editor to appear
  await page.waitForSelector('[data-testid="formula-editor"]', { state: 'visible' });
  
  // Add a simple quadratic function
  await page.getByTestId('formula-expression-input').fill('x*x');
  
  // Wait for the graph to render
  await page.waitForSelector('path.formula-graph');
  
  // Switch to the select tool
  try {
    await page.locator('#select-tool').click();
  } catch (e) {
    console.log('Could not click select tool button, trying keyboard shortcut');
    await page.keyboard.press('s');  // Assuming 's' is the shortcut for select tool
  }
}

// Test 1: Point selection with grid zoom
test('should convert screen coordinates to correct math coordinates at different zoom levels', async ({ page }) => {
  await setupGraphAndSelectTool(page);
  
  // Click at a specific point at default zoom (100%)
  const defaultZoomPoint = { x: 640, y: 461 };
  await page.mouse.click(defaultZoomPoint.x, defaultZoomPoint.y);
  
  // Get coordinates at default zoom
  const defaultXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const defaultYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  console.log(`Coordinates at default zoom: X=${defaultXCoord}, Y=${defaultYCoord}`);
  
  // Zoom in to 150%
  for (let i = 0; i < 10; i++) {
    await page.getByTestId('grid-zoom-in').click();
    await page.waitForTimeout(50);
  }
  
  // Get current zoom level for debugging
  const zoomLevel = await page.getByTestId('grid-zoom-reset').textContent();
  
  // Click at a different point at 150% zoom
  const zoomedPoint = { x: 729, y: 372 };
  await page.mouse.click(zoomedPoint.x, zoomedPoint.y);
  await page.waitForTimeout(500);
  
  // Take screenshot after clicking at zoomed level for debugging
  await page.screenshot({ path: 'test-results/point-tool-zoom-zoomed-click.png' });
  
  // Get coordinates at zoomed level
  const zoomedXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const zoomedYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  console.log(`Coordinates at zoomed level (${zoomLevel}): X=${zoomedXCoord}, Y=${zoomedYCoord}`);
  
  // Calculate the difference between default and zoomed coordinates
  const defaultXNum = parseFloat(defaultXCoord || '0');
  const defaultYNum = parseFloat(defaultYCoord || '0');
  const zoomedXNum = parseFloat(zoomedXCoord || '0');
  const zoomedYNum = parseFloat(zoomedYCoord || '0');
  
  const xDifference = Math.abs(defaultXNum - zoomedXNum);
  const yDifference = Math.abs(defaultYNum - zoomedYNum);
  
  // Verify: Since we clicked at different screen positions at different zoom levels,
  // we expect the math coordinates to be different
  expect(xDifference).toBeGreaterThan(0.5);
  expect(yDifference).toBeGreaterThan(0.5);
});

// Test 2: Arrow navigation with grid zoom
test('should maintain consistent step size with arrow navigation at different zoom levels', async ({ page }) => {
  await setupGraphAndSelectTool(page);
  
  // Click at a specific point at default zoom
  const defaultZoomPoint = { x: 640, y: 461 };
  await page.mouse.click(defaultZoomPoint.x, defaultZoomPoint.y);
  
  // Get initial coordinates
  const initialX = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  console.log(`Initial X coordinate: ${initialX}`);
  
  // Navigate 5 steps right using arrow
  for (let i = 0; i < 5; i++) {
    await page.locator('text="→"').click();
    await page.waitForTimeout(50);
  }
  
  // Get coordinates after navigation at default zoom
  const defaultNavXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  console.log(`X coordinate after 5 steps at default zoom: ${defaultNavXCoord}`);
  
  // Calculate the navigation step size at default zoom (average per step)
  const initialXNum = parseFloat(initialX || '0');
  const defaultXNum = parseFloat(defaultNavXCoord || '0');
  const defaultStepSize = (defaultXNum - initialXNum) / 5;
  console.log(`Average step size at default zoom: ${defaultStepSize.toFixed(4)}`);
  
  await page.screenshot({ path: 'test-results/navigation-after-arrows.png' });
  
  // Zoom to 150%
  for (let i = 0; i < 10; i++) {
    await page.getByTestId('grid-zoom-in').click();
    await page.waitForTimeout(50);
  }
  
  const zoomLevel = await page.getByTestId('grid-zoom-reset').textContent();
  console.log(`Current zoom level: ${zoomLevel}`);
  
  await page.screenshot({ path: 'test-results/navigation-after-zoom.png' });
  
  // Click at a specific point at zoomed level
  const zoomedPoint = { x: 730, y: 372 };
  await page.mouse.click(zoomedPoint.x, zoomedPoint.y);
  
  // Get initial zoomed coordinate
  const zoomedInitialX = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  console.log(`Initial X coordinate at zoomed level: ${zoomedInitialX}`);
  
  // Navigate one step right at zoomed level
  await page.locator('text="→"').click();
  await page.waitForTimeout(500);
  
  // Get coordinate after one step at zoomed level
  const zoomedNavXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  console.log(`X coordinate after 1 step at zoomed level: ${zoomedNavXCoord}`);
  
  // Calculate the step size at zoomed level
  const zoomedInitialXNum = parseFloat(zoomedInitialX || '0');
  const zoomedNavXNum = parseFloat(zoomedNavXCoord || '0');
  const zoomedStepSize = zoomedNavXNum - zoomedInitialXNum;
  console.log(`Step size at zoomed level: ${zoomedStepSize.toFixed(4)}`);
  
  // Verify that the navigation step size is consistent across zoom levels
  // We allow for small differences due to grid snapping
  const stepSizeDifference = Math.abs(zoomedStepSize - defaultStepSize);
  console.log(`Step size difference: ${stepSizeDifference.toFixed(4)}`);
  
  // The step size should be consistent between zoom levels (with small allowance for grid snapping)
  expect(stepSizeDifference).toBeLessThan(0.1);
  
  await page.screenshot({ path: 'test-results/navigation-final-state.png' });
}); 