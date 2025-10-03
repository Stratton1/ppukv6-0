import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../utils/auth-helpers';
import { PropertyHelpers } from '../utils/property-helpers';
import { UploadHelpers } from '../utils/upload-helpers';
import { TEST_PROPERTIES } from '../fixtures/test-data';

/**
 * E2E Test: Buyer Workflow
 * Tests: Login → Browse Properties → View Passports → Download Documents (Read-Only)
 */
test.describe('Buyer Workflow', () => {
  let authHelpers: AuthHelpers;
  let propertyHelpers: PropertyHelpers;
  let uploadHelpers: UploadHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    propertyHelpers = new PropertyHelpers(page);
    uploadHelpers = new UploadHelpers(page);

    // Ensure test data is seeded
    await authHelpers.ensureTestDataSeeded();
  });

  test('Buyer can browse and view property passports', async ({ page }) => {
    // Step 1: Login as buyer
    await authHelpers.quickLoginAs('buyer');
    await expect(page).toHaveURL('/dashboard');

    // Step 2: Navigate to property passport
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);
    await propertyHelpers.verifyPropertyPassportLoaded();

    // Step 3: Verify buyer cannot upload (read-only access)
    await propertyHelpers.switchToTab('photos');
    const canUploadPhotos = await uploadHelpers.canUpload();
    expect(canUploadPhotos).toBe(false);

    await propertyHelpers.switchToTab('documents');
    const canUploadDocs = await uploadHelpers.canUpload();
    expect(canUploadDocs).toBe(false);

    // Step 4: Verify buyer can view content
    await expect(page.locator('[data-testid="photo-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="document-list"]')).toBeVisible();
  });

  test('Buyer can download documents with signed URLs', async ({ page }) => {
    await authHelpers.quickLoginAs('buyer');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);
    await propertyHelpers.switchToTab('documents');

    // Check if documents exist
    const docCount = await uploadHelpers.getUploadedItemsCount('documents');
    
    if (docCount > 0) {
      // Download first document
      const download = await uploadHelpers.downloadDocument();
      expect(download.suggestedFilename()).toBeTruthy();
    } else {
      // Skip test if no documents available
      test.skip();
    }
  });

  test('Buyer can view photo gallery with lightbox', async ({ page }) => {
    await authHelpers.quickLoginAs('buyer');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);
    await propertyHelpers.switchToTab('photos');

    // Check if photos exist
    const photoCount = await uploadHelpers.getUploadedItemsCount('photos');
    
    if (photoCount > 0) {
      // Click on first photo to open lightbox
      await page.click('[data-testid="photo-item"]:first-child');
      await expect(page.locator('[data-testid="lightbox"]')).toBeVisible();
      
      // Close lightbox
      await page.click('[data-testid="lightbox-close"]');
      await expect(page.locator('[data-testid="lightbox"]')).not.toBeVisible();
    } else {
      // Skip test if no photos available
      test.skip();
    }
  });

  test('Buyer can view all property passport tabs', async ({ page }) => {
    await authHelpers.quickLoginAs('buyer');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);

    const tabs = ['overview', 'documents', 'photos', 'data', 'history', 'insights'];

    for (const tab of tabs) {
      await propertyHelpers.switchToTab(tab as any);
      await expect(page.locator(`[data-testid="${tab}-tab"]`)).toHaveClass(/active/);
    }
  });

  test('Buyer can search and browse multiple properties', async ({ page }) => {
    await authHelpers.quickLoginAs('buyer');
    
    // Go to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Search for properties
    await page.fill('input[name="search"]', 'London');
    await page.click('button[type="submit"]');

    // Wait for results
    await page.waitForSelector('[data-testid="property-card"]');
    
    // Verify properties are displayed
    const propertyCards = await page.locator('[data-testid="property-card"]').count();
    expect(propertyCards).toBeGreaterThan(0);

    // Click on a property
    await page.click('[data-testid="property-card"]:first-child');
    await expect(page).toHaveURL(/\/passport\//);
  });
});
