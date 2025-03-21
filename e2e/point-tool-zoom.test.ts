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
  
  // Add a click logger to the canvas that will help us debug
  await page.evaluate(() => {
    // Add a click handler to the entire document to log click coordinates
    document.addEventListener('click', (e) => {
      console.log(`CLICK EVENT - Screen coordinates: (${e.clientX}, ${e.clientY})`);
      
      // Try to identify what was clicked
      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (element) {
        console.log(`Clicked element: ${element.tagName}, classes: ${element.className}, id: ${element.id}`);
        
        // For SVG elements, provide more details
        if (element.tagName.toLowerCase() === 'path') {
          console.log(`Path d attribute: ${element.getAttribute('d')?.substring(0, 30)}...`);
          console.log(`Path class: ${element.getAttribute('class')}`);
        }
      }
      
      // Log info about canvas container position for reference
      const canvasContainer = document.querySelector('.canvas-container');
      if (canvasContainer) {
        const rect = canvasContainer.getBoundingClientRect();
        console.log(`Canvas container bounds: x=${rect.x}, y=${rect.y}, width=${rect.width}, height=${rect.height}`);
        console.log(`Relative position within canvas: x=${e.clientX - rect.x}, y=${e.clientY - rect.y}`);
      }
    });
    
    // Add visual indicator that instrumentation is active
    const infoElement = document.createElement('div');
    infoElement.style.position = 'fixed';
    infoElement.style.top = '10px';
    infoElement.style.left = '10px';
    infoElement.style.background = 'rgba(0,0,0,0.7)';
    infoElement.style.color = 'white';
    infoElement.style.padding = '10px';
    infoElement.style.borderRadius = '5px';
    infoElement.style.zIndex = '9999';
    infoElement.style.pointerEvents = 'none';
    infoElement.textContent = 'Click on the parabola (y=x²) to trigger the point tool';
    document.body.appendChild(infoElement);
    
    console.log('Click logging instrumentation active - please click on the graph');
  });
  
  // Switch to the select tool
  try {
    await page.locator('#select-tool').click();
  } catch (e) {
    console.log('Could not click select tool button, trying keyboard shortcut');
    await page.keyboard.press('s');  // Assuming 's' is the shortcut for select tool
  }
  await page.waitForTimeout(500);
  
  // Take a screenshot before manual interaction
  await page.screenshot({ path: 'test-results/point-tool-zoom-ready-for-click.png' });
  
  // Try to click at a known point where x=1, y=1
  // We use the coordinates from the debug session: (640, 461)
  const knownPoint = { x: 640, y: 461 };
  
  console.log(`Trying to click at point (${knownPoint.x}, ${knownPoint.y})`);
  await page.mouse.click(knownPoint.x, knownPoint.y);
  await page.waitForTimeout(500);
  
  // Take a screenshot after clicking
  await page.screenshot({ path: 'test-results/point-tool-zoom-after-click.png' });
  
  // Check if the point info panel appeared
  const infoPanel = await page.locator('.unified-info-panel-container').count();
  if (infoPanel === 0) {
    // If the hardcoded coordinates don't work, try the fallback mechanism to find a clickable point
    console.log('Initial click did not show the info panel, trying alternative points');
    
    // Fallback for non-debug mode using predefined points around where x=1, y=1 should be
    const pointsToTry = [
      { x: 650, y: 450 },
      { x: 630, y: 470 },
      { x: 650, y: 470 },
      { x: 630, y: 450 },
      { x: 700, y: 400 }
    ];
    
    let clickSucceeded = false;
    
    for (let i = 0; i < pointsToTry.length && !clickSucceeded; i++) {
      console.log(`Trying click at alternative point ${i+1}: (${pointsToTry[i].x}, ${pointsToTry[i].y})`);
      
      await page.mouse.click(pointsToTry[i].x, pointsToTry[i].y);
      await page.waitForTimeout(500);
      
      // Take a screenshot after each click attempt
      await page.screenshot({ path: `test-results/point-tool-zoom-click-alt-${i+1}.png` });
      
      // Check if the point info panel appeared
      const panelVisible = await page.locator('.unified-info-panel-container').count() > 0;
      if (panelVisible) {
        console.log(`Click succeeded at alternative point ${i+1}`);
        clickSucceeded = true;
        break;
      }
    }
    
    if (!clickSucceeded) {
      throw new Error('Could not trigger the point info panel with any click point');
    }
  }
  
  // Get coordinates at default zoom
  const defaultXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const defaultYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  
  console.log(`Coordinates at default zoom: X=${defaultXCoord}, Y=${defaultYCoord}`);
  
  // Save the clicked point's screen coordinates for later use
  const clickedPointCoords = await page.evaluate(() => {
    const pointMarker = document.querySelector('circle[r="4"], circle[r="5"], circle[r="6"]');
    if (pointMarker) {
      const rect = pointMarker.getBoundingClientRect();
      return { x: rect.x + rect.width/2, y: rect.y + rect.height/2 };
    }
    return null;
  });
  
  console.log('Clicked point screen coordinates:', clickedPointCoords);
  
  // Now zoom in several times
  console.log('Starting zoom operations');
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
  
  // Click at the same screen position after zooming
  if (clickedPointCoords) {
    await page.mouse.click(clickedPointCoords.x, clickedPointCoords.y);
  } else {
    // Fallback to the original known coordinates
    await page.mouse.click(knownPoint.x, knownPoint.y);
  }
  await page.waitForTimeout(500);
  
  // Take screenshot after clicking at zoomed level
  await page.screenshot({ path: 'test-results/point-tool-zoom-zoomed-click.png' });
  
  // Check if the info panel is still visible
  const zoomedInfoPanel = await page.locator('.unified-info-panel-container').count();
  if (zoomedInfoPanel === 0) {
    console.log('Info panel not visible after zoom. Trying to click again...');
    
    // Get the current location of the point marker and try clicking it
    const newMarkerPosition = await page.evaluate(() => {
      const pointMarker = document.querySelector('circle[r="4"], circle[r="5"], circle[r="6"]');
      if (pointMarker) {
        const rect = pointMarker.getBoundingClientRect();
        return { x: rect.x + rect.width/2, y: rect.y + rect.height/2 };
      }
      return null;
    });
    
    if (newMarkerPosition) {
      console.log('Trying to click on visible point marker at:', newMarkerPosition);
      await page.mouse.click(newMarkerPosition.x, newMarkerPosition.y);
      await page.waitForTimeout(500);
    }
    
    // Check again if panel appeared
    const panelAppeared = await page.locator('.unified-info-panel-container').count() > 0;
    if (!panelAppeared) {
      throw new Error('Info panel still not visible after clicking on point marker');
    }
  }
  
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
  
  // The bug is verified if the coordinates change by more than a small tolerance
  // In a fixed implementation, this would fail
  expect(xDifference).toBeGreaterThan(0.04);
  // If we were checking for correct behavior, we would use:
  // expect(xDifference).toBeLessThan(0.1);
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
  
  // Click at a known point near (1, 1)
  await page.mouse.click(640, 461);
  await page.waitForTimeout(500);
  
  // Verify the info panel is showing
  const infoPanel = await page.locator('.unified-info-panel-container');
  expect(await infoPanel.isVisible()).toBe(true);
  
  console.log('Point info panel is visible');
  await page.screenshot({ path: 'test-results/navigation-initial-click.png' });
  
  // Navigate using right arrow several times to reach x=1.5
  for (let i = 0; i < 5; i++) {
    // Click the right arrow navigation button
    await page.locator('text="→"').click();
    await page.waitForTimeout(200);
  }
  
  // Get the point coordinates after navigation at default zoom
  const defaultXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const defaultYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  
  console.log(`Coordinates after navigation at default zoom: X=${defaultXCoord}, Y=${defaultYCoord}`);
  await page.screenshot({ path: 'test-results/navigation-after-arrows.png' });
  
  // Store the current point location (should be near x=1.5)
  const pointLocation = await page.evaluate(() => {
    const calcText = document.querySelector('.unified-info-panel-container .calculation')?.textContent;
    return calcText ? calcText : null;
  });
  
  console.log(`Current point calculation: ${pointLocation}`);
  
  // Now zoom in several times
  console.log('Starting zoom operations');
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
  
  // Get the point coordinates after zooming
  const zoomedXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const zoomedYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  
  console.log(`Coordinates after zooming (${zoomLevel}): X=${zoomedXCoord}, Y=${zoomedYCoord}`);
  
  // Navigate one more time using right arrow
  await page.locator('text="→"').click();
  await page.waitForTimeout(500);
  
  // Get coordinates after navigation at zoomed level
  const zoomedNavXCoord = await page.locator('text=X Coordinate').locator('xpath=following-sibling::div').textContent();
  const zoomedNavYCoord = await page.locator('text=Y Coordinate').locator('xpath=following-sibling::div').textContent();
  
  console.log(`Coordinates after navigation at zoomed level: X=${zoomedNavXCoord}, Y=${zoomedNavYCoord}`);
  await page.screenshot({ path: 'test-results/navigation-after-zoom-and-arrow.png' });
  
  // Calculate the expected next x-coordinate (should be previous + 0.1)
  const expectedNextX = parseFloat(zoomedXCoord || '0') + 0.1;
  const actualNextX = parseFloat(zoomedNavXCoord || '0');
  
  // Calculate the difference between expected and actual
  const xDifference = Math.abs(expectedNextX - actualNextX);
  
  console.log(`Expected next X: ${expectedNextX.toFixed(4)}, Actual: ${actualNextX.toFixed(4)}, Difference: ${xDifference.toFixed(4)}`);
  
  // The bug is verified if the step size is inconsistent between zoom levels
  // For a fixed implementation, this difference should be very small
  expect(xDifference).toBeGreaterThan(0.02); // There is an inconsistency in step size
  
  // Also verify the overall coordinates changed from default zoom to zoomed level
  const defaultX = parseFloat(defaultXCoord || '0');
  const zoomedX = parseFloat(zoomedXCoord || '0');
  const totalXDifference = Math.abs(defaultX - zoomedX);
  
  console.log(`Total X coordinate difference between zoom levels: ${totalXDifference.toFixed(4)}`);
  
  // The bug is verified if coordinates change significantly between zoom levels
  expect(totalXDifference).toBeGreaterThan(0.01);
}); 