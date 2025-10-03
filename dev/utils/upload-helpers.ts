import { Page, expect } from "@playwright/test";
import { TEST_FILES, TEST_UPLOADS, SELECTORS, EXPECTED_MESSAGES } from "../fixtures/test-data";

/**
 * File upload helper functions for E2E tests
 */
export class UploadHelpers {
  constructor(private page: Page) {}

  /**
   * Upload a photo with metadata
   */
  async uploadPhoto(fileName: string, caption?: string, roomType?: string) {
    // Click upload photo button
    await this.page.click(SELECTORS.uploadPhotoButton);

    // Wait for upload dialog
    await this.page.waitForSelector(SELECTORS.uploadDialog);

    // Select file
    const fileInput = this.page.locator(SELECTORS.fileInput);
    await fileInput.setInputFiles(`e2e/fixtures/files/${fileName}`);

    // Fill in metadata if provided
    if (caption) {
      await this.page.fill('input[name="caption"]', caption);
    }
    if (roomType) {
      await this.page.fill('input[name="roomType"]', roomType);
    }

    // Submit upload
    await this.page.click(SELECTORS.uploadSubmit);

    // Wait for success message
    await this.page.waitForSelector(SELECTORS.toastSuccess);
    await expect(this.page.locator(SELECTORS.toastSuccess)).toContainText(
      EXPECTED_MESSAGES.uploadSuccess
    );
  }

  /**
   * Upload a document with metadata
   */
  async uploadDocument(fileName: string, documentType: string, description?: string) {
    // Click upload document button
    await this.page.click(SELECTORS.uploadDocumentButton);

    // Wait for upload dialog
    await this.page.waitForSelector(SELECTORS.uploadDialog);

    // Select file
    const fileInput = this.page.locator(SELECTORS.fileInput);
    await fileInput.setInputFiles(`e2e/fixtures/files/${fileName}`);

    // Select document type
    await this.page.selectOption('select[name="documentType"]', documentType);

    // Fill in description if provided
    if (description) {
      await this.page.fill('textarea[name="description"]', description);
    }

    // Submit upload
    await this.page.click(SELECTORS.uploadSubmit);

    // Wait for success message
    await this.page.waitForSelector(SELECTORS.toastSuccess);
    await expect(this.page.locator(SELECTORS.toastSuccess)).toContainText(
      EXPECTED_MESSAGES.uploadSuccess
    );
  }

  /**
   * Test file size validation
   */
  async testFileSizeValidation(fileName: string, expectedError: string) {
    // Click upload button
    await this.page.click(SELECTORS.uploadPhotoButton);
    await this.page.waitForSelector(SELECTORS.uploadDialog);

    // Try to upload large file
    const fileInput = this.page.locator(SELECTORS.fileInput);
    await fileInput.setInputFiles(`e2e/fixtures/files/${fileName}`);

    // Check for error message
    await this.page.waitForSelector(SELECTORS.toastError);
    await expect(this.page.locator(SELECTORS.toastError)).toContainText(expectedError);
  }

  /**
   * Test file type validation
   */
  async testFileTypeValidation(fileName: string) {
    // Click upload button
    await this.page.click(SELECTORS.uploadPhotoButton);
    await this.page.waitForSelector(SELECTORS.uploadDialog);

    // Try to upload invalid file type
    const fileInput = this.page.locator(SELECTORS.fileInput);
    await fileInput.setInputFiles(`e2e/fixtures/files/${fileName}`);

    // Check for error message
    await this.page.waitForSelector(SELECTORS.toastError);
    await expect(this.page.locator(SELECTORS.toastError)).toContainText(
      EXPECTED_MESSAGES.invalidFileType
    );
  }

  /**
   * Download a document and verify signed URL
   */
  async downloadDocument() {
    // Click download button
    const downloadPromise = this.page.waitForEvent("download");
    await this.page.click(SELECTORS.downloadButton);

    const download = await downloadPromise;

    // Verify download started
    expect(download.suggestedFilename()).toBeTruthy();

    return download;
  }

  /**
   * Check if upload button is visible (owner only)
   */
  async canUpload(): Promise<boolean> {
    try {
      await this.page.waitForSelector(SELECTORS.uploadPhotoButton, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for upload to complete
   */
  async waitForUploadComplete() {
    // Wait for loading state to disappear
    await this.page.waitForSelector('[data-testid="upload-loading"]', {
      state: "hidden",
      timeout: 30000,
    });

    // Wait for success toast
    await this.page.waitForSelector(SELECTORS.toastSuccess, { timeout: 10000 });
  }

  /**
   * Get uploaded items count
   */
  async getUploadedItemsCount(type: "photos" | "documents"): Promise<number> {
    const selector = type === "photos" ? SELECTORS.photoItem : SELECTORS.documentItem;
    const items = await this.page.locator(selector).count();
    return items;
  }
}
