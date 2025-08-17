import { expect } from '@playwright/test';
import { test } from './test-helper';
import { Logger } from './utils/logger';

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
  } catch (_e) {
    Logger.warn('Could not click select tool button, trying keyboard shortcut');
    await page.keyboard.press('v'); // Assuming 'v' is shortcut for select
  }
}

// Test 1: Point selection with grid zoom
test('should convert screen coordinates to correct math coordinates at different zoom levels', async ({ page }) => {
  await setupGraphAndSelectTool(page);
  
  // Click on the formula graph to select a point (instead of clicking at arbitrary coordinates)
  await page.locator('path.formula-graph').click({ force: true });
  
  // Wait for coordinates to be displayed and get them using a more specific selector
  await page.waitForSelector('text=X Coordinate', { timeout: 15000 });
  
  // Find the coordinate values using more specific selectors
  const xCoordDiv = await page.locator('text=X Coordinate').locator('..').locator('div.text-sm.bg-muted');
  const yCoordDiv = await page.locator('text=Y Coordinate').locator('..').locator('div.text-sm.bg-muted');
  
  const defaultXCoord = await xCoordDiv.textContent();
  const defaultYCoord = await yCoordDiv.textContent();
  Logger.debug(`Coordinates at default zoom: X=${defaultXCoord}, Y=${defaultYCoord}`);
  
  // Zoom in to 150%
  for (let i = 0; i < 10; i++) {
    await page.getByTestId('grid-zoom-in').click();
    await page.waitForTimeout(50);
  }
  
  // Get current zoom level for debugging
  const zoomLevel = await page.getByTestId('grid-zoom-reset').textContent();
  
  // Click on the formula graph at a different position after zooming (force click)
  await page.locator('path.formula-graph').click({ force: true });
  
  // Wait for coordinates to be displayed and get them using a more specific selector
  await page.waitForSelector('text=X Coordinate', { timeout: 15000 });
  
  const xCoordDiv2 = await page.locator('text=X Coordinate').locator('..').locator('div.text-sm.bg-muted');
  const yCoordDiv2 = await page.locator('text=Y Coordinate').locator('..').locator('div.text-sm.bg-muted');
  
  const zoomedXCoord = await xCoordDiv2.textContent();
  const zoomedYCoord = await yCoordDiv2.textContent();
  Logger.debug(`Coordinates at zoomed level (${zoomLevel}): X=${zoomedXCoord}, Y=${zoomedYCoord}`);
  
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
  
  // Click on the formula graph to select a point (force click to bypass grid lines)
  await page.locator('path.formula-graph').click({ force: true });
  
  // Wait for coordinates to be displayed and get them using a more specific selector
  await page.waitForSelector('text=X Coordinate', { timeout: 15000 });
  
  const xCoordDiv3 = await page.locator('text=X Coordinate').locator('..').locator('div.text-sm.bg-muted');
  const initialX = await xCoordDiv3.textContent();
  Logger.debug(`Initial X coordinate: ${initialX}`);
  
  // Navigate 5 steps right using arrow
  for (let i = 0; i < 5; i++) {
    await page.locator('text="→"').click();
    await page.waitForTimeout(50);
  }
  
  // Get coordinates after navigation at default zoom
  await page.waitForSelector('text=X Coordinate', { timeout: 15000 });
  const xCoordDiv4 = await page.locator('text=X Coordinate').locator('..').locator('div.text-sm.bg-muted');
  const defaultNavXCoord = await xCoordDiv4.textContent();
  Logger.debug(`X coordinate after 5 steps at default zoom: ${defaultNavXCoord}`);
  
  // Calculate the navigation step size at default zoom (average per step)
  const initialXNum = parseFloat(initialX || '0');
  const defaultXNum = parseFloat(defaultNavXCoord || '0');
  const defaultStepSize = (defaultXNum - initialXNum) / 5;
  Logger.debug(`Average step size at default zoom: ${defaultStepSize.toFixed(4)}`);
  
  await page.screenshot({ path: 'test-results/navigation-after-arrows.png' });
  
  // Zoom to 150%
  for (let i = 0; i < 10; i++) {
    await page.getByTestId('grid-zoom-in').click();
    await page.waitForTimeout(50);
  }
  
  const zoomLevel = await page.getByTestId('grid-zoom-reset').textContent();
  Logger.debug(`Current zoom level: ${zoomLevel}`);
  
  // Click on the formula graph at the zoomed level (force click)
  await page.locator('path.formula-graph').click({ force: true });
  
  // Get initial zoomed coordinate
  await page.waitForSelector('text=X Coordinate', { timeout: 15000 });
  const xCoordDiv5 = await page.locator('text=X Coordinate').locator('..').locator('div.text-sm.bg-muted');
  const zoomedInitialX = await xCoordDiv5.textContent();
  Logger.debug(`Initial X coordinate at zoomed level: ${zoomedInitialX}`);
  
  // Navigate one step right at zoomed level
  await page.locator('text="→"').click();
  
  // Get coordinate after one step at zoomed level
  await page.waitForSelector('text=X Coordinate', { timeout: 15000 });
  const xCoordDiv6 = await page.locator('text=X Coordinate').locator('..').locator('div.text-sm.bg-muted');
  const zoomedNavXCoord = await xCoordDiv6.textContent();
  Logger.debug(`X coordinate after 1 step at zoomed level: ${zoomedNavXCoord}`);
  
  // Calculate the step size at zoomed level
  const zoomedInitialXNum = parseFloat(zoomedInitialX || '0');
  const zoomedNavXNum = parseFloat(zoomedNavXCoord || '0');
  const zoomedStepSize = zoomedNavXNum - zoomedInitialXNum;
  Logger.debug(`Step size at zoomed level: ${zoomedStepSize.toFixed(4)}`);
  
  // Verify that the navigation step size is consistent across zoom levels
  // We allow for small differences due to grid snapping
  const stepSizeDifference = Math.abs(zoomedStepSize - defaultStepSize);
  Logger.debug(`Step size difference: ${stepSizeDifference.toFixed(4)}`);
  
  // The step size should be consistent between zoom levels (with small allowance for grid snapping)
  expect(stepSizeDifference).toBeLessThan(0.1);
});
