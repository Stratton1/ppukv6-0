# Property Passport UK v6 - Accessibility and UX

## Purpose
This document provides comprehensive guidelines for accessibility, user experience, and inclusive design in Property Passport UK v6.

## How to Use
- **Developers**: Implementation guidelines for accessible components
- **Designers**: UX patterns and accessibility requirements
- **Contributors**: Quality standards for user experience

## Table of Contents
1. [Accessibility Standards](#accessibility-standards)
2. [UX Patterns](#ux-patterns)
3. [Component Guidelines](#component-guidelines)
4. [Responsive Design](#responsive-design)
5. [User Testing](#user-testing)
6. [Implementation Checklist](#implementation-checklist)

## Accessibility Standards

### WCAG 2.1 AA Compliance
Property Passport UK v6 must meet WCAG 2.1 AA standards:

#### Perceivable
- **Text Alternatives**: All images have alt text
- **Captions**: Video content has captions
- **Contrast**: Minimum 4.5:1 contrast ratio
- **Resizable Text**: Text can be resized up to 200%

#### Operable
- **Keyboard Accessible**: All functionality available via keyboard
- **No Seizures**: No content flashes more than 3 times per second
- **Navigation**: Clear navigation and focus management

#### Understandable
- **Readable**: Text is readable and understandable
- **Predictable**: Web pages appear and operate in predictable ways
- **Input Assistance**: Users are helped to avoid and correct mistakes

#### Robust
- **Compatible**: Content is compatible with assistive technologies
- **Valid**: Valid HTML and proper semantic structure

### Implementation Guidelines

#### 1. Semantic HTML
```typescript
// ✅ Good: Semantic HTML
<main>
  <header>
    <h1>Property Passport UK</h1>
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/search">Search</a></li>
      </ul>
    </nav>
  </header>
  
  <section aria-labelledby="properties-heading">
    <h2 id="properties-heading">Your Properties</h2>
    <div role="list" aria-label="Property list">
      {/* Property cards */}
    </div>
  </section>
</main>

// ❌ Bad: Non-semantic HTML
<div>
  <div>
    <div>Property Passport UK</div>
    <div>
      <div><div>Home</div></div>
      <div><div>Search</div></div>
    </div>
  </div>
</div>
```

#### 2. ARIA Labels and Descriptions
```typescript
// Form labels
<label htmlFor="email-input">Email Address</label>
<input
  id="email-input"
  type="email"
  aria-describedby="email-help"
  aria-required="true"
/>
<div id="email-help">We'll never share your email</div>

// Button descriptions
<button
  aria-label="Close dialog"
  aria-describedby="close-help"
>
  <X className="h-4 w-4" />
</button>
<div id="close-help" className="sr-only">
  Closes the current dialog
</div>

// Status messages
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Property saved successfully
</div>
```

#### 3. Focus Management
```typescript
// Focus trap for modals
const FocusTrap = ({ children, isActive }) => {
  const trapRef = useRef(null);
  
  useEffect(() => {
    if (isActive && trapRef.current) {
      const focusableElements = trapRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();
      
      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isActive]);
  
  return <div ref={trapRef}>{children}</div>;
};
```

#### 4. Color and Contrast
```css
/* Ensure sufficient contrast ratios */
.text-primary {
  color: hsl(var(--foreground)); /* 4.5:1 contrast */
}

.text-muted-foreground {
  color: hsl(var(--muted-foreground)); /* 4.5:1 contrast */
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .border {
    border-color: hsl(var(--border));
    border-width: 2px;
  }
}
```

## UX Patterns

### 1. Navigation Patterns

#### Breadcrumb Navigation
```typescript
const Breadcrumb = ({ items }) => (
  <nav aria-label="Breadcrumb">
    <ol className="flex items-center space-x-2">
      {items.map((item, index) => (
        <li key={item.href} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
          {index === items.length - 1 ? (
            <span aria-current="page" className="font-medium">
              {item.label}
            </span>
          ) : (
            <Link href={item.href} className="hover:underline">
              {item.label}
            </Link>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
```

#### Skip Links
```typescript
const SkipLinks = () => (
  <div className="sr-only focus-within:not-sr-only">
    <a
      href="#main-content"
      className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded"
    >
      Skip to main content
    </a>
    <a
      href="#navigation"
      className="absolute top-4 left-32 bg-primary text-primary-foreground px-4 py-2 rounded"
    >
      Skip to navigation
    </a>
  </div>
);
```

### 2. Form Patterns

#### Accessible Form Fields
```typescript
const FormField = ({ label, error, required, children, ...props }) => (
  <div className="space-y-2">
    <label
      htmlFor={props.id}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
    
    {children}
    
    {error && (
      <p
        id={`${props.id}-error`}
        className="text-sm text-destructive"
        role="alert"
        aria-live="polite"
      >
        {error}
      </p>
    )}
  </div>
);
```

#### Form Validation
```typescript
const useFormValidation = (schema) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = (values) => {
    try {
      schema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      const fieldErrors = {};
      error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
  };
  
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  return { errors, touched, validate, handleBlur };
};
```

### 3. Loading and Error States

#### Loading States
```typescript
const LoadingSpinner = ({ size = "default" }) => (
  <div
    className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${
      size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6"
    }`}
    role="status"
    aria-label="Loading"
  >
    <span className="sr-only">Loading...</span>
  </div>
);

const Skeleton = ({ className, ...props }) => (
  <div
    className={`animate-pulse rounded-md bg-muted ${className}`}
    {...props}
  />
);
```

#### Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="p-4 border border-destructive rounded-md">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-4">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 4. Data Display Patterns

#### Accessible Tables
```typescript
const DataTable = ({ columns, data, caption }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <caption className="text-left font-medium mb-4">
        {caption}
      </caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              className="text-left font-medium p-2 border-b"
              scope="col"
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={row.id || index}>
            {columns.map((column) => (
              <td key={column.key} className="p-2 border-b">
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
```

#### Accessible Cards
```typescript
const PropertyCard = ({ property, ...props }) => (
  <article
    className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
    aria-labelledby={`property-${property.id}-title`}
    {...props}
  >
    <header>
      <h3
        id={`property-${property.id}-title`}
        className="font-semibold text-lg"
      >
        {property.address}
      </h3>
      <p className="text-muted-foreground">
        {property.city}, {property.postcode}
      </p>
    </header>
    
    <div className="mt-4 space-y-2">
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="font-medium">Type</dt>
          <dd>{property.propertyType}</dd>
        </div>
        <div>
          <dt className="font-medium">Bedrooms</dt>
          <dd>{property.bedrooms || 'N/A'}</dd>
        </div>
      </dl>
    </div>
    
    <footer className="mt-4">
      <Link
        to={`/property/${property.id}`}
        className="inline-flex items-center text-primary hover:underline"
        aria-label={`View details for ${property.address}`}
      >
        View Details
        <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </footer>
  </article>
);
```

## Responsive Design

### 1. Mobile-First Approach
```css
/* Mobile styles (default) */
.container {
  padding: 1rem;
}

.grid {
  grid-template-columns: 1fr;
}

/* Tablet styles */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
  
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
  
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 2. Touch-Friendly Design
```typescript
// Minimum touch target size: 44px
const TouchButton = ({ children, ...props }) => (
  <button
    className="min-h-[44px] min-w-[44px] p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
    {...props}
  >
    {children}
  </button>
);

// Touch gestures
const useTouchGestures = () => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      // Handle swipe
    }
  };
  
  return { onTouchStart, onTouchMove, onTouchEnd };
};
```

### 3. Responsive Navigation
```typescript
const ResponsiveNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-primary" />
            <span className="text-xl font-bold">PPUK</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <Link to="/search" className="hover:text-primary">Search</Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isOpen && (
          <div id="mobile-menu" className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/search"
                className="block px-3 py-2 rounded-md hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                Search
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
```

## User Testing

### 1. Accessibility Testing Tools

#### Automated Testing
```typescript
// Jest + jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<PropertyCard {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Manual Testing Checklist
- [ ] **Keyboard Navigation**: All interactive elements accessible via keyboard
- [ ] **Screen Reader**: Content is properly announced
- [ ] **Color Contrast**: Sufficient contrast for all text
- [ ] **Focus Indicators**: Clear focus indicators visible
- [ ] **Form Labels**: All form fields have proper labels
- [ ] **Error Messages**: Errors are clearly communicated
- [ ] **Loading States**: Loading states are announced
- [ ] **Responsive**: Works on all screen sizes

### 2. User Testing Scenarios

#### Property Search Flow
```typescript
// Test scenario: User searches for property
const searchScenario = {
  name: "Property Search",
  steps: [
    "Navigate to home page",
    "Enter postcode in search field",
    "Submit search",
    "Review search results",
    "Click on property card",
    "View property details"
  ],
  accessibilityChecks: [
    "Search field has proper label",
    "Results are announced to screen reader",
    "Property cards are keyboard accessible",
    "Navigation is clear and logical"
  ]
};
```

#### Document Upload Flow
```typescript
// Test scenario: User uploads document
const uploadScenario = {
  name: "Document Upload",
  steps: [
    "Navigate to property page",
    "Click upload document button",
    "Select file from device",
    "Choose document type",
    "Add description",
    "Submit upload",
    "Verify upload success"
  ],
  accessibilityChecks: [
    "File input has proper label",
    "Progress is announced",
    "Success/error messages are clear",
    "Form validation is accessible"
  ]
};
```

## Implementation Checklist

### 1. Component Checklist
- [ ] **Semantic HTML**: Use proper HTML elements
- [ ] **ARIA Labels**: Add appropriate ARIA attributes
- [ ] **Keyboard Access**: Ensure keyboard navigation
- [ ] **Focus Management**: Manage focus properly
- [ ] **Color Contrast**: Meet WCAG contrast requirements
- [ ] **Text Alternatives**: Provide alt text for images
- [ ] **Form Labels**: Associate labels with form controls
- [ ] **Error Handling**: Provide clear error messages

### 2. Page Checklist
- [ ] **Page Title**: Descriptive page titles
- [ ] **Heading Structure**: Logical heading hierarchy
- [ ] **Skip Links**: Provide skip navigation
- [ ] **Landmarks**: Use proper ARIA landmarks
- [ ] **Language**: Specify page language
- [ ] **Meta Tags**: Include necessary meta information

### 3. Testing Checklist
- [ ] **Automated Testing**: Run accessibility tests
- [ ] **Manual Testing**: Test with keyboard only
- [ ] **Screen Reader**: Test with screen reader
- [ ] **Color Blindness**: Test color combinations
- [ ] **Mobile Testing**: Test on mobile devices
- [ ] **Performance**: Ensure good performance

## Next Steps

1. **Review [PERFORMANCE_AND_DX.md](./PERFORMANCE_AND_DX.md)** for optimization
2. **Check [TESTING_AND_QUALITY.md](./TESTING_AND_QUALITY.md)** for testing strategies
3. **Read [ONBOARDING_PATH.md](./ONBOARDING_PATH.md)** for development workflow
4. **See [RISKS_AND_MITIGATIONS.md](./RISKS_AND_MITIGATIONS.md)** for security considerations

## References
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)
