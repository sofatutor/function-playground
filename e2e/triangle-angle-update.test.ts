import { test } from './test-helper';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { Logger } from './utils/logger';

// Helper function to take screenshots only when needed for debugging
async function takeScreenshot(page: Page, name: string, onlyOnFailure = true): Promise<void> {
  if (onlyOnFailure && !process.env.DEBUG) {
    return; // Only take screenshots on failure or when DEBUG is set
  }
  
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
  Logger.debug(`Screenshot captured: ${screenshotPath}`);
}

// Helper function to test updating an angle
async function testAngleUpdate(page: Page, angleNumber: number): Promise<void> {
  Logger.debug(`\n--- Testing update of angle${angleNumber} ---`);
  
  // Get the initial measurements
  const initialMeasurements = await getMeasurements(page);
  Logger.debug('Initial measurements:', initialMeasurements);
  
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
  
  Logger.debug(`Initial angles: ${initialAngles[0]}°, ${initialAngles[1]}°, ${initialAngles[2]}°`);
  
  // Find and click on the angle measurement
  const angleElement = page.locator(`#measurement-angle${angleNumber}`);
  const angleElementCount = await angleElement.count();
  Logger.debug(`Found ${angleElementCount} elements with id="measurement-angle${angleNumber}"`);
  
  if (angleElementCount === 0) {
    throw new Error(`Angle${angleNumber} measurement element not found`);
  }
  
  // Try to dismiss any notifications that might be in the way
  try {
    const toast = page.locator('[data-sonner-toast]');
    if (await toast.count() > 0) {
      Logger.debug('Found notification toast, attempting to dismiss it');
      await toast.click({ force: true });
    }
  } catch (_error) {
    Logger.debug('No toast found or unable to dismiss it');
  }
  
  // Click on the angle measurement to edit it
  try {
    await angleElement.click({ timeout: 5000 });
    Logger.debug(`Clicked on angle${angleNumber} measurement`);
  } catch (_error) {
    Logger.warn(`Failed to click on angle${angleNumber} measurement, trying with force: true`);
    await angleElement.click({ force: true });
    Logger.debug(`Clicked on angle${angleNumber} measurement with force: true`);
  }
  
  // Look for the input field
  const inputField = page.locator('input[type="number"]');
  const inputFieldCount = await inputField.count();
  Logger.debug(`Found ${inputFieldCount} input fields for angle`);
  
  if (inputFieldCount === 0) {
    throw new Error('No input field appeared after clicking the angle measurement');
  }
  
  // Get the current angle value
  const currentValue = await inputField.inputValue();
  Logger.debug(`Current angle value: "${currentValue}"`);
  
  // Calculate a new angle value (add 15 degrees, but ensure it's not too close to 0 or 180)
  const currentAngle = parseFloat(currentValue || '0');
  let newAngleValue = currentAngle + 15;
  
  // Ensure the new angle is within valid range (1-179)
  if (newAngleValue >= 179) newAngleValue = 150;
  if (newAngleValue <= 1) newAngleValue = 30;
  
  Logger.debug(`New angle value to enter: ${newAngleValue}`);
  
  // Enter the new value
  await inputField.fill(newAngleValue.toString());
  Logger.debug(`Filled angle input with new value: ${newAngleValue}`);
  
  // Take a screenshot while editing only in debug mode
  if (process.env.DEBUG) {
    await takeScreenshot(page, `editing-angle${angleNumber}`, false);
  }
  
  // Press Enter to save
  await inputField.press('Enter');
  Logger.debug('Pressed Enter to save angle');
  
  // Get the updated measurements
  const updatedMeasurements = await getMeasurements(page);
  Logger.debug('Updated measurements:', updatedMeasurements);
  
  // Parse the updated angles
  const updatedAngles = [
    parseFloat(updatedMeasurements.angle1 || '0'),
    parseFloat(updatedMeasurements.angle2 || '0'),
    parseFloat(updatedMeasurements.angle3 || '0')
  ];
  
  Logger.debug(`Updated angles: ${updatedAngles[0]}°, ${updatedAngles[1]}°, ${updatedAngles[2]}°`);
  
  // Check if our entered value appears in one of the angles
  Logger.debug(`Value we entered for angle${angleNumber}: ${newAngleValue}`);
  
  // Check which angle is closest to the value we entered
  const angleDiffs = updatedAngles.map(angle => Math.abs(angle - newAngleValue));
  const closestAngleIndex = angleDiffs.indexOf(Math.min(...angleDiffs));
  
  Logger.debug(`The value we entered (${newAngleValue}) is closest to angle${closestAngleIndex + 1} (${updatedAngles[closestAngleIndex]})`);
  
  // FAIL TEST: The entered value should be applied to the angle we're editing
  Logger.debug(`Expecting angle${angleNumber} (${updatedAngles[angleNumber-1]}) to be close to our entered value (${newAngleValue})`);
  expect(updatedAngles[angleNumber-1]).toBeCloseTo(newAngleValue, 0);
  Logger.debug(`✅ angle${angleNumber} was correctly updated with our entered value`);
  
  // Verify that the sum of angles is still 180 degrees
  const updatedSum = updatedAngles.reduce((sum, angle) => sum + angle, 0);
  Logger.debug(`Updated sum of angles: ${updatedSum}°`);
  expect(updatedSum).toBeCloseTo(180, 1);
  Logger.debug('Sum of angles is still approximately 180 degrees');
  
  // Verify that the triangle shape has been updated by checking side measurements
  Logger.debug('Verifying that the triangle shape has been updated');
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
  
  Logger.debug(`Initial sides: ${initialSides.join(', ')}`);
  Logger.debug(`Updated sides: ${updatedSides.join(', ')}`);
  
  // At least one side should have changed
  const sidesChanged = initialSides.some((side, index) => 
    !isCloseTo(side, updatedSides[index], 0.1)
  );
  
  expect(sidesChanged).toBe(true);
  Logger.debug('Triangle sides have changed, confirming shape update');
}

test.describe('Triangle Angle Updates', () => {
  test('should update triangle angles correctly', async ({ page }) => {
    try {
      await page.goto('/');
      
      // Wait for the application to load
      await page.waitForSelector('#geometry-canvas', { state: 'visible', timeout: 30000 });
      Logger.debug('Canvas found');
      
      // Take a screenshot to debug the initial state only in debug mode
      if (process.env.DEBUG) {
        await takeScreenshot(page, 'initial-state', false);
      }
      
      // Find the triangle tool with robust selector that checks multiple attributes
      const triangleButton = page.locator('#triangle-tool, button[aria-label="Triangle"]').first();
      Logger.debug('Looking for triangle button');
      
      // Check if the button is visible
      const isVisible = await triangleButton.isVisible();
      Logger.debug(`Triangle button visible: ${isVisible}`);
      
      if (!isVisible) {
        // Last resort logging of all buttons to help debug
        const buttons = await page.locator('button').all();
        for (const button of buttons) {
          const text = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          Logger.debug(`Button found: text="${text}", aria-label="${ariaLabel}"`);
        }
        throw new Error('Triangle button not found');
      }
      
      // Click the button
      await triangleButton.click();
      Logger.debug('Clicked triangle button');
      
      // Find the canvas area
      const canvas = page.locator('#geometry-canvas');
      
      // Create a triangle by dragging on the canvas
      const canvasRect = await canvas.boundingBox();
      if (!canvasRect) {
        throw new Error('Canvas area not found');
      }
      
      Logger.debug(`Canvas dimensions: ${JSON.stringify(canvasRect)}`);
      
      // Create a triangle with distinct angles (not equilateral)
      const startX = canvasRect.x + canvasRect.width / 4;
      const startY = canvasRect.y + canvasRect.height / 4;
      const endX = startX + 300;  // Make a wider triangle to have more distinct angles
      const endY = startY + 150;
      
      Logger.debug(`Drawing triangle from (${startX}, ${startY}) to (${endX}, ${endY})`);
      
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY);
      await page.mouse.up();
      
      // Check if any SVG paths were created (which would indicate a triangle was drawn)
      const pathCount = await page.locator('path').count();
      Logger.debug(`Found ${pathCount} SVG paths`);
      
      if (pathCount === 0) {
        throw new Error('No triangle was created');
      }
      
      // Click on the triangle to ensure it's selected
      const trianglePath = page.locator('path').first();
      await trianglePath.click();
      Logger.debug('Clicked on the triangle to select it');
      
      // Test updating angle1
      await testAngleUpdate(page, 1);
      
      // Success if we got this far
      Logger.debug('Angle update test completed successfully');
    } catch (_error) {
      Logger.error('Error in test:', _error);
      throw _error;
    }
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