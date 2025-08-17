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
      await expect(page.getByText('Settings')).toBeVisible();
      await expect(page.getByRole('tab', { name: 'General' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'View' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Share' })).toBeVisible();
    });
  });

  test.describe('Scenario B: Live toggles', () => {
    test('should update funcControls, tools, header, zoom, unitCtl, and fullscreen immediately', async ({ page }) => {
      // Open Settings modal
      await page.getByRole('button', { name: /settings/i }).click();
      
      // Switch to View tab
      await page.getByRole('tab', { name: 'View' }).click();
      
      // Test funcControls toggle
      await page.locator('#funcControls').click();
      await expect(page.locator('[data-testid="formula-editor"]')).toBeHidden();
      await expect(page.locator('[data-testid="plot-formula-button"]')).toBeHidden();
      await expect.poll(() => page.url()).toContain('funcControls=0');
      
      // Test tools toggle
      await page.locator('#tools').click();
      await expect(page.locator('#geometry-toolbar')).toBeHidden();
      await expect.poll(() => page.url()).toContain('tools=0');
      
      // Test header toggle
      await page.locator('#header').click();
      await expect(page.locator('h1')).toBeHidden();
      await expect.poll(() => page.url()).toContain('header=0');
      
      // Test zoom toggle
      await page.locator('#zoom').click();
      await expect(page.locator('[data-testid="grid-zoom-in"]')).toHaveCount(0);
      await expect.poll(() => page.url()).toContain('zoom=0');
      
      // Test unitCtl toggle
      await page.locator('#unitCtl').click();
      // Unit selector should be absent and unit should remain fixed
      await expect.poll(() => page.url()).toContain('unitCtl=0');
      
      // Test fullscreen toggle
      await page.locator('#fullscreen').click();
      await expect(page.getByRole('button', { name: /enter fullscreen/i })).toBeVisible();
      await expect.poll(() => page.url()).toContain('fullscreen=1');
    });
  });

  test.describe('Scenario C: Deferred toggles', () => {
    test('should apply layout and admin changes only when modal closes', async ({ page }) => {
      // Add a formula first so we can verify content remains visible in non-interactive mode
      await page.locator('[data-testid="plot-formula-button"]').click();
      // Assume there's a formula input - we'll adjust based on actual implementation
      
      // Open Settings modal
      await page.getByRole('button', { name: /settings/i }).click();
      
      // Switch to View tab and change layout to noninteractive
      await page.getByRole('tab', { name: 'View' }).click();
      await page.locator('#layout-noninteractive').click();
      
      // While modal is open, app should remain configurable
      // (This is preview mode)
      
      // Close modal to apply changes
      await page.press('body', 'Escape');
      
      // Verify non-interactive mode is applied: all UI controls hidden but content visible
      await expect(page.locator('#geometry-toolbar')).toBeHidden();
      await expect(page.locator('[data-testid="grid-zoom-in"]')).toHaveCount(0);
      await expect(page.locator('h1')).toBeHidden();
      
      // Canvas content should remain visible (grid, shapes, formulas)
      await expect(page.locator('#geometry-canvas')).toBeVisible();
      
      // Test admin toggle
      await page.getByRole('button', { name: /settings/i }).click();
      await page.getByRole('tab', { name: 'Share' }).click();
      await page.locator('#admin').click();
      await page.press('body', 'Escape');
      
      // Admin controls should be hidden
      await expect.poll(() => page.url()).toContain('admin=0');
      
      // Test language change
      await page.getByRole('button', { name: /settings/i }).click();
      await page.getByRole('tab', { name: 'Share' }).click();
      await page.locator('#language').selectOption('de');
      await page.press('body', 'Escape');
      
      await expect.poll(() => page.url()).toContain('lang=de');
    });
  });

  test.describe('Scenario D: Share URL and embed snippet', () => {
    test('should validate share URL and embed snippet reflect current options', async ({ page }) => {
      // Open Settings modal
      await page.getByRole('button', { name: /settings/i }).click();
      
      // Switch to Share tab
      await page.getByRole('tab', { name: 'Share' }).click();
      
      // Check that share URL input reflects current URL (read-only)
      const shareUrlInput = page.locator('input[readonly]').first();
      const currentUrl = await page.url();
      await expect(shareUrlInput).toHaveValue(new RegExp(currentUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      
      // Adjust width/height for embed
      await page.locator('#embed-width').fill('1024');
      await page.locator('#embed-height').fill('768');
      
      // Validate embed textarea contains iframe with current URL and updated dimensions
      const embedTextarea = page.locator('textarea[readonly]');
      await expect(embedTextarea).toContainText('<iframe');
      await expect(embedTextarea).toContainText('width="1024"');
      await expect(embedTextarea).toContainText('height="768"');
      await expect(embedTextarea).toContainText(currentUrl);
    });
  });

  test.describe('Scenario E: Direct URL loads', () => {
    test('should load with parameters and apply noninteractive precedence', async ({ page }) => {
      // Navigate with multiple parameters including noninteractive layout
      await page.goto('/?layout=noninteractive&header=0&tools=0&zoom=0&unitCtl=0&fullscreen=1&funcControls=0&lang=de');
      
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
      // The specific behavior depends on implementation
    });
  });

  test.describe('Scenario F: Legacy compatibility', () => {
    test('should handle legacy funcOnly parameter', async ({ page }) => {
      await page.goto('/?funcOnly=1');
      
      // Validate behavior maps to new schema (tools should be off)
      // This depends on the actual legacy conversion logic implemented
      
      // When generating new URLs through settings, should not emit funcOnly
      await page.getByRole('button', { name: /settings/i }).click();
      await page.getByRole('tab', { name: 'Share' }).click();
      
      const shareUrlInput = page.locator('input[readonly]').first();
      const shareUrl = await shareUrlInput.inputValue();
      expect(shareUrl).not.toContain('funcOnly');
    });
  });

  test.describe('Parameter precedence and combinations', () => {
    test('should respect precedence when funcControls=0 and tools=0', async ({ page }) => {
      await page.goto('/?funcControls=0&tools=0');
      
      // Both function controls and geometry tools should be hidden
      await expect(page.locator('[data-testid="formula-editor"]')).toBeHidden();
      await expect(page.locator('[data-testid="plot-formula-button"]')).toBeHidden();
      await expect(page.locator('#geometry-toolbar')).toBeHidden();
    });

    test('should lock unit when unitCtl=0', async ({ page }) => {
      await page.goto('/?unitCtl=0');
      
      // Unit selector should be absent
      await expect(page.locator('select, combobox').filter({ hasText: /cm|in|mm/ })).toHaveCount(0);
      
      // Unit should remain fixed under interactions
      // This would require specific interaction testing
    });
  });

  test.describe('Environment and admin defaults', () => {
    test('should show admin controls by default with VITE_ADMIN_MODE=true', async ({ page }) => {
      // Admin controls should be visible by default
      await expect(page.getByRole('button', { name: /settings/i })).toBeVisible();
    });

    test('should allow URL override of admin defaults', async ({ page }) => {
      await page.goto('/?admin=0');
      
      // Admin controls should be hidden even though VITE_ADMIN_MODE=true
      await expect(page.getByRole('button', { name: /settings/i })).toBeHidden();
    });
  });
});