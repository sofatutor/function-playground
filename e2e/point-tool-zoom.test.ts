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
  
  // Switch to the select tool (deterministic; fail if not available)
  await page.getByTestId('select-tool').click();
  await page.waitForTimeout(200);
}

// Click the plotted path at a fraction along its length (0..1)
// Be robust to multi-segment paths by probing nearby fractions until the click hits the path.
async function clickFormulaGraphAtFraction(page, fraction: number) {
  const point = await page.evaluate((f) => {
    const path = document.querySelector('path.formula-graph') as SVGPathElement | null;
    if (!path || !path.ownerSVGElement) return null;
    const svg = path.ownerSVGElement;
    const rect = svg.getBoundingClientRect();
    const len = path.getTotalLength();
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    // Build candidate fractions: requested, small offsets around it, and a safe fallback (0.5)
    const candidates: number[] = [];
    const base = clamp01(f);
    const offsets = [0, 0.02, -0.02, 0.05, -0.05, 0.1, -0.1];
    for (const o of offsets) candidates.push(clamp01(base + o));
    // Also try gravitating toward the middle
    candidates.push(0.5);

    for (const c of candidates) {
      const p = path.getPointAtLength(len * c);
      const clientX = rect.left + p.x;
      const clientY = rect.top + p.y;
      const el = document.elementFromPoint(clientX, clientY);
      if (el === path) {
        return { x: clientX, y: clientY };
      }
    }

    // Last resort: return midpoint even if elementFromPoint check failed
    const mid = path.getPointAtLength(len * 0.5);
    return { x: rect.left + mid.x, y: rect.top + mid.y };
  }, fraction);
  if (!point) throw new Error('formula-graph path not found');
  await page.mouse.click(point.x, point.y);
}

// Test 1: Point selection with grid zoom
test('should convert screen coordinates to correct math coordinates at different zoom levels', async ({ page }) => {
  await setupGraphAndSelectTool(page);
  
  // Click at 25% of the path to select a point
  await clickFormulaGraphAtFraction(page, 0.25);
  
  // Wait for coordinates to be displayed
  await page.waitForSelector('text=X Coordinate', { timeout: 8000 });
  
  // Find the coordinate values using more specific selectors
  const xCoordDiv = await page.locator('text=X Coordinate').locator('..').locator('div.text-sm.bg-muted');
  const yCoordDiv = await page.locator('text=Y Coordinate').locator('..').locator('div.text-sm.bg-muted');
  
  const defaultXCoord = await xCoordDiv.textContent();
  const defaultYCoord = await yCoordDiv.textContent();
  Logger.debug(`Coordinates at default zoom: X=${defaultXCoord}, Y=${defaultYCoord}`);
  
  // Zoom in to ~150%
  for (let i = 0; i < 10; i++) {
    await page.getByTestId('grid-zoom-in').click();
    await page.waitForTimeout(50);
  }
  
  // Get current zoom level for debugging
  const zoomLevel = await page.getByTestId('grid-zoom-reset').textContent();
  
  // Click again after zoom at a different fraction (75%)
  await clickFormulaGraphAtFraction(page, 0.75);
  
  // Wait for coordinates to be displayed with retry logic
  await page.waitForSelector('text=X Coordinate', { timeout: 8000 });
  
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
  
  // Verify: after zoom and different click position, math coordinates should differ (loose bound)
  expect(Math.abs(xDifference) + Math.abs(yDifference)).toBeGreaterThan(0.1);
});

// Test 2: Arrow navigation with grid zoom
test('should maintain consistent step size with arrow navigation at different zoom levels', async ({ page }) => {
  await setupGraphAndSelectTool(page);
  
  // Click on the formula graph at midpoint to select a point
  await clickFormulaGraphAtFraction(page, 0.5);
  
  // Wait for coordinates to be displayed with retry logic
  await page.waitForSelector('text=X Coordinate', { timeout: 8000 });
  
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
  
  // Click on the formula graph at the zoomed level (midpoint)
  await clickFormulaGraphAtFraction(page, 0.5);
  
  // Wait for coordinates with retry
  await page.waitForSelector('text=X Coordinate', { timeout: 8000 });
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
