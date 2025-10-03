/**
 * Test data fixtures for PPUK E2E tests
 */

export const TEST_USERS = {
  owner: {
    email: 'owner@ppuk.test',
    password: 'password123',
    fullName: 'Test Owner',
    role: 'owner'
  },
  buyer: {
    email: 'buyer@ppuk.test', 
    password: 'password123',
    fullName: 'Test Buyer',
    role: 'buyer'
  }
} as const;

export const TEST_PROPERTIES = {
  dev001: {
    id: '11111111-1111-1111-1111-111111111111',
    ppukReference: 'PPUK-DEV001',
    address: '123 Victoria Street',
    city: 'London',
    postcode: 'SW1A 1AA'
  },
  dev002: {
    id: '22222222-2222-2222-2222-222222222222', 
    ppukReference: 'PPUK-DEV002',
    address: '456 Oxford Road',
    city: 'Manchester',
    postcode: 'M1 2AB'
  }
} as const;

export const TEST_FILES = {
  smallImage: {
    name: 'test-photo.jpg',
    size: 1024 * 1024, // 1MB
    type: 'image/jpeg'
  },
  largeImage: {
    name: 'large-photo.jpg', 
    size: 6 * 1024 * 1024, // 6MB (exceeds 5MB limit)
    type: 'image/jpeg'
  },
  smallDocument: {
    name: 'test-document.pdf',
    size: 2 * 1024 * 1024, // 2MB
    type: 'application/pdf'
  },
  largeDocument: {
    name: 'large-document.pdf',
    size: 12 * 1024 * 1024, // 12MB (exceeds 10MB limit)
    type: 'application/pdf'
  },
  invalidFile: {
    name: 'test-file.exe',
    size: 1024 * 1024, // 1MB
    type: 'application/x-executable'
  }
} as const;

export const TEST_UPLOADS = {
  photo: {
    caption: 'Test Kitchen Photo',
    roomType: 'Kitchen'
  },
  document: {
    type: 'epc',
    description: 'Current EPC rating B'
  }
} as const;

export const SELECTORS = {
  // Navigation
  navbar: '[data-testid="navbar"]',
  loginButton: '[data-testid="login-button"]',
  logoutButton: '[data-testid="logout-button"]',
  dashboardLink: '[data-testid="dashboard-link"]',
  
  // Auth
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'button[type="submit"]',
  
  // Property Cards
  propertyCard: '[data-testid="property-card"]',
  claimButton: '[data-testid="claim-button"]',
  
  // Property Passport
  passportTabs: '[data-testid="passport-tabs"]',
  overviewTab: '[data-testid="overview-tab"]',
  documentsTab: '[data-testid="documents-tab"]',
  photosTab: '[data-testid="photos-tab"]',
  dataTab: '[data-testid="data-tab"]',
  
  // Upload Components
  uploadPhotoButton: '[data-testid="upload-photo-button"]',
  uploadDocumentButton: '[data-testid="upload-document-button"]',
  fileInput: 'input[type="file"]',
  uploadDialog: '[data-testid="upload-dialog"]',
  uploadSubmit: '[data-testid="upload-submit"]',
  
  // Photo Gallery
  photoGrid: '[data-testid="photo-grid"]',
  photoItem: '[data-testid="photo-item"]',
  lightbox: '[data-testid="lightbox"]',
  
  // Documents
  documentList: '[data-testid="document-list"]',
  documentItem: '[data-testid="document-item"]',
  downloadButton: '[data-testid="download-button"]',
  
  // Toast notifications
  toast: '[data-testid="toast"]',
  toastSuccess: '[data-testid="toast-success"]',
  toastError: '[data-testid="toast-error"]'
} as const;

export const EXPECTED_MESSAGES = {
  uploadSuccess: 'uploaded successfully',
  uploadError: 'Upload failed',
  fileTooLarge: 'File too large',
  invalidFileType: 'Invalid file type',
  notAuthenticated: 'Not authenticated',
  rlsError: 'RLS policy violation'
} as const;
