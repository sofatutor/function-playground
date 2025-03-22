import { expect } from '@playwright/test';
import { test } from './test-helper';
import type { Locator, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Helper function to take screenshots with consistent naming
async function takeScreenshot(page: Page, name: string): Promise<void> {
  const testInfo = test.info();
  const testName = testInfo.title.replace(/\s+/g, '-').toLowerCase();
  const testFile = path.basename(testInfo.file).replace('.spec.ts', '');
  
  // Create directory if it doesn't exist
  const screenshotDir = path.join('e2e/screenshots', testFile);
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const screenshotPath = path.join(screenshotDir, `${testName}-${name}.png`);
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

// Helper function to test updating an angle
async function testAngleUpdate(page: Page, angleNumber: number): Promise<void> {
  console.log(`\n--- Testing update of angle${angleNumber} ---`);
  
  // Get the initial measurements
  const initialMeasurements = await getMeasurements(page);
  console.log('Initial measurements:', initialMeasurements);
  
  // Verify that we have angle measurements
  if (!initialMeasurements[`angle${angleNumber}`]) {
    throw new Error(`Angle${angleNumber} measurement not found in the panel`);
  }
  
  // Parse the initial angles
  const initialAngles = [
    parseFloat(initialMeasurements.angle1 || '0'),
    parseFloat(initialMeasurements.angle2 || '0'),
    parseFloat(initialMeasurements.angle3 || '0')
  ];
  
  console.log(`Initial angles: ${initialAngles[0]}°, ${initialAngles[1]}°, ${initialAngles[2]}°`);
  
  // Find and click on the angle measurement
  const angleElement = page.locator(`#measurement-angle${angleNumber}`);
  const angleElementCount = await angleElement.count();
  console.log(`Found ${angleElementCount} elements with id="measurement-angle${angleNumber}"`);
  
  if (angleElementCount === 0) {
    throw new Error(`Angle${angleNumber} measurement element not found`);
  }
  
  // Try to dismiss any notifications that might be in the way
  try {
    const toast = page.locator('[data-sonner-toast]');
    if (await toast.count() > 0) {
      console.log('Found notification toast, attempting to dismiss it');
      await toast.click({ force: true });
    }
  } catch (error) {
    console.log('No toast found or unable to dismiss it');
  }
  
  // Click on the angle measurement to edit it
  try {
    await angleElement.click({ timeout: 5000 });
    console.log(`Clicked on angle${angleNumber} measurement`);
  } catch (error) {
    console.log(`Failed to click on angle${angleNumber} measurement, trying with force: true`);
    await angleElement.click({ force: true });
    console.log(`Clicked on angle${angleNumber} measurement with force: true`);
  }
  
  // Look for the input field
  const inputField = page.locator('input[type="number"]');
  const inputFieldCount = await inputField.count();
  console.log(`Found ${inputFieldCount} input fields for angle`);
  
  if (inputFieldCount === 0) {
    throw new Error('No input field appeared after clicking the angle measurement');
  }
  
  // Get the current angle value
  const currentValue = await inputField.inputValue();
  console.log(`Current angle value: "${currentValue}"`);
  
  // Calculate a new angle value (add 15 degrees, but ensure it's not too close to 0 or 180)
  const currentAngle = parseFloat(currentValue || '0');
  let newAngleValue = currentAngle + 15;
  
  // Ensure the new angle is within valid range (1-179)
  if (newAngleValue >= 179) newAngleValue = 150;
  if (newAngleValue <= 1) newAngleValue = 30;
  
  console.log(`New angle value to enter: ${newAngleValue}`);
  
  // Enter the new value
  await inputField.fill(newAngleValue.toString());
  console.log(`Filled angle input with new value: ${newAngleValue}`);
  
  // Take a screenshot while editing
  await takeScreenshot(page, `editing-angle${angleNumber}`);
  
  // Press Enter to save
  await inputField.press('Enter');
  console.log('Pressed Enter to save angle');
  
  // Get the updated measurements
  const updatedMeasurements = await getMeasurements(page);
  console.log('Updated measurements:', updatedMeasurements);
  
  // Parse the updated angles
  const updatedAngles = [
    parseFloat(updatedMeasurements.angle1 || '0'),
    parseFloat(updatedMeasurements.angle2 || '0'),
    parseFloat(updatedMeasurements.angle3 || '0')
  ];
  
  console.log(`Updated angles: ${updatedAngles[0]}°, ${updatedAngles[1]}°, ${updatedAngles[2]}°`);
  
  // Check if our entered value appears in one of the angles
  console.log(`Value we entered for angle${angleNumber}: ${newAngleValue}`);
  
  // Check which angle is closest to the value we entered
  const angleDiffs = updatedAngles.map(angle => Math.abs(angle - newAngleValue));
  const closestAngleIndex = angleDiffs.indexOf(Math.min(...angleDiffs));
  
  console.log(`The value we entered (${newAngleValue}) is closest to angle${closestAngleIndex + 1} (${updatedAngles[closestAngleIndex]})`);
  
  // FAIL TEST: The entered value should be applied to the angle we're editing
  console.log(`Expecting angle${angleNumber} (${updatedAngles[angleNumber-1]}) to be close to our entered value (${newAngleValue})`);
  expect(updatedAngles[angleNumber-1]).toBeCloseTo(newAngleValue, 0);
  console.log(`✅ angle${angleNumber} was correctly updated with our entered value`);
  
  // Verify that the sum of angles is still 180 degrees
  const updatedSum = updatedAngles.reduce((sum, angle) => sum + angle, 0);
  console.log(`Updated sum of angles: ${updatedSum}°`);
  expect(updatedSum).toBeCloseTo(180, 1);
  console.log('Sum of angles is still approximately 180 degrees');
  
  // Verify that the triangle shape has been updated by checking side measurements
  console.log('Verifying that the triangle shape has been updated');
  const initialSides = [
    parseFloat(initialMeasurements.side1 || '0'),
    parseFloat(initialMeasurements.side2 || '0'),
    parseFloat(initialMeasurements.side3 || '0')
  ];
  
  const updatedSides = [
    parseFloat(updatedMeasurements.side1 || '0'),
    parseFloat(updatedMeasurements.side2 || '0'),
    parseFloat(updatedMeasurements.side3 || '0')
  ];
  
  console.log(`Initial sides: ${initialSides.join(', ')}`);
  console.log(`Updated sides: ${updatedSides.join(', ')}`);
  
  // At least one side should have changed
  const sidesChanged = initialSides.some((side, index) => 
    !isCloseTo(side, updatedSides[index], 0.1)
  );
  
  expect(sidesChanged).toBe(true);
  console.log('Triangle sides have changed, confirming shape update');
}

test.describe('Triangle Angle Updates', () => {
  test('should update triangle angles correctly', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:8080/');
    
    // Wait for the application to load
    await page.waitForSelector('#geometry-canvas', { state: 'visible', timeout: 30000 });
    console.log('Canvas found');
    
    // Take a screenshot to debug the initial state
    await takeScreenshot(page, 'initial-state');
    
    // Find the triangle tool using its ID or aria-label
    const triangleButton = page.locator('#triangle-tool, button[aria-label="Triangle"]');
    console.log('Looking for triangle button');
    
    // Check if the triangle button exists
    const triangleButtonCount = await triangleButton.count();
    console.log(`Triangle button count: ${triangleButtonCount}`);
    
    if (triangleButtonCount === 0) {
      throw new Error('Triangle button not found');
    }
    
    await triangleButton.click();
    console.log('Clicked triangle button');
    
    // Find the canvas area
    const canvas = page.locator('#geometry-canvas');
    
    // Create a triangle by dragging on the canvas
    const canvasRect = await canvas.boundingBox();
    if (!canvasRect) {
      throw new Error('Canvas area not found');
    }
    
    console.log(`Canvas dimensions: ${JSON.stringify(canvasRect)}`);
    
    // Create a triangle with distinct angles (not equilateral)
    const startX = canvasRect.x + canvasRect.width / 4;
    const startY = canvasRect.y + canvasRect.height / 4;
    const endX = startX + 300;  // Make a wider triangle to have more distinct angles
    const endY = startY + 150;
    
    console.log(`Drawing triangle from (${startX}, ${startY}) to (${endX}, ${endY})`);
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    
    // Check if any SVG paths were created (which would indicate a triangle was drawn)
    const pathCount = await page.locator('path').count();
    console.log(`Found ${pathCount} SVG paths`);
    
    if (pathCount === 0) {
      throw new Error('No triangle was created');
    }
    
    // Click on the triangle to ensure it's selected
    const trianglePath = page.locator('path').first();
    await trianglePath.click();
    console.log('Clicked on the triangle to select it');
    
    // Test updating angle1
    await testAngleUpdate(page, 1);
    
    // Success if we got this far
    console.log('Angle update test completed successfully');
  });
});

// Helper function to check if two numbers are close to each other
function isCloseTo(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance;
}

// Helper function to get all measurements from the panel
async function getMeasurements(page: Page): Promise<Record<string, string>> {
  const measurements: Record<string, string> = {};
  
  // Get all measurement elements
  const measurementElements = await page.locator('[id^="measurement-"]').all();
  
  for (const element of measurementElements) {
    const id = await element.getAttribute('id');
    if (id) {
      const key = id.replace('measurement-', '');
      const text = await element.textContent();
      
      // Extract the numeric value from the text (e.g., "60°" -> "60")
      const match = text?.match(/(\d+(?:\.\d+)?)/);
      if (match && match[1]) {
        measurements[key] = match[1];
      }
    }
  }
  
  return measurements;
} 