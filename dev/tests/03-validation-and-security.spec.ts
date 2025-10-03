import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../utils/auth-helpers';
import { PropertyHelpers } from '../utils/property-helpers';
import { UploadHelpers } from '../utils/upload-helpers';
import { TEST_PROPERTIES, TEST_FILES, EXPECTED_MESSAGES } from '../fixtures/test-data';

/**
 * E2E Test: Validation and Security
 * Tests: File validation, RLS policies, error handling
 */
test.describe('Validation and Security', () => {
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

  test('File size validation works correctly', async ({ page }) => {
    await authHelpers.quickLoginAs('owner');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);
    await propertyHelpers.switchToTab('photos');

    // Test photo size limit (5MB)
    await uploadHelpers.testFileSizeValidation(
      TEST_FILES.largeImage.name,
      EXPECTED_MESSAGES.fileTooLarge
    );

    // Test document size limit (10MB)
    await propertyHelpers.switchToTab('documents');
    await uploadHelpers.testFileSizeValidation(
      TEST_FILES.largeDocument.name,
      EXPECTED_MESSAGES.fileTooLarge
    );
  });

  test('File type validation works correctly', async ({ page }) => {
    await authHelpers.quickLoginAs('owner');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);
    await propertyHelpers.switchToTab('photos');

    // Test invalid file type
    await uploadHelpers.testFileTypeValidation(TEST_FILES.invalidFile.name);
  });

  test('RLS policies prevent unauthorized uploads', async ({ page }) => {
    // Login as buyer (should not be able to upload)
    await authHelpers.quickLoginAs('buyer');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);

    // Verify upload buttons are not visible
    await propertyHelpers.switchToTab('photos');
    const canUploadPhotos = await uploadHelpers.canUpload();
    expect(canUploadPhotos).toBe(false);

    await propertyHelpers.switchToTab('documents');
    const canUploadDocs = await uploadHelpers.canUpload();
    expect(canUploadDocs).toBe(false);
  });

  test('Anonymous users are redirected to login', async ({ page }) => {
    // Try to access property passport without login
    await page.goto(`/passport/${TEST_PROPERTIES.dev001.id}`);
    
    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
  });

  test('Error handling for network failures', async ({ page }) => {
    await authHelpers.quickLoginAs('owner');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);
    await propertyHelpers.switchToTab('photos');

    // Simulate network failure
    await page.route('**/storage/**', route => route.abort());
    
    // Try to upload
    await page.click('[data-testid="upload-photo-button"]');
    await page.waitForSelector('[data-testid="upload-dialog"]');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/files/test-photo.jpg');
    
    await page.click('[data-testid="upload-submit"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="toast-error"]')).toContainText(EXPECTED_MESSAGES.uploadError);
  });

  test('Property passport completion score updates correctly', async ({ page }) => {
    await authHelpers.quickLoginAs('owner');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);
    await propertyHelpers.switchToTab('documents');

    // Get initial score
    const initialScore = await page.locator('[data-testid="passport-score"]').textContent();
    
    // Upload a document
    await uploadHelpers.uploadDocument(
      TEST_FILES.smallDocument.name,
      'epc',
      'Test EPC document'
    );

    // Check if score updated
    await page.waitForTimeout(1000); // Wait for score to update
    const newScore = await page.locator('[data-testid="passport-score"]').textContent();
    
    // Score should have increased
    expect(newScore).not.toBe(initialScore);
  });

  test('Signed URL generation works for document downloads', async ({ page }) => {
    await authHelpers.quickLoginAs('owner');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);
    await propertyHelpers.switchToTab('documents');

    // Check if documents exist
    const docCount = await uploadHelpers.getUploadedItemsCount('documents');
    
    if (docCount > 0) {
      // Monitor network requests
      const downloadPromise = page.waitForResponse(response => 
        response.url().includes('createSignedUrl') && response.status() === 200
      );

      // Click download
      await page.click('[data-testid="download-button"]:first-child');
      
      // Verify signed URL was generated
      const response = await downloadPromise;
      const responseData = await response.json();
      expect(responseData.signedUrl).toBeTruthy();
      expect(responseData.signedUrl).toContain('token=');
    } else {
      // Skip test if no documents available
      test.skip();
    }
  });

  test('Property passport tabs are accessible and functional', async ({ page }) => {
    await authHelpers.quickLoginAs('owner');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);

    const tabs = [
      { name: 'overview', content: '[data-testid="property-details"]' },
      { name: 'documents', content: '[data-testid="document-list"]' },
      { name: 'photos', content: '[data-testid="photo-grid"]' },
      { name: 'data', content: '[data-testid="api-cards"]' },
      { name: 'history', content: '[data-testid="history-placeholder"]' },
      { name: 'insights', content: '[data-testid="insights-placeholder"]' }
    ];

    for (const tab of tabs) {
      await propertyHelpers.switchToTab(tab.name as any);
      await expect(page.locator(tab.content)).toBeVisible();
    }
  });
});
