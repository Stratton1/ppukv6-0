# PPUKv6-0 - Perfect Project Structure

## 🏗️ **Architecture Overview**

This project follows a **Clean Architecture** pattern with clear separation of concerns, organized by functionality and access level.

## 📁 **Directory Structure**

```
PPUKv6-0/
├── 📄 README.md                    # Project overview & quick start
├── 📦 package.json                 # Dependencies & scripts
├── ⚙️ .env.example                 # Environment template
├── 🚫 .gitignore                   # Git exclusions
├── 🎨 components.json              # Shadcn/ui configuration
│
├── 🎯 src/                         # Source Code (Clean Architecture)
│   ├── 📱 components/              # Reusable UI Components
│   │   ├── 🎨 ui/                  # Shadcn/ui components (generated)
│   │   ├── 🏢 business/           # Domain-specific components
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyDataPanel.tsx
│   │   │   ├── PhotoGallery.tsx
│   │   │   ├── DocumentUploader.tsx
│   │   │   ├── PassportScore.tsx
│   │   │   └── APIPreviewCard.tsx
│   │   ├── 🏗️ layout/             # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   └── DevAuthBypass.tsx
│   │   └── 📤 index.ts            # Component exports
│   │
│   ├── 📄 pages/                   # Route Components (by access level)
│   │   ├── 🌐 public/            # Public pages (no auth required)
│   │   │   ├── Home.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   └── PropertyPassport.tsx
│   │   ├── 🔐 auth/              # Authentication pages
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Settings.tsx
│   │   ├── 📊 dashboard/          # User dashboard pages
│   │   │   ├── Dashboard.tsx
│   │   │   └── ClaimProperty.tsx
│   │   ├── 🛠️ dev/               # Development pages
│   │   │   ├── TestLogin.tsx
│   │   │   └── DebugStorage.tsx
│   │   ├── ❌ NotFound.tsx
│   │   ├── 🏠 Index.tsx
│   │   └── 📤 index.ts           # Page exports
│   │
│   ├── 🧠 lib/                    # Business Logic & Utilities
│   │   ├── 🌐 apis/              # API integrations
│   │   │   ├── external.ts
│   │   │   ├── property-api.ts
│   │   │   └── mockData.ts
│   │   ├── 🛠️ dev/               # Development utilities
│   │   │   └── devSeed.ts
│   │   ├── 🎣 hooks/             # Custom React hooks
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   └── 🔧 utils.ts           # Shared utilities
│   │
│   ├── 📝 types/                 # TypeScript definitions
│   │   └── api.ts
│   │
│   ├── 🔌 integrations/          # External service integrations
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   ├── 🎨 App.tsx                # Root component
│   ├── 🎨 App.css                # Global styles
│   ├── 🎨 index.css              # Tailwind imports
│   ├── 🚀 main.tsx               # Application entry point
│   └── 📝 vite-env.d.ts         # Vite type definitions
│
├── 🗄️ supabase/                   # Backend (Supabase)
│   ├── ⚙️ config.toml            # Supabase configuration
│   ├── 📊 migrations/            # Database migrations (chronological)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_storage_buckets.sql
│   │   ├── 003_media_table.sql
│   │   └── 004_rls_policies.sql
│   └── ⚡ functions/             # Edge Functions
│       ├── 🔧 shared/            # Shared utilities
│       │   ├── types.ts
│       │   ├── utils.ts
│       │   └── validation.ts
│       ├── 🌐 api/              # External API integrations
│       │   ├── epc/
│       │   ├── flood/
│       │   ├── hmlr/
│       │   ├── crime/
│       │   └── education/
│       └── 🛠️ dev/              # Development functions
│           ├── create-test-users/
│           ├── seed-dev-data/
│           └── seed-property-media/
│
├── 🛠️ dev/                       # Development Tools (Isolated)
│   ├── 📜 scripts/              # Development scripts
│   │   ├── 🗄️ database/        # Database utilities
│   │   │   ├── check-schema.sql
│   │   │   ├── setup-rls.sql
│   │   │   └── verify-setup.sql
│   │   ├── 🧪 testing/          # Test utilities
│   │   │   ├── run-manual-tests.js
│   │   │   └── test-connection.js
│   │   └── 🚀 deployment/       # Deployment scripts
│   │       └── deploy-edge-functions.sh
│   ├── 🧪 e2e/                  # End-to-end tests
│   │   ├── fixtures/
│   │   ├── tests/
│   │   └── utils/
│   └── 📚 docs/                # Development documentation
│       ├── setup/
│       ├── testing/
│       └── deployment/
│
├── ⚙️ config/                    # Configuration (by environment)
│   ├── 🛠️ development/         # Development config
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   ├── 🧪 testing/             # Testing config
│   │   ├── playwright.config.ts
│   │   └── eslint.config.js
│   └── 🚀 deployment/           # Deployment config
│       └── supabase/
│           └── config.toml
│
└── 🎨 assets/                    # Static Assets (by type)
    ├── 🌐 public/              # Public static assets
    │   ├── favicon.ico
    │   ├── robots.txt
    │   └── test-files/
    ├── 🖼️ images/              # Image assets
    └── 🎯 icons/               # Icon assets
```

## 🎯 **Design Principles**

### **1. Separation of Concerns**
- **Business Logic**: `src/lib/` - Pure business logic, no UI dependencies
- **UI Components**: `src/components/` - Reusable, composable UI elements
- **Pages**: `src/pages/` - Route-level components, organized by access level
- **Integrations**: `src/integrations/` - External service connections

### **2. Access Level Organization**
- **Public Pages**: No authentication required
- **Auth Pages**: Authentication flows
- **Dashboard Pages**: Authenticated user areas
- **Dev Pages**: Development and debugging tools

### **3. Development vs Production**
- **Production Code**: `src/` - Clean, optimized, production-ready
- **Development Tools**: `dev/` - Scripts, tests, documentation
- **Configuration**: `config/` - Environment-specific settings

### **4. Scalability**
- **Modular Components**: Easy to find and modify
- **Clear Boundaries**: Each directory has a single responsibility
- **Extensible**: Easy to add new features without restructuring

## 🚀 **Benefits of This Structure**

### **For Developers**
- **Fast Navigation**: Know exactly where to find any file
- **Clear Dependencies**: Import paths reflect architecture
- **Easy Testing**: Components are isolated and testable
- **Scalable**: Add new features without restructuring

### **For Maintainers**
- **Clear Ownership**: Each directory has a clear purpose
- **Easy Refactoring**: Changes are localized
- **Documentation**: Structure is self-documenting
- **Consistency**: All similar files are grouped together

### **For New Team Members**
- **Intuitive**: Structure matches mental model
- **Self-Documenting**: Directory names explain purpose
- **Consistent**: Same patterns throughout
- **Discoverable**: Easy to find examples and patterns

## 📋 **File Naming Conventions**

- **Components**: PascalCase (`PropertyCard.tsx`)
- **Pages**: PascalCase (`PropertyPassport.tsx`)
- **Utilities**: camelCase (`devSeed.ts`)
- **Config**: kebab-case (`vite.config.ts`)
- **Assets**: kebab-case (`test-photo.jpg`)

## 🔄 **Import Patterns**

```typescript
// Component imports
import { PropertyCard, Navbar } from '@/components';

// Page imports
import { Home, Dashboard } from '@/pages';

// Utility imports
import { devSeed } from '@/lib/dev/devSeed';
import { formatCurrency } from '@/lib/utils';

// Type imports
import type { PropertyData } from '@/types/api';
```

## 🎯 **Next Steps**

1. **Update Import Paths**: Update all imports to use new structure
2. **Update Build Scripts**: Ensure build process works with new structure
3. **Update Documentation**: Update all references to old paths
4. **Test Everything**: Ensure all functionality works with new structure

---

**This structure provides a solid foundation for a scalable, maintainable, and developer-friendly codebase.**
