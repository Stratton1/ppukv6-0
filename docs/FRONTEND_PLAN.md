# Property Passport UK v6.0 - Frontend Architecture Plan

## Executive Summary

This document outlines the complete frontend architecture for Property Passport UK (PPUK) v6.0, a comprehensive property information platform serving multiple user roles across the UK residential market.

### Version History
- **v5.1 (Current)**: Basic property passports, owner/buyer roles, photo/document upload
- **v6.0 (This Build)**: Multi-role portals, professional integrations, admin console, complete API integration layer

---

## 1. Repository Analysis & Assumptions

### 1.1 Current System State (v5.1)
**Technology Stack:**
- Vite + React 18 + TypeScript (strict mode)
- Tailwind CSS with custom design tokens
- shadcn/ui component library
- Supabase (via Lovable Cloud) for backend
- React Router v6
- React Query for data fetching
- React Hook Form + Zod validation

**Existing Features:**
- ✅ Authentication (email/password, test users)
- ✅ Property search and listing
- ✅ Property passport with 6 tabs
- ✅ Photo gallery with lightbox
- ✅ Document upload system
- ✅ Mock API integrations (EPC, Flood, HMLR, Planning)
- ✅ Role-based access (owner, buyer)
- ✅ Passport completeness scoring

**Database Schema:**
- Tables: profiles, properties, property_photos, documents, saved_properties
- Storage: property-photos (public), property-documents (private)
- RLS policies implemented and tested
- User roles enum: owner, buyer, other

### 1.2 Brand Identity

**Color Palette:**
- Primary: Navy Blue (HSL 215 45% 30%) - #0D1B2A
- Secondary: Sage Green (HSL 145 25% 60%) - #A3B18A
- Semantic tokens defined in index.css

**Typography:**
- Primary: Inter font family
- Scale: Fluid typography with responsive units

**Design Principles:**
- Professional, trustworthy, data-driven
- UK government service aesthetic meets modern SaaS
- Accessibility first (WCAG AA minimum)
- Mobile-first responsive design

### 1.3 Key Assumptions Made

1. **Backend Integration:**
   - All external API calls route through typed client stubs
   - Graceful degradation to mock data when API keys missing
   - Supabase handles auth, storage, and core data persistence

2. **Role Expansion:**
   - Need database migration to expand user_role enum
   - New roles: admin, surveyor, agent, conveyancer, tenant, partner
   - Multi-role support (users can have multiple roles)

3. **Data Sources:**
   - EPC Register API (UK Government)
   - Environment Agency Flood API
   - HM Land Registry API (INSPIRE polygons)
   - OS Places API (address search)
   - Planning Data API (multiple LPAs)
   - Companies House API (company search)
   - Postcodes.io (free fallback for geolocation)

4. **Security:**
   - All API keys stored in Supabase secrets
   - RLS policies enforce data access control
   - Dev mode features hidden in production
   - No sensitive data in localStorage

5. **Deployment:**
   - Lovable Cloud production hosting
   - GitHub integration for version control
   - Environment-aware configuration

---

## 2. Architecture Decisions

### 2.1 Information Architecture

The application is organized into 5 top-level sections:

1. **Public Site** - Marketing, landing, documentation
2. **Authentication** - Login, register, onboarding
3. **Core Workspace** - Property management and data
4. **Client Portals** - Role-specific end-user interfaces
5. **Professional Portals** - Service provider workspaces
6. **Admin Console** - Platform management

### 2.2 Routing Strategy

**File-Based Routes (`src/routes/`):**
```
routes/
├── index.tsx                   # Landing page
├── about.tsx
├── pricing.tsx
├── help.tsx
├── legal/
│   ├── privacy.tsx
│   └── terms.tsx
├── auth/
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   └── onboarding.tsx
├── dashboard.tsx
├── notifications.tsx
├── inbox.tsx
├── properties/
│   ├── index.tsx              # Property list
│   ├── new.tsx                # Create property
│   └── [id]/
│       ├── index.tsx          # Property workspace
│       ├── overview.tsx
│       ├── title.tsx
│       ├── documents.tsx
│       ├── media.tsx
│       ├── epc.tsx
│       ├── flood.tsx
│       ├── planning.tsx
│       ├── compliance.tsx
│       ├── parties.tsx
│       ├── valuation.tsx
│       ├── transactions.tsx
│       ├── notes.tsx
│       └── activity.tsx
├── portal/
│   ├── owners/
│   │   ├── home.tsx
│   │   ├── property/[id].tsx
│   │   ├── maintenance.tsx
│   │   └── billing.tsx
│   ├── purchasers/
│   │   ├── home.tsx
│   │   ├── property/[id].tsx
│   │   ├── checklist.tsx
│   │   └── messages.tsx
│   └── tenants/
│       ├── home.tsx
│       ├── repairs.tsx
│       ├── documents.tsx
│       └── move.tsx
├── pro/
│   ├── surveyors/
│   │   ├── home.tsx
│   │   ├── templates.tsx
│   │   └── jobs/[id].tsx
│   ├── agents/
│   │   ├── home.tsx
│   │   └── properties/[id].tsx
│   └── conveyancers/
│       ├── home.tsx
│       └── matters/[id].tsx
└── admin/
    ├── users.tsx
    ├── settings.tsx
    ├── integrations.tsx
    └── audit.tsx
```

### 2.3 State Management Strategy

**React Query:** Server state, caching, synchronization
- Property data
- Documents and photos
- API responses
- User profiles

**Zustand:** Client state, UI preferences
- Theme (light/dark)
- Sidebar open/closed
- Modal states
- Role impersonation (dev only)
- Feature flags

**React Hook Form:** Form state
- All forms use RHF + Zod
- Optimistic updates where safe
- Field-level validation

**URL State:** Filters, pagination, active tabs
- Search parameters preserved
- Shareable deep links
- Browser back/forward support

### 2.4 Component Architecture

**Atomic Design Principles:**
```
components/
├── ui/                        # shadcn primitives (existing)
├── layout/
│   ├── AppShell.tsx          # Main application wrapper
│   ├── Sidebar.tsx           # Left navigation
│   ├── Topbar.tsx            # Top navigation bar
│   ├── PageContainer.tsx     # Content wrapper
│   ├── Section.tsx           # Page section
│   └── CardGrid.tsx          # Responsive card grid
├── content/
│   ├── PageHeader.tsx        # Title, subtitle, actions
│   ├── KpiTile.tsx           # Stat display card
│   ├── StatBadge.tsx         # Inline metric
│   ├── StatusPill.tsx        # Status indicator
│   └── PropertyCard.tsx      # Property preview (existing)
├── data/
│   ├── DataTable.tsx         # Sortable table
│   ├── DefinitionList.tsx    # Key-value pairs
│   └── KeyValueGrid.tsx      # Grid of data points
├── feedback/
│   ├── EmptyState.tsx        # No data message
│   ├── ErrorBanner.tsx       # Error with retry
│   ├── LoadingBlock.tsx      # Skeleton loaders
│   └── Toasts.tsx            # Toast notifications (existing)
├── forms/
│   ├── AddressSearch.tsx     # Address autocomplete
│   ├── DatePicker.tsx        # Date input (shadcn)
│   ├── FileUploader.tsx      # Drag-drop upload
│   ├── Dropzone.tsx          # File drop zone
│   └── FormField.tsx         # Wrapped field (shadcn)
├── media/
│   ├── PdfViewer.tsx         # PDF display
│   ├── ImageLightbox.tsx     # Photo viewer
│   ├── MapView.tsx           # Map with polygons
│   └── Timeline.tsx          # Event timeline
├── property/
│   ├── PropertyCard.tsx      # (existing)
│   ├── PropertyStats.tsx     # Quick stats
│   ├── PropertyActions.tsx   # Action menu
│   └── PropertyHeader.tsx    # Header with photo
├── auth/
│   ├── RequireAuth.tsx       # Auth guard
│   ├── RequireRole.tsx       # Role guard
│   └── DevAuthBypass.tsx     # (existing)
└── utility/
    ├── CopyToClipboard.tsx   # Copy button
    ├── SourceLink.tsx        # Data source attribution
    ├── FeatureFlag.tsx       # Conditional render
    └── ImpersonationBar.tsx  # Dev role switcher
```

### 2.5 API Integration Layer

**Client Architecture (`src/lib/clients/`):**

Each external API gets:
1. **Client module** - HTTP wrapper with auth
2. **Interfaces** - Request/response types
3. **Transformers** - Data normalization
4. **Mocks** - Fallback data
5. **React Query hooks** - Data fetching

**Example Structure:**
```typescript
clients/
├── epc/
│   ├── client.ts            # HTTP client
│   ├── interfaces.ts        # TypeScript types
│   ├── transformers.ts      # Data mapping
│   ├── mocks.ts             # Sample responses
│   └── hooks.ts             # React Query hooks
├── flood/
├── planning/
├── postcodes/
├── osPlaces/
├── inspire/
└── companiesHouse/
```

**Hook Pattern:**
```typescript
export function useEPCData(uprn: string) {
  return useQuery({
    queryKey: ['epc', uprn],
    queryFn: () => hasApiKey() 
      ? fetchFromAPI(uprn) 
      : getMockData(uprn),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
```

### 2.6 Design Token System

**Extended from v5.1:**
```css
/* Color Semantic Tokens */
--primary: HSL navy blue
--primary-foreground: white
--secondary: HSL sage green  
--secondary-foreground: dark text
--accent: complementary color
--muted: gray tones
--destructive: error red
--success: confirmation green
--warning: caution amber
--info: informational blue

/* Spacing Scale */
--space-xs: 0.25rem
--space-sm: 0.5rem
--space-md: 1rem
--space-lg: 1.5rem
--space-xl: 2rem
--space-2xl: 3rem

/* Elevation (Shadows) */
--shadow-sm: subtle elevation
--shadow-md: card elevation
--shadow-lg: modal elevation
--shadow-xl: dropdown elevation

/* Border Radius */
--radius-sm: 0.25rem
--radius-md: 0.5rem
--radius-lg: 0.75rem
--radius-full: 9999px

/* Typography Scale */
--text-xs: 0.75rem
--text-sm: 0.875rem
--text-base: 1rem
--text-lg: 1.125rem
--text-xl: 1.25rem
--text-2xl: 1.5rem
--text-3xl: 1.875rem
--text-4xl: 2.25rem
```

---

## 3. Implementation Roadmap

### Phase 1: Foundation (This Build) ✅
- [x] Documentation (this file + others)
- [x] Core infrastructure
- [x] Route scaffolds
- [x] Component library
- [x] API client stubs
- [x] Role management system

### Phase 2: Data Integration (Cursor - Next)
- [ ] Real API connections
- [ ] Error handling & retries
- [ ] Rate limiting
- [ ] Caching strategies
- [ ] Data transformation

### Phase 3: AI Features (Cursor - Future)
- [ ] Document OCR
- [ ] Data extraction
- [ ] Property insights
- [ ] Predictive analytics
- [ ] Chatbot assistant

### Phase 4: Professional Tools (Cursor - Future)
- [ ] Survey report templates
- [ ] Conveyancing checklists
- [ ] Agent marketing tools
- [ ] Tenant portal enhancements

### Phase 5: Platform Features (Cursor - Future)
- [ ] Multi-property comparison
- [ ] Saved searches
- [ ] Automated alerts
- [ ] Export/PDF generation
- [ ] Bulk operations

---

## 4. Known Risks & Mitigations

### 4.1 Technical Risks

**Risk:** API rate limiting
- **Mitigation:** Aggressive caching, request queuing, fallback to cached data

**Risk:** Large bundle size with many routes
- **Mitigation:** Code splitting, lazy loading, dynamic imports

**Risk:** Complex role-based access logic
- **Mitigation:** Centralized role checking, comprehensive tests, clear documentation

**Risk:** State management complexity
- **Mitigation:** Clear separation of concerns (React Query vs Zustand), documented patterns

### 4.2 UX Risks

**Risk:** Role confusion (users with multiple roles)
- **Mitigation:** Clear role switcher, contextual navigation, role badges

**Risk:** Empty state proliferation
- **Mitigation:** Reusable EmptyState component, consistent copy, clear CTAs

**Risk:** Information overload on property pages
- **Mitigation:** Tabbed interface, progressive disclosure, search/filter

### 4.3 Data Risks

**Risk:** Missing or incomplete property data
- **Mitigation:** Graceful degradation, clear "data unavailable" states, manual override options

**Risk:** API response inconsistencies
- **Mitigation:** Robust transformers, schema validation (Zod), error boundaries

---

## 5. Unknowns & Open Questions

### 5.1 External API Access
- **Question:** Which APIs have confirmed access/keys?
- **Current Status:** All mocked, awaiting production credentials
- **Decision:** Build with mocks, swap in real clients when keys available

### 5.2 Role Assignment
- **Question:** Can users self-assign professional roles, or admin-only?
- **Current Assumption:** Self-select on registration, admin can override
- **Decision:** Implement self-selection with admin review queue

### 5.3 Pricing Model
- **Question:** Tiered pricing? Per-property? Subscription?
- **Current Status:** Placeholder pricing page
- **Decision:** Static pricing page, integrate Stripe when model confirmed

### 5.4 Document AI
- **Question:** Which AI provider for OCR/extraction?
- **Current Status:** Placeholder "ai_summary" field
- **Decision:** Use Lovable AI (Gemini) via edge functions

### 5.5 Map Provider
- **Question:** Google Maps, Mapbox, or OpenStreetMap?
- **Current Status:** No map SDK installed
- **Decision:** Provider-agnostic MapView component, configure via env

---

## 6. Glossary of Terms

**PPUK** - Property Passport UK
**UPRN** - Unique Property Reference Number (UK standard)
**EPC** - Energy Performance Certificate
**HMLR** - HM Land Registry
**INSPIRE** - EU spatial data infrastructure (polygon data)
**RLS** - Row Level Security (Supabase)
**LPA** - Local Planning Authority
**PSC** - Person with Significant Control (Companies House)
**AML** - Anti-Money Laundering
**KYC** - Know Your Customer
**RRN** - Report Reference Number (EPC)
**FENSA** - Fenestration Self-Assessment (windows certification)
**EICR** - Electrical Installation Condition Report

---

## 7. What's Built vs. What Remains

### Built in This Session ✅
1. **Documentation** - Complete architecture, routes, components, data models, integrations
2. **Core Infrastructure** - AppShell, routing, role guards, theme system
3. **Component Library** - All base components with proper typing
4. **API Client Stubs** - Typed interfaces, mocks, React Query hooks
5. **Route Scaffolds** - Every page/portal with placeholder UI
6. **Role System** - Zustand store, RequireRole guard, dev impersonation
7. **Design System** - Extended tokens, shadcn variants

### Remaining for Future Sessions
1. **Real API Integration** - Replace mocks with live calls
2. **Form Implementations** - Complete all forms with validation
3. **Data Tables** - Sorting, filtering, pagination logic
4. **Chart Components** - Property trends, market data
5. **PDF Generation** - Export property packs
6. **Email Notifications** - Triggered alerts
7. **WebSocket** - Real-time updates
8. **Testing** - Unit, integration, E2E tests
9. **Accessibility Audit** - WCAG AA compliance verification
10. **Performance** - Bundle size optimization, image optimization

---

## 8. How the Parts Fit Together

### User Journey: Property Owner
1. **Register** → Onboarding flow (collect role, basic info)
2. **Dashboard** → See owned properties, quick actions
3. **Add Property** → Address search wizard, create passport
4. **Property Workspace** → 13 tabs for data management
5. **Upload Documents** → Drag-drop, auto-categorization
6. **View APIs** → External data preview, refresh on demand
7. **Share Passport** → Generate link for buyers/agents
8. **Portal View** → Simplified owner portal for maintenance tracking

### User Journey: Property Purchaser
1. **Register** → Select "Purchaser" role
2. **Search Properties** → Filter by postcode, features
3. **View Passport** → Full property data access
4. **Save Property** → Add to watchlist with notes
5. **Due Diligence** → Checklist of required checks
6. **Instruct Survey** → CTA to surveyor portal
7. **Purchaser Portal** → Manage saved properties, checklists, messages

### User Journey: Professional (Surveyor)
1. **Register** → Select "Surveyor" role, company info
2. **Pro Dashboard** → Assigned jobs, calendar
3. **Job Details** → Property quick facts, file exchange
4. **Use Templates** → Pre-built report formats
5. **Submit Report** → Upload to property document vault
6. **Track History** → All jobs in portfolio

### Data Flow: External APIs
1. **User views property** → Frontend requests data
2. **React Query hook** → Checks cache, calls client
3. **Client checks env** → API key present?
   - Yes → Make authenticated API call
   - No → Return mock data
4. **Transformer** → Normalize response to internal model
5. **UI renders** → Display with "Source" attribution
6. **Cache** → Store for 1 hour, stale-while-revalidate

### Role Enforcement Flow
1. **User navigates** → Route requires role check
2. **RequireRole guard** → Reads from auth context
3. **Check role** → User has required role?
   - Yes → Render route
   - No → Redirect to dashboard with toast
4. **Dev Mode** → ImpersonationBar allows role switching

---

## 9. Deployment Checklist

Before production deployment:
- [ ] Remove dev-only features (impersonation, test logins)
- [ ] Set all real API keys in Supabase secrets
- [ ] Enable email verification in Supabase auth settings
- [ ] Configure custom domain
- [ ] Set up error tracking (Sentry or equivalent)
- [ ] Configure analytics (Plausible or equivalent)
- [ ] Run Lighthouse audit (target: 90+ on all metrics)
- [ ] Test all user journeys in production-like environment
- [ ] Verify RLS policies with actual user data
- [ ] Load test with realistic data volumes
- [ ] Set up monitoring and alerts
- [ ] Create incident response runbook

---

## 10. Success Criteria

This v6.0 scaffold is successful if:
1. ✅ All routes exist with proper layout and navigation
2. ✅ Role-based access is enforced throughout
3. ✅ All components are typed and documented
4. ✅ API clients return mocked data in absence of keys
5. ✅ Design system is consistent and maintainable
6. ✅ Loading/empty/error states exist everywhere
7. ✅ Documentation is comprehensive and cross-linked
8. ✅ Future developers can understand and extend the codebase

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-10  
**Status:** Complete - Ready for implementation
