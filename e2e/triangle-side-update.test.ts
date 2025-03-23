import { expect } from '@playwright/test';
import { test } from './test-helper';
import type { Locator, Page } from '@playwright/test';
import { Logger } from './utils/logger';

test.describe('Triangle Side Updates', () => {
  test('should update triangle side immediately when edited', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load - use the correct selector with ID
    await page.waitForSelector('#geometry-canvas', { state: 'visible', timeout: 30000 });
    Logger.debug('Canvas found');
    
    // Find the triangle tool with robust selector
    const triangleButton = page.locator('#triangle-tool, button[aria-label="Triangle"]').first();
    Logger.debug('Looking for triangle button');
    
    // If the triangle button is visible, click it
    const triangleButtonVisible = await triangleButton.isVisible();
    Logger.debug(`Triangle button visible: ${triangleButtonVisible}`);
    
    if (!triangleButtonVisible) {
      // If still not found, try to find other buttons as a last resort
      const buttons = await page.locator('button').all();
      Logger.debug(`Found ${buttons.length} buttons`);
      
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        const ariaLabel = await button.getAttribute('aria-label');
        const text = await button.textContent();
        Logger.debug(`Button ${i}: aria-label="${ariaLabel}", text="${text}"`);
      }
      
      // If really not found, fail the test
      Logger.error('Triangle button not found by any means');
      throw new Error('Triangle button not found');
    }
    
    // Click the triangle button
    await triangleButton.click();
    Logger.debug('Clicked triangle button');
    
    // Find the canvas area using the correct selector
    const canvas = page.locator('#geometry-canvas');
    
    // Create a triangle by dragging on the canvas
    const canvasRect = await canvas.boundingBox();
    if (!canvasRect) {
      throw new Error('Canvas area not found');
    }
    
    Logger.debug(`Canvas dimensions: ${JSON.stringify(canvasRect)}`);
    
    const startX = canvasRect.x + canvasRect.width / 3;
    const startY = canvasRect.y + canvasRect.height / 3;
    const endX = startX + 200;
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
    
    // Dump the entire HTML for debugging
    const html = await page.content();
    Logger.debug('HTML content length:', html.length);
    
    Logger.debug('Looking for measurement panel...');
    Logger.debug('Looking for side1 measurement...');
    
    // Try multiple approaches to find the side1 measurement
    // Approach 1: Look for the specific ID
    const side1ById = page.locator('#measurement-side1');
    const side1ByIdCount = await side1ById.count();
    Logger.debug(`Found ${side1ByIdCount} elements with id="measurement-side1"`);
    
    // Approach 2: Look for elements with the measurement-value class that contain "Side 1"
    const side1ByClass = page.locator('.measurement-value:has-text("Side 1")');
    const side1ByClassCount = await side1ByClass.count();
    Logger.debug(`Found ${side1ByClassCount} elements with class="measurement-value" containing "Side 1"`);
    
    // Approach 3: Look for any element containing side1 text
    const side1ByText = page.locator('div:has-text("Side 1"), span:has-text("Side 1")');
    const side1ByTextCount = await side1ByText.count();
    Logger.debug(`Found ${side1ByTextCount} elements containing "Side 1" text`);
    
    // Approach 4: Look for any element containing a measurement value with cm
    const measurementPattern = page.locator('div:has-text(" cm"), span:has-text(" cm")');
    const measurementPatternCount = await measurementPattern.count();
    Logger.debug(`Found ${measurementPatternCount} elements containing measurements with "cm"`);
    
    // Try to find and click on the side1 measurement
    let side1Element: Locator | null = null;
    
    if (side1ByIdCount > 0) {
      side1Element = side1ById;
      Logger.debug('Using side1 element found by ID');
    } else if (side1ByClassCount > 0) {
      side1Element = side1ByClass;
      Logger.debug('Using side1 element found by class');
    } else if (side1ByTextCount > 0) {
      side1Element = side1ByText;
      Logger.debug('Using side1 element found by text');
    } else if (measurementPatternCount > 0) {
      // Get all elements with cm and find the first one that looks like a side measurement
      const allMeasurements = await measurementPattern.all();
      for (const element of allMeasurements) {
        const text = await element.textContent();
        Logger.debug(`Measurement element text: "${text}"`);
        if (text && (text.includes('Side') || text.match(/\d+\.\d+\s*cm/))) {
          side1Element = element;
          Logger.debug(`Found potential side measurement: "${text}"`);
          break;
        }
      }
    }
    
    if (!side1Element) {
      // If we still can't find it, try a more generic approach
      Logger.debug('Could not find side1 measurement, trying a more generic approach');
      
      // Look for any element that might be a measurement value
      const allElements = await page.locator('div, span').all();
      for (const element of allElements) {
        const text = await element.textContent();
        if (text && text.match(/\d+\.\d+\s*cm/)) {
          side1Element = element;
          Logger.debug(`Found potential measurement: "${text}"`);
          break;
        }
      }
      
      if (!side1Element) {
        throw new Error('Could not find any side measurement element');
      }
    }
    
    // Get all initial measurements for verification
    const initialMeasurements = await getMeasurements(page);
    Logger.debug('Initial measurements:', initialMeasurements);
    
    // Click on the side measurement to edit it
    await side1Element.click();
    Logger.debug('Clicked on side measurement');
    
    // Look for the input field
    const inputField = page.locator('input[type="number"]');
    const inputFieldCount = await inputField.count();
    Logger.debug(`Found ${inputFieldCount} input fields`);
    
    if (inputFieldCount === 0) {
      // If no input field appears, try clicking again
      Logger.debug('No input field found, trying to click again');
      await side1Element.click({ force: true });
      
      // Check again for input fields
      const inputFieldCountAfterSecondClick = await inputField.count();
      Logger.debug(`Found ${inputFieldCountAfterSecondClick} input fields after second click`);
      
      if (inputFieldCountAfterSecondClick === 0) {
        throw new Error('No input field appeared after clicking the measurement');
      }
    }
    
    // Get the current value
    const currentValue = await inputField.inputValue();
    Logger.debug(`Current input value: "${currentValue}"`);
    
    // Parse the current value and double it
    const numValue = parseFloat(currentValue || '0');
    const newValue = (numValue * 2).toFixed(2);
    Logger.debug(`New value to enter: ${newValue}`);
    
    // Enter the new value
    await inputField.fill(newValue);
    Logger.debug(`Filled input with new value: ${newValue}`);
    
    // Press Enter to save
    await inputField.press('Enter');
    Logger.debug('Pressed Enter to save');
    
    // Get the updated measurements directly from the UI
    const updatedMeasurements = await getMeasurements(page);
    Logger.debug('Updated measurements:', updatedMeasurements);
    
    // Verify that the side1 value has been updated
    const updatedSide1 = parseFloat(updatedMeasurements.side1 || '0');
    
    // Check if the side1 value was updated correctly
    Logger.debug(`Expected side1: ${newValue}, Actual side1: ${updatedSide1}`);
    expect(updatedSide1).toBeCloseTo(parseFloat(newValue), 1);
    
    // Also verify that the other measurements have been scaled proportionally
    const initialSide1 = parseFloat(initialMeasurements.side1 || '0');
    const scaleFactor = updatedSide1 / initialSide1;
    Logger.debug(`Scale factor based on side1: ${scaleFactor}`);
    
    // Check that side2 and side3 have been scaled by the same factor
    if (updatedMeasurements.side2 && initialMeasurements.side2) {
      const initialSide2 = parseFloat(initialMeasurements.side2);
      const updatedSide2 = parseFloat(updatedMeasurements.side2);
      const side2ScaleFactor = updatedSide2 / initialSide2;
      Logger.debug(`Side2 scale factor: ${side2ScaleFactor}`);
      expect(side2ScaleFactor).toBeCloseTo(scaleFactor, 1);
    }
    
    if (updatedMeasurements.side3 && initialMeasurements.side3) {
      const initialSide3 = parseFloat(initialMeasurements.side3);
      const updatedSide3 = parseFloat(updatedMeasurements.side3);
      const side3ScaleFactor = updatedSide3 / initialSide3;
      Logger.debug(`Side3 scale factor: ${side3ScaleFactor}`);
      expect(side3ScaleFactor).toBeCloseTo(scaleFactor, 1);
    }
    
    // Check that the area has been scaled by the square of the scale factor
    if (updatedMeasurements.area && initialMeasurements.area) {
      const initialArea = parseFloat(initialMeasurements.area);
      const updatedArea = parseFloat(updatedMeasurements.area);
      const areaScaleFactor = updatedArea / initialArea;
      Logger.debug(`Area scale factor: ${areaScaleFactor}`);
      expect(areaScaleFactor).toBeCloseTo(scaleFactor * scaleFactor, 1);
    }
    
    // Now let's edit an angle
    Logger.debug('Looking for angle1 measurement...');
    
    // Try to find the angle1 measurement
    const angle1ById = page.locator('#measurement-angle1');
    const angle1ByIdCount = await angle1ById.count();
    Logger.debug(`Found ${angle1ByIdCount} elements with id="measurement-angle1"`);
    
    if (angle1ByIdCount > 0) {
      // Click on the angle measurement to edit it
      await angle1ById.click();
      Logger.debug('Clicked on angle1 measurement');
      
      // Look for the input field
      const angleInputField = page.locator('input[type="number"]');
      const angleInputFieldCount = await angleInputField.count();
      Logger.debug(`Found ${angleInputFieldCount} input fields for angle`);
      
      if (angleInputFieldCount > 0) {
        // Get the current angle value
        const currentAngleValue = await angleInputField.inputValue();
        Logger.debug(`Current angle value: "${currentAngleValue}"`);
        
        // Parse the current value and add 10 degrees
        const numAngleValue = parseFloat(currentAngleValue || '0');
        const newAngleValue = (numAngleValue + 10).toString();
        Logger.debug(`New angle value to enter: ${newAngleValue}`);
        
        // Enter the new value
        await angleInputField.fill(newAngleValue);
        Logger.debug(`Filled angle input with new value: ${newAngleValue}`);
        
        // Press Enter to save
        await angleInputField.press('Enter');
        Logger.debug('Pressed Enter to save angle');
        
        
        // Get the final measurements
        const finalMeasurements = await getMeasurements(page);
        Logger.debug('Final measurements after angle update:', finalMeasurements);
        
        // Verify that the angle1 value has been updated
        if (finalMeasurements.angle1) {
          const updatedAngle1 = parseFloat(finalMeasurements.angle1);
          
          // Check if the angle value was updated correctly
          if (Math.abs(updatedAngle1 - parseFloat(newAngleValue)) > 1) {
            Logger.error('⚠️ ERROR: Angle1 value did not update in the UI after editing.');
            Logger.error(`Expected: ${newAngleValue}, Actual: ${updatedAngle1}`);
            
            // Fail the test with a clear error message
            expect(updatedAngle1).toBeCloseTo(parseFloat(newAngleValue), 1);
            // The test will fail here with the default error message
          } else {
            expect(updatedAngle1).toBeCloseTo(parseFloat(newAngleValue), 1);
            Logger.debug(`Angle 1 value updated successfully: ${finalMeasurements.angle1}`);
            
            // Verify that the sum of angles is still close to 180 degrees (triangle property)
            if (finalMeasurements.angle2 && finalMeasurements.angle3) {
              const sumOfAngles = updatedAngle1 + 
                                 parseFloat(finalMeasurements.angle2) + 
                                 parseFloat(finalMeasurements.angle3);
              
              Logger.debug(`Sum of angles: ${sumOfAngles}`);
              expect(sumOfAngles).toBeCloseTo(180, 1);
              Logger.debug('Sum of angles is approximately 180 degrees, as expected for a triangle');
            }
          }
        }
      }
    }
    
    // Success if we got this far
    Logger.debug('Test completed successfully');
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