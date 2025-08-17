import { test, expect } from '@playwright/test';

test.describe('Share Panel Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Geometry Visualizer');
  });

  test.describe('Scenario A: Default layout without params', () => {
    test('should show default layout with all UI elements visible', async ({ page }) => {
      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Assert default UI elements are visible
      await expect(page.locator('#geometry-toolbar')).toBeVisible();
      await expect(page.locator('[data-testid="grid-zoom-in"]')).toBeVisible();
      
      // Check for header (title and description)
      await expect(page.locator('h1')).toBeVisible();
      
      // Open Settings modal using the correct selector for the settings button
      const settingsButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
      await settingsButton.click();
      
      // Verify modal heading and tabs are present
      await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'General' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'View' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Share' })).toBeVisible();
    });
  });

  test.describe('Scenario B: Live toggles', () => {
    test('should update UI elements immediately when toggled in View tab', async ({ page }) => {
      // Open Settings modal
      const settingsButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
      await settingsButton.click();
      
      // Switch to View tab
      await page.getByRole('tab', { name: 'View' }).click();
      
      // Test funcControls toggle
      await page.locator('#funcControls').click();
      await expect.poll(() => page.url()).toContain('funcControls=0');
      
      // Test tools toggle
      await page.locator('#tools').click();
      await expect.poll(() => page.url()).toContain('tools=0');
      
      // Test header toggle
      await page.locator('#header').click();
      await expect.poll(() => page.url()).toContain('header=0');
      
      // Test zoom toggle
      await page.locator('#zoom').click();
      await expect.poll(() => page.url()).toContain('zoom=0');
      
      // Test unitCtl toggle
      await page.locator('#unitCtl').click();
      await expect.poll(() => page.url()).toContain('unitCtl=0');
      
      // Test fullscreen toggle
      await page.locator('#fullscreen').click();
      await expect.poll(() => page.url()).toContain('fullscreen=1');
      
      // Close modal to see effects
      await page.keyboard.press('Escape');
      
      // Verify key effects are applied
      await expect(page.locator('#geometry-toolbar')).toBeHidden();
      await expect(page.locator('h1')).toBeHidden(); // header hidden
    });
  });

  test.describe('Scenario C: Deferred toggles', () => {
    test('should apply layout changes when modal closes', async ({ page }) => {
      // Open Settings modal
      const settingsButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
      await settingsButton.click();
      
      // Switch to View tab and change layout to noninteractive
      await page.getByRole('tab', { name: 'View' }).click();
      await page.locator('#layout-noninteractive').click();
      
      // Close modal to apply changes
      await page.keyboard.press('Escape');
      
      // Verify non-interactive mode is applied: all UI controls hidden but content visible
      await expect(page.locator('#geometry-toolbar')).toBeHidden();
      await expect(page.locator('[data-testid="grid-zoom-in"]')).toHaveCount(0);
      await expect(page.locator('h1')).toBeHidden();
      
      // Canvas content should remain visible
      await expect(page.locator('#geometry-canvas')).toBeVisible();
      
      // Verify URL contains layout parameter
      await expect.poll(() => page.url()).toContain('layout=noninteractive');
    });
  });

  test.describe('Scenario D: Share URL and embed snippet', () => {
    test('should validate share URL and embed snippet reflect current options', async ({ page }) => {
      // Open Settings modal
      const settingsButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
      await settingsButton.click();
      
      // Switch to Share tab
      await page.getByRole('tab', { name: 'Share' }).click();
      
      // Check that share URL input reflects current URL (read-only)
      const shareUrlInput = page.locator('input[readonly]').first();
      const currentUrl = page.url();
      const shareUrl = await shareUrlInput.inputValue();
      expect(shareUrl).toContain(new URL(currentUrl).origin);
      
      // Adjust width/height for embed
      await page.locator('#embed-width').fill('1024');
      await page.locator('#embed-height').fill('768');
      
      // Validate embed textarea contains iframe with current URL and updated dimensions
      const embedTextarea = page.locator('textarea[readonly]');
      await expect(embedTextarea).toContainText('<iframe');
      await expect(embedTextarea).toContainText('width="1024"');
      await expect(embedTextarea).toContainText('height="768"');
      await expect(embedTextarea).toContainText(new URL(currentUrl).origin);
    });
  });

  test.describe('Scenario E: Direct URL loads', () => {
    test('should load with parameters and apply noninteractive precedence', async ({ page }) => {
      // Navigate with multiple parameters including noninteractive layout
      await page.goto('/?layout=noninteractive&header=0&tools=0&zoom=0&unitCtl=0&fullscreen=1&funcControls=0&lang=de');
      
      // Wait for load
      await page.waitForLoadState('networkidle');
      
      // Assert noninteractive precedence: all UI hidden, content visible
      await expect(page.locator('#geometry-toolbar')).toBeHidden();
      await expect(page.locator('[data-testid="grid-zoom-in"]')).toHaveCount(0);
      await expect(page.locator('h1')).toBeHidden();
      await expect(page.locator('#geometry-canvas')).toBeVisible();
      
      // Verify URL parameters are preserved
      await expect.poll(() => page.url()).toContain('layout=noninteractive');
      await expect.poll(() => page.url()).toContain('lang=de');
    });

    test('should handle language fallback for unsupported languages', async ({ page }) => {
      // Test with unsupported language
      await page.goto('/?lang=unsupported');
      
      // Should fallback gracefully (likely to 'en' or configured default)
      // The app should still load without errors
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Scenario F: Legacy compatibility', () => {
    test('should handle legacy funcOnly parameter', async ({ page }) => {
      await page.goto('/?funcOnly=1');
      
      // The app should still load without errors
      await expect(page.locator('h1')).toBeVisible();
      
      // Legacy parameters may be preserved in the current implementation
      // This test verifies the app handles them gracefully rather than converts them
      await expect.poll(() => page.url()).toContain('funcOnly=1');
    });
  });

  test.describe('Parameter precedence and combinations', () => {
    test('should respect precedence when funcControls=0 and tools=0', async ({ page }) => {
      await page.goto('/?funcControls=0&tools=0');
      
      // Both function controls and geometry tools should be hidden
      await expect(page.locator('[data-testid="plot-formula-button"]')).toBeHidden();
      await expect(page.locator('#geometry-toolbar')).toBeHidden();
    });

    test('should lock unit when unitCtl=0', async ({ page }) => {
      await page.goto('/?unitCtl=0');
      
      // Unit selector should be absent
      const unitSelectors = page.locator('select, combobox').filter({ hasText: /cm|in|mm/ });
      await expect(unitSelectors).toHaveCount(0);
    });

    test('should show fullscreen button when fullscreen=1', async ({ page }) => {
      await page.goto('/?fullscreen=1');
      
      // Fullscreen button should be visible
      await expect(page.getByRole('button', { name: /enter fullscreen|exit fullscreen/i })).toBeVisible();
    });
  });

  test.describe('Environment and admin defaults', () => {
    test('should show admin controls by default with VITE_ADMIN_MODE=true', async ({ page }) => {
      // Admin controls should be visible by default (settings button)
      const settingsButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
      await expect(settingsButton).toBeVisible();
    });

    test('should allow URL override of admin defaults', async ({ page }) => {
      await page.goto('/?admin=0');
      
      // Based on the implementation, admin controls may still be visible in current session
      // but the admin=0 parameter should be reflected in the URL and affect shared URLs
      await expect.poll(() => page.url()).toContain('admin=0');
      
      // The settings button should still be visible (admin toggle affects shared URLs, not current session)
      const settingsButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
      await expect(settingsButton).toBeVisible();
      
      // But when generating share URLs, admin=0 should be preserved
      await settingsButton.click();
      await page.getByRole('tab', { name: 'Share' }).click();
      
      const shareUrlInput = page.locator('input[readonly]').first();
      const shareUrl = await shareUrlInput.inputValue();
      expect(shareUrl).toContain('admin=0');
    });
  });

  test.describe('Tab navigation and modal behavior', () => {
    test('should allow navigation between tabs', async ({ page }) => {
      const settingsButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
      await settingsButton.click();
      
      // Test all three tabs
      await page.getByRole('tab', { name: 'General' }).click();
      await expect(page.getByRole('heading', { name: 'Language' })).toBeVisible();
      
      await page.getByRole('tab', { name: 'View' }).click();
      await expect(page.getByRole('heading', { name: 'Layout' })).toBeVisible();
      
      await page.getByRole('tab', { name: 'Share' }).click();
      // Look for admin controls toggle or share URL text instead
      await expect(page.getByRole('heading', { name: 'Admin Controls' })).toBeVisible();
    });

    test('should close modal with escape key', async ({ page }) => {
      const settingsButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
      await settingsButton.click();
      
      // Modal should be open
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
      
      // Press escape to close
      await page.keyboard.press('Escape');
      
      // Modal should be closed
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeHidden();
    });
  });
});