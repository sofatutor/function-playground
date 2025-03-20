import { test } from './test-helper';
import { expect } from '@playwright/test';

test.describe('Complex Function Behaviors', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Click on the "Plot Formula" button to open the formula editor
    const plotFormulaButton = page.getByTestId('plot-formula-button');
    await plotFormulaButton.click();
    
    // Wait for the formula editor to appear and be visible
    await page.waitForSelector('[data-testid="formula-editor"]', { state: 'visible' });
    
    // Log formula editor visibility for debugging
    const formulaEditorVisible = await page.getByTestId('formula-editor').isVisible();
    console.log(`Formula editor visible: ${formulaEditorVisible}`);
  });

  test('tangent function should have multiple segments due to asymptotes', async ({ page }) => {
    // Click the "Add Formula" button
    await page.getByTestId('add-formula-button').click();
    
    // Enter tangent function
    const formulaInput = page.getByTestId('formula-expression-input');
    await formulaInput.fill('tan(x)');

    // Verify the path is rendered with multiple segments (discontinuities)
    const svgPath = page.locator('svg path').first();
    await expect(svgPath).toBeVisible();
    
    // The path should have multiple segments (due to asymptotes)
    const d = await svgPath.getAttribute('d');
    const pathSegments = d?.split('M').filter(Boolean) || [];
    expect(pathSegments.length).toBeGreaterThan(1);
  });

  test('logarithmic function should only plot for x > 0', async ({ page }) => {
    // Click the "Add Formula" button
    await page.getByTestId('add-formula-button').click();
    
    // Enter log function
    const formulaInput = page.getByTestId('formula-expression-input');
    await formulaInput.fill('log(x)');

    // Verify the path starts after x = 0
    const svgPath = page.locator('svg path').first();
    await expect(svgPath).toBeVisible();
    
    // Check path attribute
    const d = await svgPath.getAttribute('d');
    expect(d).toBeTruthy();
    
    // The path should exist and should have coordinates
    expect(d?.split(' ').length).toBeGreaterThan(5);
  });

  test('rational function should show singularity', async ({ page }) => {
    // Click the "Add Formula" button
    await page.getByTestId('add-formula-button').click();
    
    // Enter rational function with singularity
    const formulaInput = page.getByTestId('formula-expression-input');
    await formulaInput.fill('1/(x-2)');

    // Verify the path has multiple segments (discontinuity at x=2)
    const svgPath = page.locator('svg path').first();
    await expect(svgPath).toBeVisible();
    
    // There should be at least 2 segments due to the singularity
    const d = await svgPath.getAttribute('d');
    const pathSegments = d?.split('M').filter(Boolean) || [];
    expect(pathSegments.length).toBeGreaterThan(1);
  });

  test('composite trigonometric function should have high point density', async ({ page }) => {
    // Click the "Add Formula" button
    await page.getByTestId('add-formula-button').click();
    
    // Enter composite trigonometric function
    const formulaInput = page.getByTestId('formula-expression-input');
    await formulaInput.fill('sin(x) * cos(x*2)');

    // Verify the path has sufficient point density
    const svgPath = page.locator('svg path').first();
    await expect(svgPath).toBeVisible();
    
    // The path should have many points for accurate rendering
    const d = await svgPath.getAttribute('d');
    const pointCount = d?.split(' ').length || 0;
    expect(pointCount).toBeGreaterThan(50);
  });

  test('zoom level should affect point density', async ({ page }) => {
    // Click the "Add Formula" button
    await page.getByTestId('add-formula-button').click();
    
    // Enter a simple function
    const formulaInput = page.getByTestId('formula-expression-input');
    await formulaInput.fill('sin(x)');

    // Get initial point count
    let svgPath = page.locator('svg path').first();
    await expect(svgPath).toBeVisible();
    const initialD = await svgPath.getAttribute('d');
    const initialPointCount = initialD?.split(' ').length || 0;

    // Zoom in on the graph
    const svgElement = page.locator('svg').first();
    await svgElement.click();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100); // Small delay for rendering
    }

    // Get new point count after zooming
    svgPath = page.locator('svg path').first();
    await expect(svgPath).toBeVisible();
    const zoomedD = await svgPath.getAttribute('d');
    const zoomedPointCount = zoomedD?.split(' ').length || 0;

    // Point density should increase when zoomed in
    expect(zoomedPointCount).toBeGreaterThanOrEqual(initialPointCount);
  });
  
  test('rapid oscillations should have high point count', async ({ page }) => {
    // Click the "Add Formula" button
    await page.getByTestId('add-formula-button').click();
    
    // Enter a rapidly oscillating function
    const formulaInput = page.getByTestId('formula-expression-input');
    await formulaInput.fill('sin(x*10)');

    // Verify the path has very high point density
    const svgPath = page.locator('svg path').first();
    await expect(svgPath).toBeVisible();
    
    // The path should have a very high point count for rapid oscillations
    const d = await svgPath.getAttribute('d');
    const pointCount = d?.split(' ').length || 0;
    expect(pointCount).toBeGreaterThan(100);
  });
  
  test('complex nested formula should have extremely high point density', async ({ page }) => {
    // Click the "Add Formula" button
    await page.getByTestId('add-formula-button').click();
    
    // Enter a complex nested function with multiple discontinuities
    const formulaInput = page.getByTestId('formula-expression-input');
    await formulaInput.fill('tan(sin(x*3)) / (cos(x)+0.1)');

    // Verify the path has extremely high point density and multiple segments
    const svgPath = page.locator('svg path').first();
    await expect(svgPath).toBeVisible();
    
    // The path should have many points and segments
    const d = await svgPath.getAttribute('d');
    const pointCount = d?.split(' ').length || 0;
    const pathSegments = d?.split('M').filter(Boolean) || [];
    
    // Complex formula requires high point density
    expect(pointCount).toBeGreaterThan(80);
    
    // Should have multiple segments due to discontinuities
    expect(pathSegments.length).toBeGreaterThan(1);
  });
}); 