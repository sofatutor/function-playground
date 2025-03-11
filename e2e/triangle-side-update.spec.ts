import { test, expect } from '@playwright/test';
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

test.describe('Triangle Side Updates', () => {
  test('should update triangle side immediately when edited', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:8080/');
    
    // Wait for the application to load - use the correct selector with ID
    await page.waitForSelector('#geometry-canvas', { state: 'visible', timeout: 30000 });
    console.log('Canvas found');
    
    // Take a screenshot to debug the initial state
    await takeScreenshot(page, 'initial-state');
    
    // Find the triangle tool using its ID
    const triangleButton = page.locator('#triangle-tool');
    console.log('Looking for triangle button');
    
    // Check if the triangle button exists
    const triangleButtonCount = await triangleButton.count();
    console.log(`Triangle button count: ${triangleButtonCount}`);
    
    if (triangleButtonCount === 0) {
      // Try to find by other means
      console.log('Triangle button not found by ID, trying other selectors');
      const buttons = await page.locator('button').all();
      console.log(`Found ${buttons.length} buttons`);
      
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        const ariaLabel = await button.getAttribute('aria-label');
        const text = await button.textContent();
        console.log(`Button ${i}: aria-label="${ariaLabel}", text="${text}"`);
      }
      
      // Try to find by aria-label
      const triangleByAriaLabel = page.locator('button[aria-label="Triangle"]');
      if (await triangleByAriaLabel.count() > 0) {
        console.log('Found triangle button by aria-label');
        await triangleByAriaLabel.click();
      } else {
        console.log('Triangle button not found by aria-label either');
        throw new Error('Triangle button not found');
      }
    } else {
      await triangleButton.click();
      console.log('Clicked triangle button');
    }
    
    // Find the canvas area using the correct selector
    const canvas = page.locator('#geometry-canvas');
    
    // Create a triangle by dragging on the canvas
    const canvasRect = await canvas.boundingBox();
    if (!canvasRect) {
      throw new Error('Canvas area not found');
    }
    
    console.log(`Canvas dimensions: ${JSON.stringify(canvasRect)}`);
    
    const startX = canvasRect.x + canvasRect.width / 3;
    const startY = canvasRect.y + canvasRect.height / 3;
    const endX = startX + 200;
    const endY = startY + 150;
    
    console.log(`Drawing triangle from (${startX}, ${startY}) to (${endX}, ${endY})`);
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    
    // Take a screenshot after creating the triangle
    await takeScreenshot(page, 'after-triangle-creation');
    
    // Wait for the triangle to be created
    await page.waitForTimeout(1000);
    
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
    
    // Wait a moment for selection to register
    await page.waitForTimeout(1000);
    
    // Take a screenshot after selecting the triangle
    await takeScreenshot(page, 'after-triangle-selection');
    
    // Dump the entire HTML for debugging
    const html = await page.content();
    console.log('HTML content length:', html.length);
    
    // Look for the measurement panel
    console.log('Looking for measurement panel...');
    
    // Wait for the measurement panel to appear
    await page.waitForTimeout(1000);
    
    // Look for the side1 measurement specifically
    console.log('Looking for side1 measurement...');
    
    // Try multiple approaches to find the side1 measurement
    // Approach 1: Look for the specific ID
    const side1ById = page.locator('#measurement-side1');
    const side1ByIdCount = await side1ById.count();
    console.log(`Found ${side1ByIdCount} elements with id="measurement-side1"`);
    
    // Approach 2: Look for elements with the measurement-value class that contain "Side 1"
    const side1ByClass = page.locator('.measurement-value:has-text("Side 1")');
    const side1ByClassCount = await side1ByClass.count();
    console.log(`Found ${side1ByClassCount} elements with class="measurement-value" containing "Side 1"`);
    
    // Approach 3: Look for any element containing side1 text
    const side1ByText = page.locator('div:has-text("Side 1"), span:has-text("Side 1")');
    const side1ByTextCount = await side1ByText.count();
    console.log(`Found ${side1ByTextCount} elements containing "Side 1" text`);
    
    // Approach 4: Look for any element containing a measurement value with cm
    const measurementPattern = page.locator('div:has-text(" cm"), span:has-text(" cm")');
    const measurementPatternCount = await measurementPattern.count();
    console.log(`Found ${measurementPatternCount} elements containing measurements with "cm"`);
    
    // Take a screenshot of the current state
    await takeScreenshot(page, 'before-measurement-click');
    
    // Try to find and click on the side1 measurement
    let side1Element: Locator | null = null;
    
    if (side1ByIdCount > 0) {
      side1Element = side1ById;
      console.log('Using side1 element found by ID');
    } else if (side1ByClassCount > 0) {
      side1Element = side1ByClass;
      console.log('Using side1 element found by class');
    } else if (side1ByTextCount > 0) {
      side1Element = side1ByText;
      console.log('Using side1 element found by text');
    } else if (measurementPatternCount > 0) {
      // Get all elements with cm and find the first one that looks like a side measurement
      const allMeasurements = await measurementPattern.all();
      for (const element of allMeasurements) {
        const text = await element.textContent();
        console.log(`Measurement element text: "${text}"`);
        if (text && (text.includes('Side') || text.match(/\d+\.\d+\s*cm/))) {
          side1Element = element;
          console.log(`Found potential side measurement: "${text}"`);
          break;
        }
      }
    }
    
    if (!side1Element) {
      // If we still can't find it, try a more generic approach
      console.log('Could not find side1 measurement, trying a more generic approach');
      
      // Look for any element that might be a measurement value
      const allElements = await page.locator('div, span').all();
      for (const element of allElements) {
        const text = await element.textContent();
        if (text && text.match(/\d+\.\d+\s*cm/)) {
          side1Element = element;
          console.log(`Found potential measurement: "${text}"`);
          break;
        }
      }
      
      if (!side1Element) {
        throw new Error('Could not find any side measurement element');
      }
    }
    
    // Get all initial measurements for verification
    const initialMeasurements = await getMeasurements(page);
    console.log('Initial measurements:', initialMeasurements);
    
    // Click on the side measurement to edit it
    await side1Element.click();
    console.log('Clicked on side measurement');
    
    // Wait for the input field to appear
    await page.waitForTimeout(500);
    
    // Take a screenshot after clicking
    await takeScreenshot(page, 'after-measurement-click');
    
    // Look for the input field
    const inputField = page.locator('input[type="number"]');
    const inputFieldCount = await inputField.count();
    console.log(`Found ${inputFieldCount} input fields`);
    
    if (inputFieldCount === 0) {
      // If no input field appears, try clicking again
      console.log('No input field found, trying to click again');
      await side1Element.click({ force: true });
      await page.waitForTimeout(500);
      
      // Take another screenshot
      await takeScreenshot(page, 'after-second-click');
      
      // Check again for input fields
      const inputFieldCountAfterSecondClick = await inputField.count();
      console.log(`Found ${inputFieldCountAfterSecondClick} input fields after second click`);
      
      if (inputFieldCountAfterSecondClick === 0) {
        throw new Error('No input field appeared after clicking the measurement');
      }
    }
    
    // Get the current value
    const currentValue = await inputField.inputValue();
    console.log(`Current input value: "${currentValue}"`);
    
    // Parse the current value and double it
    const numValue = parseFloat(currentValue || '0');
    const newValue = (numValue * 2).toFixed(2);
    console.log(`New value to enter: ${newValue}`);
    
    // Enter the new value
    await inputField.fill(newValue);
    console.log(`Filled input with new value: ${newValue}`);
    
    // Take a screenshot while editing
    await takeScreenshot(page, 'editing-side');
    
    // Press Enter to save
    await inputField.press('Enter');
    console.log('Pressed Enter to save');
    
    // Wait longer for the update to be applied
    console.log('Waiting for update to be applied...');
    await page.waitForTimeout(5000);
    
    // Take a screenshot after saving
    await takeScreenshot(page, 'after-save');
    
    // Get the updated measurements directly from the UI
    const updatedMeasurements = await getMeasurements(page);
    console.log('Updated measurements:', updatedMeasurements);
    
    // Verify that the side1 value has been updated
    const updatedSide1 = parseFloat(updatedMeasurements.side1 || '0');
    
    // Check if the side1 value was updated correctly
    console.log(`Expected side1: ${newValue}, Actual side1: ${updatedSide1}`);
    expect(updatedSide1).toBeCloseTo(parseFloat(newValue), 1);
    
    // Also verify that the other measurements have been scaled proportionally
    const initialSide1 = parseFloat(initialMeasurements.side1 || '0');
    const scaleFactor = updatedSide1 / initialSide1;
    console.log(`Scale factor based on side1: ${scaleFactor}`);
    
    // Check that side2 and side3 have been scaled by the same factor
    if (updatedMeasurements.side2 && initialMeasurements.side2) {
      const initialSide2 = parseFloat(initialMeasurements.side2);
      const updatedSide2 = parseFloat(updatedMeasurements.side2);
      const side2ScaleFactor = updatedSide2 / initialSide2;
      console.log(`Side2 scale factor: ${side2ScaleFactor}`);
      expect(side2ScaleFactor).toBeCloseTo(scaleFactor, 1);
    }
    
    if (updatedMeasurements.side3 && initialMeasurements.side3) {
      const initialSide3 = parseFloat(initialMeasurements.side3);
      const updatedSide3 = parseFloat(updatedMeasurements.side3);
      const side3ScaleFactor = updatedSide3 / initialSide3;
      console.log(`Side3 scale factor: ${side3ScaleFactor}`);
      expect(side3ScaleFactor).toBeCloseTo(scaleFactor, 1);
    }
    
    // Check that the area has been scaled by the square of the scale factor
    if (updatedMeasurements.area && initialMeasurements.area) {
      const initialArea = parseFloat(initialMeasurements.area);
      const updatedArea = parseFloat(updatedMeasurements.area);
      const areaScaleFactor = updatedArea / initialArea;
      console.log(`Area scale factor: ${areaScaleFactor}`);
      expect(areaScaleFactor).toBeCloseTo(scaleFactor * scaleFactor, 1);
    }
    
    // Now let's edit an angle
    console.log('Looking for angle1 measurement...');
    
    // Try to find the angle1 measurement
    const angle1ById = page.locator('#measurement-angle1');
    const angle1ByIdCount = await angle1ById.count();
    console.log(`Found ${angle1ByIdCount} elements with id="measurement-angle1"`);
    
    if (angle1ByIdCount > 0) {
      // Click on the angle measurement to edit it
      await angle1ById.click();
      console.log('Clicked on angle1 measurement');
      
      // Wait for the input field to appear
      await page.waitForTimeout(500);
      
      // Take a screenshot after clicking
      await takeScreenshot(page, 'after-angle-click');
      
      // Look for the input field
      const angleInputField = page.locator('input[type="number"]');
      const angleInputFieldCount = await angleInputField.count();
      console.log(`Found ${angleInputFieldCount} input fields for angle`);
      
      if (angleInputFieldCount > 0) {
        // Get the current angle value
        const currentAngleValue = await angleInputField.inputValue();
        console.log(`Current angle value: "${currentAngleValue}"`);
        
        // Parse the current value and add 10 degrees
        const numAngleValue = parseFloat(currentAngleValue || '0');
        const newAngleValue = (numAngleValue + 10).toString();
        console.log(`New angle value to enter: ${newAngleValue}`);
        
        // Enter the new value
        await angleInputField.fill(newAngleValue);
        console.log(`Filled angle input with new value: ${newAngleValue}`);
        
        // Take a screenshot while editing
        await takeScreenshot(page, 'editing-angle');
        
        // Press Enter to save
        await angleInputField.press('Enter');
        console.log('Pressed Enter to save angle');
        
        // Wait for the update to be applied
        await page.waitForTimeout(2000);
        
        // Take a screenshot after saving
        await takeScreenshot(page, 'after-angle-save');
        
        // Get the final measurements
        const finalMeasurements = await getMeasurements(page);
        console.log('Final measurements after angle update:', finalMeasurements);
        
        // Verify that the angle1 value has been updated
        if (finalMeasurements.angle1) {
          const updatedAngle1 = parseFloat(finalMeasurements.angle1);
          
          // Check if the angle value was updated correctly
          if (Math.abs(updatedAngle1 - parseFloat(newAngleValue)) > 1) {
            console.log('⚠️ ERROR: Angle1 value did not update in the UI after editing.');
            console.log(`Expected: ${newAngleValue}, Actual: ${updatedAngle1}`);
            
            // Fail the test with a clear error message
            expect(updatedAngle1).toBeCloseTo(parseFloat(newAngleValue), 1);
            // The test will fail here with the default error message
          } else {
            expect(updatedAngle1).toBeCloseTo(parseFloat(newAngleValue), 1);
            console.log(`Angle 1 value updated successfully: ${finalMeasurements.angle1}`);
            
            // Verify that the sum of angles is still close to 180 degrees (triangle property)
            if (finalMeasurements.angle2 && finalMeasurements.angle3) {
              const sumOfAngles = updatedAngle1 + 
                                 parseFloat(finalMeasurements.angle2) + 
                                 parseFloat(finalMeasurements.angle3);
              
              console.log(`Sum of angles: ${sumOfAngles}`);
              expect(sumOfAngles).toBeCloseTo(180, 1);
              console.log('Sum of angles is approximately 180 degrees, as expected for a triangle');
            }
          }
        }
      }
    }
    
    // Success if we got this far
    console.log('Test completed successfully');
  });
});

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
      
      // Extract the numeric value from the text (e.g., "2.50 cm" -> "2.50")
      const match = text?.match(/(\d+\.\d+)/);
      if (match && match[1]) {
        measurements[key] = match[1];
      }
    }
  }
  
  return measurements;
} 