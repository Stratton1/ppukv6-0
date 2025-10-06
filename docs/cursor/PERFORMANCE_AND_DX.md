# Property Passport UK v6 - Performance and Developer Experience

## Purpose
This document provides comprehensive guidance on performance optimization, developer experience, and development workflow for Property Passport UK v6.

## How to Use
- **Developers**: Performance optimization and development workflow
- **Contributors**: Development environment and best practices
- **Maintainers**: Performance monitoring and optimization strategies

## Table of Contents
1. [Performance Optimization](#performance-optimization)
2. [Developer Experience](#developer-experience)
3. [Build Optimization](#build-optimization)
4. [Monitoring and Analytics](#monitoring-and-analytics)
5. [Development Workflow](#development-workflow)
6. [VS Code Configuration](#vs-code-configuration)

## Performance Optimization

### 1. Bundle Optimization

#### Code Splitting
```typescript
// Route-based code splitting
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PropertyPassport = lazy(() => import('./pages/PropertyPassport'));

// Component-based code splitting
const DocumentUploader = lazy(() => import('./components/DocumentUploader'));
const PhotoGallery = lazy(() => import('./components/PhotoGallery'));

// Library splitting
const vendorChunks = {
  react: ['react', 'react-dom'],
  supabase: ['@supabase/supabase-js'],
  ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  utils: ['date-fns', 'clsx', 'tailwind-merge']
};
```

#### Tree Shaking
```typescript
// Import only what you need
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Avoid importing entire libraries
// ❌ Bad
import * as _ from 'lodash';

// ✅ Good
import { debounce } from 'lodash/debounce';
```

#### Dynamic Imports
```typescript
// Lazy load heavy components
const Chart = lazy(() => import('./components/Chart'));
const Map = lazy(() => import('./components/Map'));

// Conditional loading
const loadChart = () => import('./components/Chart');

const PropertyAnalytics = () => {
  const [showChart, setShowChart] = useState(false);
  const [ChartComponent, setChartComponent] = useState(null);
  
  const handleShowChart = async () => {
    if (!ChartComponent) {
      const { default: Chart } = await loadChart();
      setChartComponent(() => Chart);
    }
    setShowChart(true);
  };
  
  return (
    <div>
      <button onClick={handleShowChart}>Show Chart</button>
      {showChart && ChartComponent && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <ChartComponent />
        </Suspense>
      )}
    </div>
  );
};
```

### 2. React Performance

#### Memoization
```typescript
// Memoize expensive components
const PropertyCard = memo(({ property, onSelect }) => {
  return (
    <div onClick={() => onSelect(property.id)}>
      <h3>{property.address}</h3>
      <p>{property.city}</p>
    </div>
  );
});

// Memoize expensive calculations
const PropertyList = ({ properties, filters }) => {
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      return filters.every(filter => filter(property));
    });
  }, [properties, filters]);
  
  return (
    <div>
      {filteredProperties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
};

// Memoize callbacks
const PropertyForm = ({ onSubmit }) => {
  const handleSubmit = useCallback((data) => {
    onSubmit(data);
  }, [onSubmit]);
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

#### Virtual Scrolling
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedPropertyList = ({ properties }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <PropertyCard property={properties[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={properties.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 3. Image Optimization

#### Lazy Loading
```typescript
const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} {...props}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
```

#### Responsive Images
```typescript
const ResponsiveImage = ({ src, alt, sizes, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState('');
  
  useEffect(() => {
    const updateSrc = () => {
      const width = window.innerWidth;
      let newSrc = src;
      
      if (width < 768) {
        newSrc = src.replace('.jpg', '-mobile.jpg');
      } else if (width < 1024) {
        newSrc = src.replace('.jpg', '-tablet.jpg');
      }
      
      setCurrentSrc(newSrc);
    };
    
    updateSrc();
    window.addEventListener('resize', updateSrc);
    return () => window.removeEventListener('resize', updateSrc);
  }, [src]);
  
  return (
    <img
      src={currentSrc}
      alt={alt}
      sizes={sizes}
      {...props}
    />
  );
};
```

### 4. API Optimization

#### Request Deduplication
```typescript
// TanStack Query automatically deduplicates requests
const useProperty = (id) => {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchProperty(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

#### Pagination
```typescript
const useProperties = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['properties', page, limit],
    queryFn: () => fetchProperties({ page, limit }),
    keepPreviousData: true,
  });
};
```

#### Background Updates
```typescript
const usePropertyWithBackgroundUpdate = (id) => {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchProperty(id),
    refetchInterval: 30 * 1000, // 30 seconds
    refetchIntervalInBackground: true,
  });
};
```

## Developer Experience

### 1. Development Tools

#### Hot Module Replacement
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    strictPort: false,
    hmr: {
      overlay: true,
    },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

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
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 2. Code Quality Tools

#### ESLint Configuration
```javascript
// eslint.config.js
export default [
  {
    rules: {
      // Performance rules
      'react/jsx-no-bind': 'warn',
      'react/jsx-no-constructed-context-values': 'error',
      'react/no-array-index-key': 'warn',
      
      // Code quality
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // React specific
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
```

#### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid"
}
```

### 3. Development Scripts

#### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "unused:exports": "ts-prune",
    "unused:deps": "depcheck",
    "analyze": "vite-bundle-analyzer dist",
    "test:unit": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage"
  }
}
```

## Build Optimization

### 1. Vite Configuration

#### Production Build
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 8080,
    strictPort: false,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check for unused dependencies
npm run unused:deps
npm run unused:exports
```

### 2. Asset Optimization

#### Image Optimization
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { ViteImageOptimize } from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    ViteImageOptimize({
      gifsicle: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.65, 0.8] },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: false },
        ],
      },
    }),
  ],
});
```

#### CSS Optimization
```typescript
// tailwind.config.ts
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      // Custom theme
    },
  },
  plugins: [],
  // Purge unused CSS in production
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: ['./src/**/*.{ts,tsx,js,jsx}'],
  },
};
```

## Monitoring and Analytics

### 1. Performance Monitoring

#### Web Vitals
```typescript
// src/lib/analytics.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric) => {
  // Send to your analytics service
  console.log(metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### Error Tracking
```typescript
// src/lib/error-tracking.ts
export const trackError = (error: Error, context?: any) => {
  console.error('Error tracked:', error, context);
  
  // Send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket, etc.
  }
};

// Global error handler
window.addEventListener('error', (event) => {
  trackError(event.error, { type: 'javascript' });
});

window.addEventListener('unhandledrejection', (event) => {
  trackError(event.reason, { type: 'promise' });
});
```

### 2. User Analytics

#### Page Views
```typescript
// src/lib/analytics.ts
export const trackPageView = (path: string) => {
  console.log('Page view:', path);
  
  // Send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Google Analytics, Mixpanel, etc.
  }
};

// Track in React Router
const App = () => {
  const location = useLocation();
  
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);
  
  return <Router>...</Router>;
};
```

#### User Interactions
```typescript
// src/lib/analytics.ts
export const trackEvent = (event: string, properties?: any) => {
  console.log('Event tracked:', event, properties);
  
  // Send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Analytics service
  }
};

// Usage in components
const PropertyCard = ({ property }) => {
  const handleClick = () => {
    trackEvent('property_card_clicked', {
      property_id: property.id,
      property_type: property.type,
    });
  };
  
  return <div onClick={handleClick}>...</div>;
};
```

## Development Workflow

### 1. Git Workflow

#### Branch Strategy
```bash
# Feature branches
git checkout -b feature/property-search
git checkout -b feature/document-upload
git checkout -b feature/user-dashboard

# Bug fixes
git checkout -b fix/authentication-issue
git checkout -b fix/performance-optimization

# Hotfixes
git checkout -b hotfix/security-patch
```

#### Commit Messages
```bash
# Conventional commits
git commit -m "feat: add property search functionality"
git commit -m "fix: resolve authentication redirect issue"
git commit -m "docs: update API documentation"
git commit -m "perf: optimize bundle size"
git commit -m "test: add unit tests for PropertyCard"
```

### 2. Code Review Process

#### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Performance impact considered
```

### 3. Deployment Process

#### Staging Deployment
```bash
# Deploy to staging
npm run build:staging
npm run deploy:staging

# Run smoke tests
npm run test:smoke
```

#### Production Deployment
```bash
# Deploy to production
npm run build:production
npm run deploy:production

# Monitor deployment
npm run monitor:deployment
```

## VS Code Configuration

### 1. Extensions

#### Recommended Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "ms-playwright.playwright"
  ]
}
```

### 2. Settings

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### 3. Workspace Configuration

#### Launch Configuration
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:8080",
      "webRoot": "${workspaceFolder}/src"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["--run"],
      "console": "integratedTerminal"
    }
  ]
}
```

## Next Steps

1. **Review [RISKS_AND_MITIGATIONS.md](./RISKS_AND_MITIGATIONS.md)** for security considerations
2. **Check [ONBOARDING_PATH.md](./ONBOARDING_PATH.md)** for development workflow
3. **Read [ROADMAP_AND_TASKS.md](./ROADMAP_AND_TASKS.md)** for project planning
4. **See [GLOSSARY.md](./GLOSSARY.md)** for terminology reference

## References
- [Vite Documentation](https://vitejs.dev/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Analysis](https://webpack.js.org/guides/code-splitting/)
- [VS Code Extensions](https://code.visualstudio.com/docs/editor/extension-marketplace)
