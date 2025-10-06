# Property Passport UK v6 - Testing and Quality

## Purpose
This document provides comprehensive guidance on testing strategies, quality assurance, and development best practices for Property Passport UK v6.

## How to Use
- **Developers**: Testing implementation and quality guidelines
- **Contributors**: Quality standards and testing requirements
- **Maintainers**: Quality assurance processes and metrics

## Table of Contents
1. [Testing Strategy](#testing-strategy)
2. [Testing Tools](#testing-tools)
3. [Test Types](#test-types)
4. [Quality Standards](#quality-standards)
5. [Continuous Integration](#continuous-integration)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)

## Testing Strategy

### Testing Pyramid
```
    /\
   /  \     E2E Tests (Playwright)
  /____\    
 /      \   Integration Tests (React Testing Library)
/________\  
/          \ Unit Tests (Jest/Vitest)
/____________\
```

### Testing Levels
1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: Component interactions and API calls
3. **End-to-End Tests**: Complete user workflows
4. **Visual Tests**: UI consistency and accessibility

## Testing Tools

### Current Setup
- **Playwright**: End-to-end testing
- **ESLint**: Code linting and quality
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

### Recommended Additions
- **Vitest**: Unit testing framework
- **React Testing Library**: Component testing
- **MSW**: API mocking
- **Storybook**: Component documentation and testing

## Test Types

### 1. Unit Tests
**Purpose**: Test individual functions and components in isolation

#### Component Testing
```typescript
// src/components/__tests__/PropertyCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PropertyCard } from '../PropertyCard';

describe('PropertyCard', () => {
  const mockProperty = {
    id: '1',
    address: '123 Test Street',
    postcode: 'SW1A 1AA',
    city: 'London',
    propertyType: 'detached',
    bedrooms: 3,
    bathrooms: 2,
    floorArea: 120,
    epcRating: 'B',
    tenure: 'freehold',
    ppukReference: 'PPUK-001'
  };

  it('renders property information correctly', () => {
    render(<PropertyCard {...mockProperty} />);
    
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.getByText('London, SW1A 1AA')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // bedrooms
    expect(screen.getByText('2')).toBeInTheDocument(); // bathrooms
    expect(screen.getByText('120 m²')).toBeInTheDocument();
    expect(screen.getByText('EPC B')).toBeInTheDocument();
  });

  it('navigates to property details on click', () => {
    render(<PropertyCard {...mockProperty} />);
    
    const card = screen.getByRole('link');
    expect(card).toHaveAttribute('href', '/property/1');
  });
});
```

#### Hook Testing
```typescript
// src/hooks/__tests__/useProperty.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProperty } from '../useProperty';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useProperty', () => {
  it('fetches property data successfully', async () => {
    const { result } = renderHook(() => useProperty('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

### 2. Integration Tests
**Purpose**: Test component interactions and API integrations

#### API Integration Testing
```typescript
// src/integrations/__tests__/supabase.test.ts
import { supabase } from '../supabase/client';

describe('Supabase Integration', () => {
  it('connects to Supabase successfully', async () => {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('handles authentication correctly', async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Should not error even if no user is logged in
    expect(error).toBeNull();
  });
});
```

#### Form Integration Testing
```typescript
// src/pages/__tests__/ClaimProperty.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClaimProperty from '../ClaimProperty';

const renderWithProviders = (component) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ClaimProperty', () => {
  it('submits property claim form successfully', async () => {
    renderWithProviders(<ClaimProperty />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/postcode/i), {
      target: { value: 'SW1A 1AA' }
    });
    fireEvent.change(screen.getByLabelText(/address/i), {
      target: { value: '123 Test Street' }
    });
    fireEvent.change(screen.getByLabelText(/city/i), {
      target: { value: 'London' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/property claimed successfully/i)).toBeInTheDocument();
    });
  });
});
```

### 3. End-to-End Tests
**Purpose**: Test complete user workflows

#### User Authentication Flow
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
  });

  test('user can register new account', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('[data-testid="full-name"]', 'Test User');
    await page.fill('[data-testid="email"]', 'newuser@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.selectOption('[data-testid="role-select"]', 'owner');
    await page.click('[data-testid="register-button"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
});
```

#### Property Management Flow
```typescript
// tests/e2e/property.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Property Management', () => {
  test('user can claim a property', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to claim property
    await page.goto('/claim');
    
    // Fill property details
    await page.fill('[data-testid="postcode"]', 'SW1A 1AA');
    await page.fill('[data-testid="address-line-1"]', '123 Test Street');
    await page.fill('[data-testid="city"]', 'London');
    await page.selectOption('[data-testid="property-type"]', 'detached');
    await page.fill('[data-testid="bedrooms"]', '3');
    await page.fill('[data-testid="bathrooms"]', '2');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('user can upload property documents', async ({ page }) => {
    // Login and navigate to property
    await page.goto('/property/1');
    
    // Upload document
    const fileInput = page.locator('[data-testid="document-upload"]');
    await fileInput.setInputFiles('tests/fixtures/sample-document.pdf');
    
    await page.selectOption('[data-testid="document-type"]', 'epc');
    await page.fill('[data-testid="document-description"]', 'EPC Certificate');
    await page.click('[data-testid="upload-button"]');
    
    // Verify upload success
    await expect(page.locator('[data-testid="document-list"]')).toContainText('sample-document.pdf');
  });
});
```

### 4. Visual Testing
**Purpose**: Ensure UI consistency and accessibility

#### Storybook Stories
```typescript
// src/components/PropertyCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { PropertyCard } from './PropertyCard';

const meta: Meta<typeof PropertyCard> = {
  title: 'Components/PropertyCard',
  component: PropertyCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: '1',
    address: '123 Test Street',
    postcode: 'SW1A 1AA',
    city: 'London',
    propertyType: 'detached',
    bedrooms: 3,
    bathrooms: 2,
    floorArea: 120,
    epcRating: 'B',
    tenure: 'freehold',
    ppukReference: 'PPUK-001'
  },
};

export const WithPhoto: Story = {
  args: {
    ...Default.args,
    frontPhotoUrl: 'https://example.com/property-photo.jpg'
  },
};

export const Minimal: Story = {
  args: {
    id: '2',
    address: '456 Another Street',
    postcode: 'M1 1AA',
    city: 'Manchester',
    propertyType: 'flat',
    tenure: 'leasehold',
    ppukReference: 'PPUK-002'
  },
};
```

## Quality Standards

### 1. Code Quality

#### ESLint Configuration
```javascript
// eslint.config.js
export default [
  {
    rules: {
      // React specific rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      
      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
```

#### Prettier Configuration
```javascript
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 2. Type Safety

#### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### Type Coverage
```bash
# Check type coverage
npx type-coverage --detail

# Target: 95%+ type coverage
```

### 3. Performance Standards

#### Bundle Size Limits
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 1MB
  },
});
```

#### Performance Budgets
- **Initial Bundle**: < 500KB
- **Total Bundle**: < 2MB
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

### 4. Accessibility Standards

#### WCAG AA Compliance
```typescript
// Accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<PropertyCard {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Keyboard Navigation
```typescript
// Keyboard navigation testing
test('should be navigable with keyboard', async () => {
  render(<PropertyCard {...props} />);
  
  const card = screen.getByRole('link');
  card.focus();
  expect(card).toHaveFocus();
  
  fireEvent.keyDown(card, { key: 'Enter' });
  // Verify navigation
});
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run typecheck
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Quality Gates
- **Linting**: No ESLint errors
- **Type Checking**: No TypeScript errors
- **Test Coverage**: > 80%
- **E2E Tests**: All critical paths passing
- **Performance**: Meets performance budgets
- **Accessibility**: No a11y violations

## Performance Testing

### 1. Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check for unused dependencies
npm run unused:deps
npm run unused:exports
```

### 2. Lighthouse Testing
```typescript
// tests/performance/lighthouse.test.ts
import { test, expect } from '@playwright/test';

test('should meet performance standards', async ({ page }) => {
  await page.goto('/');
  
  const lighthouse = await page.evaluate(() => {
    return new Promise((resolve) => {
      // Lighthouse audit
      resolve({
        performance: 90,
        accessibility: 95,
        bestPractices: 90,
        seo: 85
      });
    });
  });
  
  expect(lighthouse.performance).toBeGreaterThan(80);
  expect(lighthouse.accessibility).toBeGreaterThan(90);
});
```

### 3. Load Testing
```typescript
// tests/performance/load.test.ts
import { test, expect } from '@playwright/test';

test('should handle multiple concurrent users', async ({ browser }) => {
  const contexts = await Promise.all(
    Array(10).fill(0).map(() => browser.newContext())
  );
  
  const pages = await Promise.all(
    contexts.map(context => context.newPage())
  );
  
  // Simulate concurrent users
  await Promise.all(
    pages.map(page => page.goto('/'))
  );
  
  // Verify all pages load successfully
  for (const page of pages) {
    await expect(page.locator('body')).toBeVisible();
  }
});
```

## Security Testing

### 1. Authentication Testing
```typescript
// tests/security/auth.test.ts
import { test, expect } from '@playwright/test';

test('should protect authenticated routes', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Should redirect to login
  await expect(page).toHaveURL('/login');
});

test('should handle invalid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'invalid@example.com');
  await page.fill('[data-testid="password-input"]', 'wrongpassword');
  await page.click('[data-testid="login-button"]');
  
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});
```

### 2. Input Validation Testing
```typescript
// tests/security/validation.test.ts
test('should validate file uploads', async ({ page }) => {
  await page.goto('/property/1');
  
  // Try to upload invalid file
  const fileInput = page.locator('[data-testid="document-upload"]');
  await fileInput.setInputFiles('tests/fixtures/malicious-file.exe');
  
  await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid file type');
});
```

### 3. XSS Testing
```typescript
// tests/security/xss.test.ts
test('should prevent XSS attacks', async ({ page }) => {
  const maliciousScript = '<script>alert("XSS")</script>';
  
  await page.goto(`/search?q=${encodeURIComponent(maliciousScript)}`);
  
  // Should not execute script
  await expect(page.locator('script')).toHaveCount(0);
});
```

## Next Steps

1. **Review [ACCESSIBILITY_AND_UX.md](./ACCESSIBILITY_AND_UX.md)** for a11y guidelines
2. **Check [PERFORMANCE_AND_DX.md](./PERFORMANCE_AND_DX.md)** for optimization
3. **Read [RISKS_AND_MITIGATIONS.md](./RISKS_AND_MITIGATIONS.md)** for security
4. **See [ONBOARDING_PATH.md](./ONBOARDING_PATH.md)** for development workflow

## References
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Storybook Documentation](https://storybook.js.org/docs/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
