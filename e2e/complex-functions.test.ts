import { test, expect } from '@playwright/test';

test.describe('Complex Function Behaviors', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait for it to load completely
    await page.goto('/');
  });

  test('should handle tangent function asymptotes correctly', async ({ page }) => {
    // Add tangent function
    await page.click('button:has-text("Add Function")');
    await page.waitForSelector('input[placeholder="Enter function"]', { timeout: 5000 });
    await page.fill('input[placeholder="Enter function"]', 'Math.tan(x)');
    await page.click('button:has-text("Add")');

    // Wait for the graph to render
    await page.waitForSelector('path.formula-graph', { timeout: 10000 });

    // Get path data
    const pathData = await page.locator('path.formula-graph').first().getAttribute('d');
    expect(pathData).toBeTruthy();

    // Count the number of discontinuities (separate path segments)
    const moveCommands = pathData?.match(/M/g)?.length || 0;
    expect(moveCommands).toBeGreaterThan(1); // Should have multiple segments due to asymptotes
  });

  test('should handle logarithmic function domain correctly', async ({ page }) => {
    // Add logarithmic function
    await page.click('button:has-text("Add Function")');
    await page.waitForSelector('input[placeholder="Enter function"]', { timeout: 5000 });
    await page.fill('input[placeholder="Enter function"]', 'Math.log(x)');
    await page.click('button:has-text("Add")');

    // Wait for the graph to render
    await page.waitForSelector('path.formula-graph', { timeout: 10000 });

    // Get path data
    const pathData = await page.locator('path.formula-graph').first().getAttribute('d');
    expect(pathData).toBeTruthy();

    // Verify that the path starts after x = 0 (domain restriction)
    const points = pathData?.split(/[ML]/).filter(Boolean).map(point => {
      const [x, y] = point.split(',').map(Number);
      return { x, y };
    });
    expect(points?.every(p => p.x >= 0)).toBeTruthy();
  });

  test('should handle rational function with singularity', async ({ page }) => {
    // Add function with singularity
    await page.click('button:has-text("Add Function")');
    await page.waitForSelector('input[placeholder="Enter function"]', { timeout: 5000 });
    await page.fill('input[placeholder="Enter function"]', '1/x');
    await page.click('button:has-text("Add")');

    // Wait for the graph to render
    await page.waitForSelector('path.formula-graph', { timeout: 10000 });

    // Get path data
    const pathData = await page.locator('path.formula-graph').first().getAttribute('d');
    expect(pathData).toBeTruthy();

    // Count discontinuities
    const moveCommands = pathData?.match(/M/g)?.length || 0;
    expect(moveCommands).toBeGreaterThan(1); // Should have at least two segments (positive and negative x)
  });

  test('should handle composite trigonometric function', async ({ page }) => {
    // Add complex trigonometric function
    await page.click('button:has-text("Add Function")');
    await page.waitForSelector('input[placeholder="Enter function"]', { timeout: 5000 });
    await page.fill('input[placeholder="Enter function"]', 'Math.sin(Math.PI * Math.pow(x, 2))');
    await page.click('button:has-text("Add")');

    // Wait for the graph to render
    await page.waitForSelector('path.formula-graph', { timeout: 10000 });

    // Get path data
    const pathData = await page.locator('path.formula-graph').first().getAttribute('d');
    expect(pathData).toBeTruthy();

    // Verify high point density for complex oscillations
    const pointCount = (pathData?.match(/[ML]/g) || []).length;
    expect(pointCount).toBeGreaterThan(300); // Should have many points for accurate oscillation rendering
  });

  test('should handle zoom levels appropriately', async ({ page }) => {
    // Add a function
    await page.click('button:has-text("Add Function")');
    await page.waitForSelector('input[placeholder="Enter function"]', { timeout: 5000 });
    await page.fill('input[placeholder="Enter function"]', 'Math.sin(x)');
    await page.click('button:has-text("Add")');

    // Wait for initial render
    await page.waitForSelector('path.formula-graph', { timeout: 10000 });
    
    // Get initial path data
    const initialPath = await page.locator('path.formula-graph').first().getAttribute('d');
    expect(initialPath).toBeTruthy();

    // Zoom in (simulate mouse wheel)
    const canvas = await page.locator('canvas').first();
    const bounds = await canvas.boundingBox();
    expect(bounds).toBeTruthy();
    if (!bounds) throw new Error('Canvas not found');

    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.wheel(0, -100); // Zoom in

    // Wait for re-render
    await page.waitForTimeout(500);

    // Get zoomed path data
    const zoomedPath = await page.locator('path.formula-graph').first().getAttribute('d');
    expect(zoomedPath).toBeTruthy();
    expect(zoomedPath).not.toEqual(initialPath);

    // Verify point density increases with zoom
    const getPointCount = (path: string | null) => (path?.match(/[ML]/g) || []).length;
    const initialPoints = getPointCount(initialPath);
    const zoomedPoints = getPointCount(zoomedPath);
    expect(zoomedPoints).toBeGreaterThan(initialPoints);
  });

  test('should handle rapid oscillations', async ({ page }) => {
    // Add rapidly oscillating function
    await page.click('button:has-text("Add Function")');
    await page.waitForSelector('input[placeholder="Enter function"]', { timeout: 5000 });
    await page.fill('input[placeholder="Enter function"]', 'Math.sin(10 * x)');
    await page.click('button:has-text("Add")');

    // Wait for the graph to render
    await page.waitForSelector('path.formula-graph', { timeout: 10000 });

    // Get path data
    const pathData = await page.locator('path.formula-graph').first().getAttribute('d');
    expect(pathData).toBeTruthy();

    // Verify very high point density for accurate oscillation rendering
    const pointCount = (pathData?.match(/[ML]/g) || []).length;
    expect(pointCount).toBeGreaterThan(500); // Should have many points for rapid oscillations
  });

  test('should render the complex nested Math.pow formula with high detail', async ({ page }) => {
    // Add the complex formula with Math.pow, sqrt, and abs
    await page.click('button:has-text("Add Function")');
    await page.waitForSelector('input[placeholder="Enter function"]', { timeout: 5000 });
    await page.fill(
      'input[placeholder="Enter function"]', 
      'Math.pow(x * 2, 2) + Math.pow((5 * Math.pow(x * 4, 2) - Math.sqrt(Math.abs(x))) * 2, 2) - 1'
    );
    await page.click('button:has-text("Add")');

    // Wait for the graph to render with longer timeout due to complexity
    await page.waitForSelector('path.formula-graph', { timeout: 15000 });

    // Get path data
    const pathData = await page.locator('path.formula-graph').first().getAttribute('d');
    expect(pathData).toBeTruthy();

    // Verify extremely high point density for this complex formula
    const pointCount = (pathData?.match(/[ML]/g) || []).length;
    console.log(`Complex formula point count: ${pointCount}`);
    expect(pointCount).toBeGreaterThan(2000); // Should have very many points for accurate rendering
    
    // Verify multiple path segments due to the discontinuity at x=0
    const moveCommands = pathData?.match(/M/g)?.length || 0;
    expect(moveCommands).toBeGreaterThan(1); // Should have multiple segments due to the sqrt(abs(x)) term
  });
}); 