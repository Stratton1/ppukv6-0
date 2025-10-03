import { Page, expect } from '@playwright/test';
import { TEST_USERS, SELECTORS } from '../fixtures/test-data';

/**
 * Authentication helper functions for E2E tests
 */
export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * Login as a test user
   */
  async loginAs(user: 'owner' | 'buyer') {
    const userData = TEST_USERS[user];
    
    // Navigate to login page
    await this.page.goto('/login');
    
    // Fill in credentials
    await this.page.fill(SELECTORS.emailInput, userData.email);
    await this.page.fill(SELECTORS.passwordInput, userData.password);
    
    // Submit form
    await this.page.click(SELECTORS.submitButton);
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('/dashboard');
    
    // Verify login success
    await expect(this.page.locator(SELECTORS.navbar)).toContainText(userData.fullName);
  }

  /**
   * Login using test login page (faster for testing)
   */
  async quickLoginAs(user: 'owner' | 'buyer') {
    await this.page.goto('/test-login');
    
    const buttonSelector = user === 'owner' 
      ? '[data-testid="login-as-owner"]'
      : '[data-testid="login-as-buyer"]';
    
    await this.page.click(buttonSelector);
    
    // Wait for redirect
    await this.page.waitForURL('/dashboard');
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.click(SELECTORS.logoutButton);
    await this.page.waitForURL('/');
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector(SELECTORS.navbar, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current user info from navbar
   */
  async getCurrentUser() {
    const navbar = this.page.locator(SELECTORS.navbar);
    const userText = await navbar.textContent();
    
    if (userText?.includes('Test Owner')) {
      return 'owner';
    } else if (userText?.includes('Test Buyer')) {
      return 'buyer';
    }
    
    return null;
  }

  /**
   * Ensure test environment is seeded
   */
  async ensureTestDataSeeded() {
    await this.page.goto('/test-login');
    
    // Wait for seeding to complete
    await this.page.waitForSelector('[data-testid="seeding-complete"]', { timeout: 30000 });
    
    // Check for success message
    const successMessage = this.page.locator('text=Test users ready!');
    await expect(successMessage).toBeVisible();
  }
}
