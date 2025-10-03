import { Page, expect } from '@playwright/test';
import { TEST_PROPERTIES, SELECTORS } from '../fixtures/test-data';

/**
 * Property-related helper functions for E2E tests
 */
export class PropertyHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to a property passport page
   */
  async goToPropertyPassport(propertyId: string) {
    await this.page.goto(`/passport/${propertyId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to property passport via dashboard
   */
  async goToPropertyFromDashboard(propertyId: string) {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
    
    // Click on the property card
    const propertyCard = this.page.locator(`[data-testid="property-card-${propertyId}"]`);
    await expect(propertyCard).toBeVisible();
    await propertyCard.click();
    
    // Wait for navigation
    await this.page.waitForURL(`/passport/${propertyId}`);
  }

  /**
   * Claim a property (owner only)
   */
  async claimProperty(propertyId: string) {
    await this.page.goto('/claim');
    await this.page.waitForLoadState('networkidle');
    
    // Fill in property details (simplified for testing)
    await this.page.fill('input[name="address_line_1"]', 'Test Address');
    await this.page.fill('input[name="city"]', 'Test City');
    await this.page.fill('input[name="postcode"]', 'TE1 1ST');
    await this.page.selectOption('select[name="property_type"]', 'detached');
    await this.page.selectOption('select[name="tenure"]', 'freehold');
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for success
    await this.page.waitForURL('/dashboard');
  }

  /**
   * Switch to a specific tab in property passport
   */
  async switchToTab(tabName: 'overview' | 'documents' | 'photos' | 'data' | 'history' | 'insights') {
    const tabSelector = `[data-testid="${tabName}-tab"]`;
    await this.page.click(tabSelector);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if property passport page is loaded correctly
   */
  async verifyPropertyPassportLoaded() {
    // Check for passport tabs
    await expect(this.page.locator(SELECTORS.passportTabs)).toBeVisible();
    
    // Check for overview tab content
    await this.switchToTab('overview');
    await expect(this.page.locator('[data-testid="property-details"]')).toBeVisible();
  }

  /**
   * Get property details from the page
   */
  async getPropertyDetails() {
    await this.switchToTab('overview');
    
    const details = await this.page.locator('[data-testid="property-details"]').textContent();
    return details;
  }

  /**
   * Check if user can see upload controls (owner only)
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
   * Wait for property data to load
   */
  async waitForPropertyData() {
    // Wait for property details to be visible
    await this.page.waitForSelector('[data-testid="property-details"]', { timeout: 10000 });
    
    // Wait for any loading states to complete
    await this.page.waitForLoadState('networkidle');
  }
}
