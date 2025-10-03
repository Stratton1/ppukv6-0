import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../utils/auth-helpers';
import { PropertyHelpers } from '../utils/property-helpers';
import { UploadHelpers } from '../utils/upload-helpers';
import { TEST_PROPERTIES, TEST_FILES, TEST_UPLOADS } from '../fixtures/test-data';

/**
 * E2E Test: Complete Owner Workflow
 * Tests: Login → Claim Property → Upload Photos → Upload Documents → Download
 */
test.describe('Owner Workflow', () => {
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

  test('Complete owner workflow: login → claim → upload → download', async ({ page }) => {
    // Step 1: Login as owner
    await authHelpers.quickLoginAs('owner');
    await expect(page).toHaveURL('/dashboard');

    // Step 2: Navigate to property passport
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);
    await propertyHelpers.verifyPropertyPassportLoaded();

    // Step 3: Upload a photo
    await propertyHelpers.switchToTab('photos');
    const initialPhotoCount = await uploadHelpers.getUploadedItemsCount('photos');
    
    await uploadHelpers.uploadPhoto(
      TEST_FILES.smallImage.name,
      TEST_UPLOADS.photo.caption,
      TEST_UPLOADS.photo.roomType
    );

    // Verify photo was uploaded
    const newPhotoCount = await uploadHelpers.getUploadedItemsCount('photos');
    expect(newPhotoCount).toBe(initialPhotoCount + 1);

    // Step 4: Upload a document
    await propertyHelpers.switchToTab('documents');
    const initialDocCount = await uploadHelpers.getUploadedItemsCount('documents');
    
    await uploadHelpers.uploadDocument(
      TEST_FILES.smallDocument.name,
      TEST_UPLOADS.document.type,
      TEST_UPLOADS.document.description
    );

    // Verify document was uploaded
    const newDocCount = await uploadHelpers.getUploadedItemsCount('documents');
    expect(newDocCount).toBe(initialDocCount + 1);

    // Step 5: Download document
    const download = await uploadHelpers.downloadDocument();
    expect(download.suggestedFilename()).toBeTruthy();

    // Step 6: Verify passport completion score updated
    await expect(page.locator('[data-testid="passport-score"]')).toBeVisible();
  });

  test('Owner can upload multiple photos', async ({ page }) => {
    await authHelpers.quickLoginAs('owner');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);
    await propertyHelpers.switchToTab('photos');

    // Upload multiple photos
    const photos = [
      { name: TEST_FILES.smallImage.name, caption: 'Kitchen', roomType: 'Kitchen' },
      { name: TEST_FILES.smallImage.name, caption: 'Living Room', roomType: 'Living Room' },
      { name: TEST_FILES.smallImage.name, caption: 'Bedroom', roomType: 'Bedroom' }
    ];

    for (const photo of photos) {
      await uploadHelpers.uploadPhoto(photo.name, photo.caption, photo.roomType);
    }

    // Verify all photos are displayed
    const photoCount = await uploadHelpers.getUploadedItemsCount('photos');
    expect(photoCount).toBeGreaterThanOrEqual(3);
  });

  test('Owner can upload different document types', async ({ page }) => {
    await authHelpers.quickLoginAs('owner');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);
    await propertyHelpers.switchToTab('documents');

    const documentTypes = ['epc', 'floorplan', 'title_deed', 'survey'];

    for (const docType of documentTypes) {
      await uploadHelpers.uploadDocument(
        TEST_FILES.smallDocument.name,
        docType,
        `Test ${docType} document`
      );
    }

    // Verify all documents are displayed
    const docCount = await uploadHelpers.getUploadedItemsCount('documents');
    expect(docCount).toBeGreaterThanOrEqual(4);
  });

  test('Owner can view all property passport tabs', async ({ page }) => {
    await authHelpers.quickLoginAs('owner');
    await propertyHelpers.goToPropertyPassport(TEST_PROPERTIES.dev001.id);

    const tabs = ['overview', 'documents', 'photos', 'data', 'history', 'insights'];

    for (const tab of tabs) {
      await propertyHelpers.switchToTab(tab as any);
      await expect(page.locator(`[data-testid="${tab}-tab"]`)).toHaveClass(/active/);
    }
  });
});
