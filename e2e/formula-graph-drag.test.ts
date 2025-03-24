import { expect } from '@playwright/test';
import { test } from './test-helper';

test.describe('Formula Graph Drag Behavior', () => {
  test('formula plotting and grid drag handling', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Click the function plotting tool first
    await page.getByTestId('plot-formula-button').click();
    
    // Wait for the formula editor to appear
    await page.waitForSelector('[data-testid="formula-editor"]', { state: 'visible' });
    
    // Add a logarithmic function
    await page.getByTestId('add-formula-button').click();
    await page.getByTestId('formula-expression-input').fill('Math.log(Math.abs(x))');
    await page.getByTestId('add-formula-button').click();
    
    // Wait for the graph to render
    await page.waitForSelector('path.formula-graph');
    
    // Small delay to ensure the graph is fully rendered
    await page.waitForTimeout(100);
    
    // Get initial path data
    const initialPath = await page.evaluate(() => {
      const path = document.querySelector('path.formula-graph');
      return path?.getAttribute('d') || null;
    });
    
    // Prepare for drag
    const canvas = await page.locator('.canvas-container');
    const bounds = await canvas.boundingBox();
    if (!bounds) throw new Error('Canvas not found');
    
    const startX = bounds.x + bounds.width / 2;
    const startY = bounds.y + bounds.height / 2;
    
    // Start drag with Alt key
    await page.keyboard.down('Alt');
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // Perform a significant drag
    await page.mouse.move(startX + 200, startY + 200, { steps: 10 });
    
    // Get the path data during drag
    const dragPath = await page.evaluate(() => {
      const path = document.querySelector('path.formula-graph');
      return path?.getAttribute('d') || null;
    });
    
    // Complete the drag
    await page.mouse.up();
    await page.keyboard.up('Alt');
    
    // Wait for re-rendering
    await page.waitForTimeout(150);
    
    // Get final path data
    const finalPath = await page.evaluate(() => {
      const path = document.querySelector('path.formula-graph');
      return path?.getAttribute('d') || null;
    });
    
    // Verify path has changed during drag
    expect(dragPath).not.toBe(initialPath);
    
    // Verify the final path is different from the initial path
    // This confirms the drag actually moved the viewpoint
    expect(finalPath).not.toBe(initialPath);
  });
});
