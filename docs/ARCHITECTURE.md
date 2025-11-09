# Property Passport UK v6.0 - Architecture Documentation

**Last Updated:** 2025-01-10  
**Version:** 6.0.0

---

## 🏗️ System Architecture

### High-Level Overview

Property Passport UK is a **single-page application (SPA)** built with React, served via Vite, and backed by Supabase for database, authentication, and file storage.

```
┌─────────────────┐
│   React App     │  ← Frontend (Vite + React + TypeScript)
│   (Port 8080)   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   Supabase      │  ← Backend (PostgreSQL + Auth + Storage)
│   (Cloud)       │
└─────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Build Tool** | Vite 5.4 | Fast development & production builds |
| **Frontend Framework** | React 18.3 | UI library with hooks |
| **Language** | TypeScript 5.8 | Type-safe JavaScript |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **UI Components** | Shadcn UI + Radix UI | Accessible component primitives |
| **Routing** | React Router v6 | Client-side routing |
| **Data Fetching** | React Query 5.8 | Server state management |
| **Forms** | React Hook Form + Zod | Form handling & validation |
| **Backend** | Supabase | PostgreSQL, Auth, Storage, Edge Functions |
| **State Management** | Zustand 5.0 | Client-side state (minimal usage) |

---

## 📁 Project Structure

### Directory Organization

```
ppukv6-0/
├── docs/                          # Documentation
│   ├── implementation/            # Implementation details
│   ├── testing/                  # Testing guides
│   ├── ARCHITECTURE.md           # This file
│   ├── ROUTES.md                 # Route documentation
│   └── ...
├── scripts/                       # Utility scripts
│   ├── seed-dev-data.sql         # Database seeding
│   └── seed-supabase-users.js    # User creation
├── src/
│   ├── app/                      # App-level config
│   │   └── auth/                 # Auth guards & providers
│   ├── components/               # React components
│   │   ├── ui/                   # Shadcn UI components (75+)
│   │   ├── property/            # Property feature components
│   │   ├── auth/                # Auth components
│   │   ├── layout/              # Layout components
│   │   └── dev/                 # Dev tools
│   ├── hooks/                   # Custom React hooks
│   ├── integrations/             # Third-party integrations
│   │   └── supabase/            # Supabase types & client re-export
│   ├── lib/                     # Utilities
│   │   ├── apis/                # API clients & mocks
│   │   ├── env.ts               # Environment validation
│   │   ├── supabase/            # Canonical Supabase client
│   │   └── utils.ts             # General utilities
│   ├── pages/                   # Route pages
│   ├── App.tsx                  # Root component & routing
│   └── main.tsx                 # Entry point
├── supabase/                     # Supabase config
│   ├── functions/               # Edge functions
│   └── migrations/               # Database migrations
└── public/                       # Static assets
```

---

## 🔄 Data Flow

### Authentication Flow

```
User Login
    │
    ▼
AuthProvider (Context)
    │
    ├─► Check supabaseReady
    ├─► Initialize Supabase client
    ├─► Listen to auth state changes
    └─► Provide user context to app
         │
         ▼
    RequireAuth / RequireRole
         │
         ▼
    Protected Routes
```

### Data Fetching Flow

```
Component
    │
    ▼
React Query Hook
    │
    ├─► Check cache
    ├─► Fetch from Supabase
    └─► Update cache
         │
         ▼
    Component Re-renders
```

### File Upload Flow

```
DocumentUploader Component
    │
    ├─► Validate file (type, size)
    ├─► Generate file metadata
    └─► Upload to Supabase Storage
         │
         ├─► property-documents (private)
         └─► property-photos (public)
              │
              ▼
         Insert metadata into database
              │
              ▼
         Update UI with new file
```

---

## 🧩 Component Architecture

### Component Hierarchy

```
App
├── QueryClientProvider
├── AuthProvider
├── TooltipProvider
├── Toaster (Toast notifications)
├── BrowserRouter
│   ├── ImpersonationBar (dev only)
│   └── Routes
│       ├── Public Routes (/, /login, /register)
│       └── Protected Routes
│           ├── RequireAuth wrapper
│           └── Page Components
│               ├── Navbar (layout)
│               └── Feature Components
```

### Component Organization Principles

1. **Feature-Based**: Components grouped by feature (`property/`, `auth/`)
2. **Shared UI**: Reusable UI components in `ui/`
3. **Layout**: Layout components in `layout/`
4. **Dev Tools**: Development-only components in `dev/`

### Component Patterns

#### Page Components
- Located in `src/pages/`
- Handle routing and data fetching
- Compose feature components
- Example: `PropertyPassport.tsx`

#### Feature Components
- Located in `src/components/{feature}/`
- Encapsulate feature-specific logic
- Reusable across pages
- Example: `PropertyCard.tsx`, `DocumentUploader.tsx`

#### UI Components
- Located in `src/components/ui/`
- Shadcn UI components
- Primitive, reusable, accessible
- Example: `Button.tsx`, `Card.tsx`

---

## 🔐 Security Architecture

### Authentication

- **Provider**: Supabase Auth
- **Method**: Email/Password (JWT tokens)
- **Storage**: localStorage (with auto-refresh)
- **Guards**: `RequireAuth`, `RequireRole` components

### Authorization

- **Database**: Row Level Security (RLS) policies
- **Storage**: Bucket-level policies
- **Frontend**: Route guards + role checks

### Data Protection

- **Environment Variables**: Validated with Zod
- **File Uploads**: Type & size validation
- **API Keys**: Never exposed in frontend code
- **Secrets**: Stored in Supabase secrets (Edge Functions)

---

## 🗄️ Database Architecture

### Key Tables

- **profiles** - User profiles with roles
- **properties** - Property records
- **property_photos** - Photo metadata
- **documents** - Document metadata
- **activity** - Audit log (future)

### Relationships

```
profiles (1) ──< (many) properties
properties (1) ──< (many) property_photos
properties (1) ──< (many) documents
```

### RLS Policies

- **Public Read**: Property photos (public bucket)
- **Owner Write**: Property documents, photos (owner only)
- **Authenticated Read**: Properties, documents
- **Role-Based**: Admin, surveyor, agent access

---

## 🌐 API Architecture

### Current State

- **Mock APIs**: Placeholder data in `src/lib/apis/mockData.ts`
- **Future**: Real API clients for:
  - EPC Register API
  - Environment Agency Flood API
  - HMLR API
  - Planning Data API

### API Client Pattern

```typescript
// Future pattern
import { epcClient } from '@/lib/apis/epc';
const data = await epcClient.getByUPRN(uprn);
```

---

## 🎨 Styling Architecture

### Tailwind CSS

- **Approach**: Utility-first, mobile-first
- **Config**: `tailwind.config.ts`
- **Theme**: Custom colors (Navy Blue, Sage Green)
- **Dark Mode**: Supported via `next-themes` (future)

### Component Styling

- **UI Components**: Tailwind classes in Shadcn components
- **Feature Components**: Tailwind classes + component variants
- **No Inline Styles**: All styling via Tailwind

---

## 🧪 Testing Architecture

### Current State

- **Manual Testing**: Comprehensive test guides in `docs/testing/`
- **Test Users**: Seeded via Edge Functions
- **Test Data**: Dev properties with PPUK-DEV prefix

### Future Testing

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Component Tests**: Storybook (optional)

---

## 🚀 Build & Deployment

### Development

```bash
npm run dev        # Vite dev server (port 8080)
```

### Production Build

```bash
npm run build      # Vite production build
npm run preview    # Preview production build
```

### Build Output

- **Location**: `dist/`
- **Format**: Static files (HTML, CSS, JS)
- **Deployment**: Any static hosting (Vercel, Netlify, etc.)

---

## 📊 Performance Considerations

### Current Optimizations

- **Code Splitting**: Vite automatic code splitting
- **Image Optimization**: Future WebP conversion
- **Lazy Loading**: React.lazy for routes (future)
- **Caching**: React Query cache strategy

### Future Optimizations

- **Server Components**: Next.js migration (if needed)
- **Image CDN**: Supabase Storage CDN
- **Bundle Analysis**: Vite bundle analyzer
- **Performance Monitoring**: Web Vitals tracking

---

## 🔄 State Management

### Server State

- **Tool**: React Query
- **Cache Strategy**: Stale-while-revalidate
- **Refetch**: On window focus, network reconnect

### Client State

- **Tool**: Zustand (minimal usage)
- **Use Cases**: UI state, form state (React Hook Form)
- **Avoid**: Duplicating server state

### Form State

- **Tool**: React Hook Form
- **Validation**: Zod schemas
- **Pattern**: Controlled components

---

## 🛠️ Development Tools

### Code Quality

- **Linter**: ESLint 9.32
- **Formatter**: Prettier (via `.prettierrc`)
- **Type Checker**: TypeScript compiler

### Dev Tools

- **Debug Page**: `/debug/env` (dev only)
- **Test Login**: `/test-login`
- **Dev Auth Bypass**: Login page (dev only)
- **Impersonation Bar**: Dev user switching

---

## 📈 Scalability Considerations

### Current Limitations

- **Single Page App**: All routes client-side
- **No SSR**: No server-side rendering
- **API Mocks**: External APIs not yet integrated

### Future Scalability

- **API Gateway**: Centralized API client
- **Caching Layer**: Redis for API responses (future)
- **CDN**: Static asset CDN
- **Edge Functions**: Supabase Edge Functions for server logic

---

## 🔗 Integration Points

### Supabase

- **Database**: PostgreSQL via Supabase client
- **Auth**: Supabase Auth SDK
- **Storage**: Supabase Storage SDK
- **Edge Functions**: Supabase Functions

### External APIs (Future)

- **EPC Register**: REST API
- **Environment Agency**: REST API
- **HMLR**: REST API
- **Planning Data**: REST API

---

## 📝 Code Conventions

### Naming

- **Components**: PascalCase (`PropertyCard.tsx`)
- **Files**: kebab-case for utilities (`format-date.ts`)
- **Variables**: camelCase (`propertyId`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### File Organization

- **One Component Per File**: Except related subcomponents
- **Co-location**: Keep related files together
- **Barrel Exports**: Use `index.ts` for clean imports (future)

### TypeScript

- **Strict Mode**: Gradually enabling (currently loose)
- **Type Imports**: Use `import type` for types
- **Interfaces**: Prefer over `type` for objects

---

## 🎯 Future Architecture Considerations

### Potential Improvements

1. **Next.js Migration**: For SSR and better SEO
2. **Micro-frontends**: If scaling to multiple apps
3. **GraphQL**: If API complexity grows
4. **State Machine**: For complex workflows (XState)
5. **WebSockets**: For real-time features

### Migration Paths

- **Incremental**: Can migrate features incrementally
- **Backward Compatible**: Maintain existing patterns
- **Testing**: Comprehensive testing before migration

---

**Document Version:** 1.0  
**Maintained By:** Development Team  
**Last Review:** 2025-01-10

