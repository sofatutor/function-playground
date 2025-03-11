import { test, expect } from '@playwright/test';

test.describe('Grid Zoom Control', () => {
  test('should display zoom controls', async ({ page }) => {
    await page.goto('/');
    
    // Check that zoom controls are visible
    const zoomOutButton = page.getByRole('button').filter({ hasText: '' }).first();
    const zoomInButton = page.getByRole('button').filter({ hasText: '' }).last();
    const zoomDisplay = page.getByRole('button', { name: /\d+%/ });
    
    await expect(zoomOutButton).toBeVisible();
    await expect(zoomInButton).toBeVisible();
    await expect(zoomDisplay).toBeVisible();
    await expect(zoomDisplay).toHaveText('100%');
  });
  
  test('should zoom in when clicking the zoom in button', async ({ page }) => {
    await page.goto('/');
    
    const zoomInButton = page.getByRole('button').filter({ hasText: '' }).last();
    const zoomDisplay = page.getByRole('button', { name: /\d+%/ });
    
    // Initial zoom should be 100%
    await expect(zoomDisplay).toHaveText('100%');
    
    // Click zoom in button
    await zoomInButton.click();
    
    // Zoom should increase to 105%
    await expect(zoomDisplay).toHaveText('105%');
  });
  
  test('should zoom out when clicking the zoom out button', async ({ page }) => {
    await page.goto('/');
    
    const zoomOutButton = page.getByRole('button').filter({ hasText: '' }).first();
    const zoomDisplay = page.getByRole('button', { name: /\d+%/ });
    
    // Initial zoom should be 100%
    await expect(zoomDisplay).toHaveText('100%');
    
    // Click zoom out button
    await zoomOutButton.click();
    
    // Zoom should decrease to 95%
    await expect(zoomDisplay).toHaveText('95%');
  });
  
  test('should reset zoom when clicking the zoom display', async ({ page }) => {
    await page.goto('/');
    
    const zoomInButton = page.getByRole('button').filter({ hasText: '' }).last();
    const zoomDisplay = page.getByRole('button', { name: /\d+%/ });
    
    // Initial zoom should be 100%
    await expect(zoomDisplay).toHaveText('100%');
    
    // Click zoom in button twice
    await zoomInButton.click();
    await zoomInButton.click();
    
    // Zoom should be 110%
    await expect(zoomDisplay).toHaveText('110%');
    
    // Click zoom display to reset
    await zoomDisplay.click();
    
    // Zoom should reset to 100%
    await expect(zoomDisplay).toHaveText('100%');
  });
  
  test('should zoom in/out with keyboard shortcuts', async ({ page }) => {
    await page.goto('/');
    
    const zoomDisplay = page.getByRole('button', { name: /\d+%/ });
    
    // Initial zoom should be 100%
    await expect(zoomDisplay).toHaveText('100%');
    
    // Press Ctrl+Plus to zoom in
    await page.keyboard.press('Control+=');
    
    // Zoom should increase to 105%
    await expect(zoomDisplay).toHaveText('105%');
    
    // Press Ctrl+Minus to zoom out
    await page.keyboard.press('Control+-');
    
    // Zoom should reset to 100%
    await expect(zoomDisplay).toHaveText('100%');
  });
  
  test('should respect min and max zoom limits', async ({ page }) => {
    await page.goto('/');
    
    const zoomOutButton = page.getByRole('button').filter({ hasText: '' }).first();
    const zoomInButton = page.getByRole('button').filter({ hasText: '' }).last();
    const zoomDisplay = page.getByRole('button', { name: /\d+%/ });
    
    // Click zoom out button multiple times to reach minimum zoom (30%)
    for (let i = 0; i < 20; i++) {
      await zoomOutButton.click();
    }
    
    // Zoom should be limited to 30%
    await expect(zoomDisplay).toHaveText('30%');
    
    // Click zoom in button multiple times to reach maximum zoom (300%)
    for (let i = 0; i < 60; i++) {
      await zoomInButton.click();
    }
    
    // Zoom should be limited to 300%
    await expect(zoomDisplay).toHaveText('300%');
  });
}); 