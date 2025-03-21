import { test, expect } from '@playwright/test';

// Test the point tool with grid zoom
test('point coordinates should respect grid zoom factor', async ({ page }) => {
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
  await page.waitForTimeout(1000);
  
  // Switch to the select tool
  try {
    await page.locator('#select-tool').click();
  } catch (e) {
    console.log('Could not click select tool button, trying keyboard shortcut');
    await page.keyboard.press('s');  // Assuming 's' is the shortcut for select tool
  }
  await page.waitForTimeout(500);
  
  // Known coordinates for quadratic function at 100% zoom
  const defaultZoomPoint = { x: 640, y: 461 };
  
  // Click at the known point for default zoom
  console.log(`Clicking at default zoom point (${defaultZoomPoint.x}, ${defaultZoomPoint.y})`);
  await page.mouse.click(defaultZoomPoint.x, defaultZoomPoint.y);
  await page.waitForTimeout(500);
  
  // Take a screenshot after clicking
  await page.screenshot({ path: 'test-results/point-tool-zoom-after-click.png' });
  
  // Get coordinates at default zoom
  const defaultXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const defaultYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  
  console.log(`Coordinates at default zoom: X=${defaultXCoord}, Y=${defaultYCoord}`);
  
  // Now zoom in to 150%
  console.log('Zooming to 150%');
  for (let i = 0; i < 10; i++) {
    await page.getByTestId('grid-zoom-in').click();
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(500);
  
  // Get the current zoom level
  const zoomLevel = await page.getByTestId('grid-zoom-reset').textContent();
  console.log(`Current zoom level: ${zoomLevel}`);
  
  // Take screenshot after zooming
  await page.screenshot({ path: 'test-results/point-tool-zoom-after-zoom.png' });
  
  // Known coordinates for quadratic function at 150% zoom
  const zoomedPoint = { x: 729, y: 372 };
  
  // Click at the known point for 150% zoom
  console.log(`Clicking at 150% zoom point (${zoomedPoint.x}, ${zoomedPoint.y})`);
  await page.mouse.click(zoomedPoint.x, zoomedPoint.y);
  await page.waitForTimeout(500);
  
  // Take screenshot after clicking at zoomed level
  await page.screenshot({ path: 'test-results/point-tool-zoom-zoomed-click.png' });
  
  // Get coordinates at zoomed level
  const zoomedXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const zoomedYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  
  console.log(`Coordinates at zoomed level (${zoomLevel}): X=${zoomedXCoord}, Y=${zoomedYCoord}`);
  
  // The bug is that the coordinates are different between zoom levels
  // We'll verify that they are in fact different (which demonstrates the bug)
  // In a fixed implementation, they should be the same
  const defaultXNum = parseFloat(defaultXCoord || '0');
  const defaultYNum = parseFloat(defaultYCoord || '0');
  const zoomedXNum = parseFloat(zoomedXCoord || '0');
  const zoomedYNum = parseFloat(zoomedYCoord || '0');
  
  // Calculate the difference
  const xDifference = Math.abs(defaultXNum - zoomedXNum);
  const yDifference = Math.abs(defaultYNum - zoomedYNum);
  
  console.log(`Coordinate differences - X: ${xDifference}, Y: ${yDifference}`);
  
  // The test should fail when the bug exists (coordinates change between zoom levels)
  // After the bug is fixed, the test will pass
  expect(xDifference).toBeLessThan(0.05); // Expecting coordinates to be the same regardless of zoom
  expect(yDifference).toBeLessThan(0.05);
  // If we were checking for the bug, we would use:
  // expect(xDifference).toBeGreaterThan(0.04);
});

// Test navigation behavior with grid zoom
test('navigation arrows should maintain coordinates at different zoom levels', async ({ page }) => {
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
  await page.waitForTimeout(1000);
  
  // Switch to the select tool
  try {
    await page.locator('#select-tool').click();
  } catch (e) {
    console.log('Could not click select tool button, trying keyboard shortcut');
    await page.keyboard.press('s');  // Assuming 's' is the shortcut for select tool
  }
  await page.waitForTimeout(500);
  
  // Use the known coordinates for clicking at default zoom
  const defaultZoomPoint = { x: 640, y: 461 };
  console.log(`Clicking at default zoom point (${defaultZoomPoint.x}, ${defaultZoomPoint.y})`);
  await page.mouse.click(defaultZoomPoint.x, defaultZoomPoint.y);
  await page.waitForTimeout(500);
  
  // Get the initial coordinates
  const initialXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const initialYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  console.log(`Initial coordinates: X=${initialXCoord}, Y=${initialYCoord}`);
  
  // Navigate using right arrow several times to reach x≈1.5
  for (let i = 0; i < 5; i++) {
    // Click the right arrow navigation button
    await page.locator('text="→"').click();
    await page.waitForTimeout(200);
  }
  
  // Get the point coordinates after navigation at default zoom
  const defaultXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const defaultYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  console.log(`Coordinates after navigation at default zoom: X=${defaultXCoord}, Y=${defaultYCoord}`);
  
  // Get the calculation text displayed in the info panel
  const defaultCalculation = await page.evaluate(() => {
    const calcText = document.querySelector('.unified-info-panel-container .calculation')?.textContent;
    return calcText ? calcText : null;
  });
  console.log(`Calculation at default zoom: ${defaultCalculation}`);
  
  await page.screenshot({ path: 'test-results/navigation-after-arrows.png' });
  
  // Now zoom to 150%
  console.log('Zooming to 150%');
  for (let i = 0; i < 10; i++) {
    await page.getByTestId('grid-zoom-in').click();
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(500);
  
  // Get the current zoom level
  const zoomLevel = await page.getByTestId('grid-zoom-reset').textContent();
  console.log(`Current zoom level: ${zoomLevel}`);
  
  // Take screenshot after zooming
  await page.screenshot({ path: 'test-results/navigation-after-zoom.png' });
  
  // Click at the known coordinates for 150% zoom
  const zoomedPoint = { x: 729, y: 372 };
  console.log(`Clicking at 150% zoom point (${zoomedPoint.x}, ${zoomedPoint.y})`);
  await page.mouse.click(zoomedPoint.x, zoomedPoint.y);
  await page.waitForTimeout(500);
  
  // Get the coordinates after clicking at zoomed level
  const zoomedXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const zoomedYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  console.log(`Coordinates after click at zoomed level: X=${zoomedXCoord}, Y=${zoomedYCoord}`);
  
  // Get the calculation displayed at zoomed level
  const zoomedCalculation = await page.evaluate(() => {
    const calcText = document.querySelector('.unified-info-panel-container .calculation')?.textContent;
    return calcText ? calcText : null;
  });
  console.log(`Calculation at zoomed level: ${zoomedCalculation}`);
  
  // Navigate one more time using right arrow
  await page.locator('text="→"').click();
  await page.waitForTimeout(500);
  
  // Get coordinates after navigation at zoomed level
  const zoomedNavXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const zoomedNavYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  console.log(`Coordinates after navigation at zoomed level: X=${zoomedNavXCoord}, Y=${zoomedNavYCoord}`);
  
  // Calculate the expected next x-coordinate (should be previous + 0.1)
  const expectedNextX = parseFloat(zoomedXCoord || '0') + 0.1;
  const actualNextX = parseFloat(zoomedNavXCoord || '0');
  
  // Calculate the difference
  const xDifference = Math.abs(expectedNextX - actualNextX);
  console.log(`Expected next X: ${expectedNextX.toFixed(4)}, Actual: ${actualNextX.toFixed(4)}, Difference: ${xDifference.toFixed(4)}`);
  
  // The test should fail when the bug exists (step size inconsistent between zoom levels)
  // After the bug is fixed, the test will pass
  expect(xDifference).toBeLessThan(0.01); // Step size should be consistent regardless of zoom
  
  // Also verify the overall coordinates changed from default zoom to zoomed level
  const defaultX = parseFloat(defaultXCoord || '0');
  const zoomedX = parseFloat(zoomedXCoord || '0');
  const totalXDifference = Math.abs(defaultX - zoomedX);
  console.log(`Total X coordinate difference between zoom levels: ${totalXDifference.toFixed(4)}`);
  
  // The test should fail when the bug exists (coordinates different between zoom levels)
  // After the bug is fixed, the test will pass
  expect(totalXDifference).toBeLessThan(0.1); // Coordinates should be the same regardless of zoom
  
  // Take a final screenshot
  await page.screenshot({ path: 'test-results/navigation-final-state.png' });
}); 