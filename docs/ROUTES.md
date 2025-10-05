# Property Passport UK v6.0 - Route Mapping

Complete sitemap with route ownership, required roles, and component breakdown.

---

## Route Tree

```
/                                   Public (Landing)
├── /about                          Public (About page)
├── /pricing                        Public (Pricing tiers)
├── /help                           Public (Help center)
├── /legal
│   ├── /privacy                    Public (Privacy policy)
│   └── /terms                      Public (Terms of service)
├── /status                         Public (System status)
├── /roadmap                        Public (Product roadmap)
│
├── /auth
│   ├── /login                      Public (Login form)
│   ├── /register                   Public (Registration)
│   ├── /forgot-password            Public (Password reset)
│   └── /onboarding                 Auth (Post-signup flow)
│
├── /dashboard                      Auth (Role-aware dashboard)
├── /notifications                  Auth (Notification center)
├── /inbox                          Auth (Messages)
│
├── /properties                     Auth (Property list)
│   ├── /new                        Auth (Create property)
│   └── /:id
│       ├── /                       Auth (Property workspace home)
│       ├── /overview               Auth (Property summary)
│       ├── /title                  Auth (Title & ownership)
│       ├── /documents              Auth (Document vault)
│       ├── /media                  Auth (Photo gallery)
│       ├── /epc                    Auth (Energy certificate)
│       ├── /flood                  Auth (Flood risk data)
│       ├── /planning               Auth (Planning history)
│       ├── /compliance             Auth (Certificates)
│       ├── /parties                Auth (Stakeholders)
│       ├── /valuation              Auth (Surveys & valuations)
│       ├── /transactions           Auth (Offers & conveyancing)
│       ├── /notes                  Auth (Notes & tasks)
│       └── /activity               Auth (Audit log)
│
├── /portal
│   ├── /owners
│   │   ├── /home                   Role: Owner (My properties)
│   │   ├── /property/:id           Role: Owner (Property detail)
│   │   ├── /maintenance            Role: Owner (Maintenance tracker)
│   │   └── /billing                Role: Owner (Subscription)
│   │
│   ├── /purchasers
│   │   ├── /home                   Role: Buyer (Saved properties)
│   │   ├── /property/:id           Role: Buyer (Buyer pack)
│   │   ├── /checklist              Role: Buyer (Due diligence)
│   │   └── /messages               Role: Buyer (Q&A with vendors)
│   │
│   └── /tenants
│       ├── /home                   Role: Tenant (Tenancy summary)
│       ├── /repairs                Role: Tenant (Maintenance requests)
│       ├── /documents              Role: Tenant (Tenancy docs)
│       └── /move                   Role: Tenant (Move in/out)
│
├── /pro
│   ├── /surveyors
│   │   ├── /home                   Role: Surveyor (Jobs dashboard)
│   │   ├── /templates              Role: Surveyor (Report templates)
│   │   └── /jobs/:id               Role: Surveyor (Job workspace)
│   │
│   ├── /agents
│   │   ├── /home                   Role: Agent (Portfolio)
│   │   └── /properties/:id         Role: Agent (Marketing pack)
│   │
│   └── /conveyancers
│       ├── /home                   Role: Conveyancer (Matters)
│       └── /matters/:id            Role: Conveyancer (Matter detail)
│
├── /admin
│   ├── /users                      Role: Admin (User management)
│   ├── /settings                   Role: Admin (Platform config)
│   ├── /integrations               Role: Admin (API keys)
│   └── /audit                      Role: Admin (Activity log)
│
└── /settings                       Auth (User settings)
```

---

## Route Details

### Public Routes

#### `/` - Landing Page
**Component:** `Home.tsx`
**Required Role:** None
**Key Features:**
- Hero section with search
- Feature highlights
- Trust badges (data partners)
- CTA buttons (Register, Claim Property)
**State Management:** None
**External Data:** None

#### `/about` - About Page
**Component:** `About.tsx`
**Required Role:** None
**Key Features:**
- Company mission
- Team section
- Timeline/milestones
- Contact information
**State Management:** None
**External Data:** None

#### `/pricing` - Pricing Page
**Component:** `Pricing.tsx`
**Required Role:** None
**Key Features:**
- Pricing tiers (cards)
- Feature comparison table
- FAQ section
- CTA to register
**State Management:** None
**External Data:** None

#### `/help` - Help Center
**Component:** `Help.tsx`
**Required Role:** None
**Key Features:**
- Searchable knowledge base
- Category navigation
- Popular articles
- External docs links
**State Management:** Search query
**External Data:** None (static content)

#### `/legal/privacy` - Privacy Policy
**Component:** `Privacy.tsx`
**Required Role:** None
**Key Features:**
- Legal text
- Last updated date
- Table of contents
**State Management:** None
**External Data:** None

#### `/legal/terms` - Terms of Service
**Component:** `Terms.tsx`
**Required Role:** None
**Key Features:**
- Legal text
- Last updated date
- Table of contents
**State Management:** None
**External Data:** None

#### `/status` - System Status
**Component:** `Status.tsx`
**Required Role:** None
**Key Features:**
- API status indicators
- Recent incidents
- Uptime metrics
**State Management:** None
**External Data:** Mock status data

#### `/roadmap` - Product Roadmap
**Component:** `Roadmap.tsx`
**Required Role:** None
**Key Features:**
- Feature timeline
- Launched/In Progress/Planned
- Vote on features (if logged in)
**State Management:** Feature votes
**External Data:** Mock roadmap data

---

### Auth Routes

#### `/auth/login` - Login Page
**Component:** `Login.tsx`
**Required Role:** None (public)
**Key Features:**
- Email/password form
- Social login buttons (future)
- Forgot password link
- Dev bypass (dev only)
**State Management:** Form state (RHF)
**External Data:** Supabase auth
**Redirects:** `/dashboard` on success

#### `/auth/register` - Registration Page
**Component:** `Register.tsx`
**Required Role:** None (public)
**Key Features:**
- Email/password signup
- Role selection (checkboxes)
- Terms acceptance
- Profile basics (name, phone)
**State Management:** Form state (RHF), validation (Zod)
**External Data:** Supabase auth, profiles table
**Redirects:** `/auth/onboarding` on success

#### `/auth/forgot-password` - Password Reset
**Component:** `ForgotPassword.tsx`
**Required Role:** None (public)
**Key Features:**
- Email input
- Reset email sending
- Success message
- Back to login link
**State Management:** Form state (RHF)
**External Data:** Supabase auth password reset

#### `/auth/onboarding` - Onboarding Flow
**Component:** `Onboarding.tsx`
**Required Role:** Authenticated
**Key Features:**
- Multi-step wizard
- Role confirmation
- Company info (if professional)
- Property import option
**State Management:** Multi-step form (RHF), Zustand for step tracking
**External Data:** Profile updates
**Redirects:** `/dashboard` on completion

---

### Core Workspace Routes

#### `/dashboard` - Main Dashboard
**Component:** `Dashboard.tsx`
**Required Role:** Authenticated
**Key Features:**
- Role-aware KPI tiles
- Recent activity feed
- Quick actions (+ Add Property, View Messages)
- Role-specific widgets
**State Management:** React Query (properties, activity)
**External Data:**
- User properties
- Recent notifications
- Activity log

**Role Variations:**
- **Owner:** My properties, completion scores, document expiry alerts
- **Buyer:** Saved properties, checklists progress, new listings
- **Surveyor:** Assigned jobs, upcoming appointments, templates
- **Agent:** Portfolio overview, leads, AML checklist
- **Conveyancer:** Active matters, requisitions due, searches ordered
- **Tenant:** Tenancy summary, repair requests, important dates
- **Admin:** User stats, API health, recent sign-ups

#### `/notifications` - Notification Center
**Component:** `Notifications.tsx`
**Required Role:** Authenticated
**Key Features:**
- Notification list with filters (unread, type)
- Mark as read/unread
- Deep links to source
- Notification settings link
**State Management:** React Query (notifications)
**External Data:** Notifications table
**Filters:** All, Unread, Property Updates, Messages, System

#### `/inbox` - Message Center
**Component:** `Inbox.tsx`
**Required Role:** Authenticated
**Key Features:**
- Thread list (left pane)
- Message viewer (right pane)
- Composer (bottom)
- Attachments support (future)
**State Management:** React Query (threads, messages), Zustand (active thread)
**External Data:** Messages table
**Realtime:** Supabase subscriptions for new messages

---

### Property Routes

#### `/properties` - Property List
**Component:** `PropertiesList.tsx`
**Required Role:** Authenticated
**Key Features:**
- List/map toggle
- Filters (postcode, UPRN, EPC, flood, planning, tags)
- Sort options (address, updated, completion %)
- Pagination
- Bulk actions (for admins)
**State Management:** React Query (properties), URL params (filters, page)
**External Data:** Properties table with filters
**Columns:** Address, UPRN, Owner, EPC Band, Flood Status, Planning Count, Last Updated

#### `/properties/new` - Create Property
**Component:** `NewProperty.tsx`
**Required Role:** Authenticated
**Key Features:**
- Address search wizard (AddressSearch component)
- Manual address override
- Property type/style selectors
- Basic details form
- Geo preview (map pin)
- De-duplication check
**State Management:** Multi-step form (RHF), address search state
**External Data:**
- OS Places API (if key present)
- Postcodes.io fallback
- Properties table (de-dupe check)
**Redirects:** `/properties/:id` on creation

#### `/properties/:id` - Property Workspace (Parent Route)
**Component:** `PropertyWorkspace.tsx`
**Required Role:** Authenticated (varies by tab)
**Key Features:**
- Property header (address, UPRN, map, badges)
- Tab navigation (13 tabs)
- Freshness indicators
- Quick actions dropdown
**State Management:** React Query (property, documents, photos, activity)
**External Data:** Property data, related entities
**Access Control:** Some tabs owner-only

**Sub-routes (all under `/properties/:id/`):**

#### `/properties/:id/overview` - Property Overview (Tab 1)
**Component:** `PropertyOverview.tsx`
**Required Role:** Authenticated
**Key Features:**
- Summary stats grid (type, beds, baths, area, EPC, tenure, flood)
- Title number card (if available)
- Map pin with INSPIRE polygon preview
- Quick facts
**State Management:** Parent property data
**External Data:** None (uses parent's fetched property)

#### `/properties/:id/title` - Title & Ownership (Tab 2)
**Component:** `PropertyTitle.tsx`
**Required Role:** Authenticated
**Key Features:**
- INSPIRE polygon viewer (GeoJSON)
- Title layers preview (mocked)
- Ownership parties list
- Restrictions/notices (placeholders)
- CTA: "Request official copy" (stub)
**State Management:** React Query (INSPIRE data)
**External Data:** INSPIRE API (polygon), HMLR API (title summary)

#### `/properties/:id/documents` - Document Vault (Tab 3)
**Component:** `PropertyDocuments.tsx`
**Required Role:** Authenticated (owner for upload)
**Key Features:**
- Folder tags (Passport, Legal, Compliance, Surveys, Plans, Photos)
- Drag-drop upload
- Document list with metadata
- PDF/image previewer
- Versions list
- Share link generator (stub)
- De-dupe by hash
**State Management:** React Query (documents)
**External Data:** Documents table, property-documents storage
**Components:** DocumentUploader, PdfViewer

#### `/properties/:id/media` - Photo Gallery (Tab 4)
**Component:** `PropertyMedia.tsx`
**Required Role:** Authenticated (owner for upload)
**Key Features:**
- Photo grid with lightbox
- Upload button (owner only)
- Room type badges
- Featured image toggle
- Floorplan viewer (separate section)
**State Management:** React Query (photos)
**External Data:** property_photos table, property-photos storage
**Components:** PhotoGallery, ImageLightbox

#### `/properties/:id/epc` - Energy Certificate (Tab 5)
**Component:** `PropertyEPC.tsx`
**Required Role:** Authenticated
**Key Features:**
- Current EPC card (band, rating, expiry)
- Band history chart (line graph)
- Recommendations list with costs
- Download certificate link (when wired)
- "Check for updates" button
**State Management:** React Query (EPC data)
**External Data:** EPC Register API (by UPRN or address)
**Components:** APIPreviewCard (reused from v5.1)

#### `/properties/:id/flood` - Flood Risk (Tab 6)
**Component:** `PropertyFlood.tsx`
**Required Role:** Authenticated
**Key Features:**
- EA status badge (Very Low / Low / Medium / High)
- Nearest station chart (sparkline)
- Risk breakdown (surface water, rivers, groundwater, reservoirs)
- Local authority guidance link slot
- "Understand your risk" text block
**State Management:** React Query (flood data)
**External Data:** Environment Agency Flood API
**Components:** StatusPill, sparkline chart

#### `/properties/:id/planning` - Planning History (Tab 7)
**Component:** `PropertyPlanning.tsx`
**Required Role:** Authenticated
**Key Features:**
- Recent applications table (ref, LPA, status, decision date, description)
- Constraints list (Article 4, conservation area, TPO, etc.)
- Deep links to LPA portal
- Map overlay of planning polygons (future)
**State Management:** React Query (planning data)
**External Data:** Planning Data API (by geolocation)
**Components:** DataTable

#### `/properties/:id/compliance` - Compliance Tracker (Tab 8)
**Component:** `PropertyCompliance.tsx`
**Required Role:** Authenticated (owner for uploads)
**Key Features:**
- Checklist of certificates:
  - Gas Safe Certificate
  - EICR (Electrical)
  - FENSA (Windows)
  - EPC
  - Smoke/CO Alarms
- Status chips (Valid, Expired, Missing)
- Expiry reminders
- Upload slots to satisfy items
**State Management:** React Query (compliance items)
**External Data:** Compliance table (future), documents table
**Components:** ComplianceChecklist

#### `/properties/:id/parties` - Parties & Stakeholders (Tab 9)
**Component:** `PropertyParties.tsx`
**Required Role:** Authenticated (owner for edits)
**Key Features:**
- Owners list (with % ownership if multiple)
- Agents, surveyors, conveyancers, tenants
- Companies House lookup widget (if API key)
- KYC/AML checklist (placeholders)
- Add/edit/remove party modals
**State Management:** React Query (parties)
**External Data:** Parties table (future), Companies House API
**Components:** PartyCard, CompaniesHouseSearch

#### `/properties/:id/valuation` - Valuations & Surveys (Tab 10)
**Component:** `PropertyValuation.tsx`
**Required Role:** Authenticated
**Key Features:**
- Survey history table (Type: Level 2/3, Date, Surveyor, Status)
- Key findings summary fields
- File links (to documents)
- Valuation notes block
- "Instruct Survey" CTA (opens surveyor portal flow)
**State Management:** React Query (surveys)
**External Data:** Surveys table (future), documents table
**Components:** DataTable, SurveyCard

#### `/properties/:id/transactions` - Offers & Conveyancing (Tab 11)
**Component:** `PropertyTransactions.tsx`
**Required Role:** Authenticated (owner for management)
**Key Features:**
- Offers table (Buyer, Amount, Date, Status)
- Milestones timeline (ID Check, Memos, Searches, Enquiries, Contracts, Exchange, Completion)
- E-sign placeholders
- Requisitions log (stub)
- Conveyancer assignment
**State Management:** React Query (transactions)
**External Data:** Transactions table (future), offers table (future)
**Components:** Timeline, OfferCard

#### `/properties/:id/notes` - Notes & Tasks (Tab 12)
**Component:** `PropertyNotes.tsx`
**Required Role:** Authenticated (owner for write)
**Key Features:**
- Rich text notes editor
- Task list with:
  - Due dates
  - Assignees (from parties)
  - Status (Todo, In Progress, Done)
  - Property-scoped notifications
**State Management:** React Query (notes, tasks)
**External Data:** Notes table (future), tasks table (future)
**Components:** RichTextEditor, TaskList

#### `/properties/:id/activity` - Activity Log (Tab 13)
**Component:** `PropertyActivity.tsx`
**Required Role:** Authenticated
**Key Features:**
- Audit trail table (Who, What, When)
- Filter by actor and event type
- Pagination
- Export to CSV (future)
**State Management:** React Query (activity log)
**External Data:** Activity table
**Components:** DataTable with timestamps

---

### Client Portals

#### Owner Portal

##### `/portal/owners/home` - Owner Dashboard
**Component:** `OwnerHome.tsx`
**Required Role:** Owner
**Key Features:**
- My properties grid
- Alerts section (expiring compliance, maintenance reminders)
- Completion score summary
- Quick actions (+ Add Property, Upload Document)
**State Management:** React Query (owned properties, alerts)
**External Data:** Properties table (claimed_by = user), compliance checks

##### `/portal/owners/property/:id` - Owner Property View
**Component:** `OwnerProperty.tsx`
**Required Role:** Owner (must own property)
**Key Features:**
- Same tab set as property workspace, plus:
  - Service marketplace (placeholder)
  - Invite professional (modal)
  - Share passport (link generator)
  - Export pack (PDF download stub)
**State Management:** React Query (property, documents, photos)
**External Data:** Property data
**Access Control:** RLS enforces ownership

##### `/portal/owners/maintenance` - Maintenance Tracker
**Component:** `OwnerMaintenance.tsx`
**Required Role:** Owner
**Key Features:**
- Tasks by category (Roofing, Heating, Electrics, Plumbing, etc.)
- Recommended intervals
- Add receipts/photos
- Service history
- Upcoming reminders
**State Management:** React Query (maintenance records)
**External Data:** Maintenance table (future)

##### `/portal/owners/billing` - Subscription & Billing
**Component:** `OwnerBilling.tsx`
**Required Role:** Owner
**Key Features:**
- Current plan card
- Usage stats
- Invoice list (mock)
- Payment method
- Change plan CTA
**State Management:** React Query (subscription)
**External Data:** Stripe API (future)

#### Purchaser Portal

##### `/portal/purchasers/home` - Buyer Dashboard
**Component:** `PurchaserHome.tsx`
**Required Role:** Buyer
**Key Features:**
- Saved properties grid
- Due diligence checklist summary
- Progress tracker (percentage complete)
- Recent shared passports
**State Management:** React Query (saved properties, checklists)
**External Data:** saved_properties table

##### `/portal/purchasers/property/:id` - Buyer Pack View
**Component:** `PurchaserProperty.tsx`
**Required Role:** Buyer
**Key Features:**
- Structured "Buyer Pack" summary cards:
  - Property overview
  - EPC status
  - Flood risk
  - Planning constraints
  - Title summary
- Instruct survey CTA
- Conveyancer selection placeholder
- Save property button
**State Management:** React Query (property, external APIs)
**External Data:** Property data, API clients

##### `/portal/purchasers/checklist` - Due Diligence Checklist
**Component:** `PurchaserChecklist.tsx`
**Required Role:** Buyer
**Key Features:**
- Configurable checklist with statuses:
  - EPC reviewed
  - Flood risk assessed
  - Planning history checked
  - Title searches ordered
  - Survey instructed
  - Mortgage in principle
- Document upload slots
- Notes per item
**State Management:** React Query (checklist items)
**External Data:** Checklists table (future)

##### `/portal/purchasers/messages` - Buyer Q&A
**Component:** `PurchaserMessages.tsx`
**Required Role:** Buyer
**Key Features:**
- Threads with vendors/agents
- Property-specific messages
- Shareable Q&A threads
- Attachment support (future)
**State Management:** React Query (message threads)
**External Data:** Messages table

#### Tenant Portal

##### `/portal/tenants/home` - Tenant Dashboard
**Component:** `TenantHome.tsx`
**Required Role:** Tenant
**Key Features:**
- Current tenancy summary card (property, landlord, dates)
- Important dates (rent due, inspection, end date)
- Compliance documents accessible to tenant (EPC, EICR, Gas Cert)
- Recent repair requests
**State Management:** React Query (tenancy, compliance docs)
**External Data:** Tenancies table (future), documents table

##### `/portal/tenants/repairs` - Maintenance Requests
**Component:** `TenantRepairs.tsx`
**Required Role:** Tenant
**Key Features:**
- Create/view maintenance requests
- Wizard: Describe issue, location in property, upload photos
- Status chips (Submitted, Scheduled, In Progress, Resolved)
- SLA indicators (placeholder)
- Repair history
**State Management:** React Query (repair requests)
**External Data:** Repairs table (future)

##### `/portal/tenants/documents` - Tenancy Documents
**Component:** `TenantDocuments.tsx`
**Required Role:** Tenant
**Key Features:**
- Tenancy agreement (view/download)
- Deposit information (scheme, amount, certificate)
- How-to guides (boiler, meters, recycling)
- Inventory (move-in condition)
**State Management:** React Query (tenancy documents)
**External Data:** Documents table (filtered by tenant access)

##### `/portal/tenants/move` - Move In/Out Checklists
**Component:** `TenantMove.tsx`
**Required Role:** Tenant
**Key Features:**
- Move-in checklist (meter readings, condition photos, key handover)
- Move-out checklist (cleaning, repairs, meter readings)
- Deposit return tracker
- Inventory upload
**State Management:** React Query (move checklists)
**External Data:** MoveChecklists table (future)

---

### Professional Portals

#### Surveyor Portal

##### `/pro/surveyors/home` - Surveyor Dashboard
**Component:** `SurveyorHome.tsx`
**Required Role:** Surveyor
**Key Features:**
- Assigned jobs table (Property, Type, Date, Status)
- Schedule/calendar view (placeholder)
- Action cards (Pending Reports, Upcoming Inspections)
- Job history
**State Management:** React Query (surveyor jobs)
**External Data:** Jobs table (future)

##### `/pro/surveyors/templates` - Report Templates
**Component:** `SurveyorTemplates.tsx`
**Required Role:** Surveyor
**Key Features:**
- Template list (Level 2, Level 3, Custom)
- Preview modal
- Download/export placeholder
- Create custom template (future)
**State Management:** React Query (templates)
**External Data:** Templates table (future), or static JSON

##### `/pro/surveyors/jobs/:id` - Job Workspace
**Component:** `SurveyorJob.tsx`
**Required Role:** Surveyor
**Key Features:**
- Job details card (property, client, date, fee)
- Property quick facts (from passport)
- File exchange area (upload report, download client docs)
- Status workflow (Scheduled → In Progress → Report Submitted)
**State Management:** React Query (job, property)
**External Data:** Jobs table, properties table, documents table

#### Estate Agent Portal

##### `/pro/agents/home` - Agent Dashboard
**Component:** `AgentHome.tsx`
**Required Role:** Agent
**Key Features:**
- Portfolio grid (properties on market)
- AML/KYC checklist placeholder
- Leads pipeline (future)
- Invite vendor to upload passport CTA
**State Management:** React Query (agent properties)
**External Data:** Properties table (agent_id filter)

##### `/pro/agents/properties/:id` - Marketing Pack
**Component:** `AgentProperty.tsx`
**Required Role:** Agent
**Key Features:**
- Property details (editable)
- Marketing pack generator (photos, floorplan, EPC, description)
- Share buyer link (generates shareable passport URL)
- Listing syndication (placeholder)
**State Management:** React Query (property)
**External Data:** Properties table, documents table, photos table

#### Conveyancer Portal

##### `/pro/conveyancers/home` - Conveyancer Dashboard
**Component:** `ConveyancerHome.tsx`
**Required Role:** Conveyancer
**Key Features:**
- Matters overview table (Property, Stage, Client, Date)
- Requisitions log placeholder
- Pack downloads (search results, title, etc.)
- Upcoming completions
**State Management:** React Query (conveyancer matters)
**External Data:** Matters table (future)

##### `/pro/conveyancers/matters/:id` - Matter Workspace
**Component:** `ConveyancerMatter.tsx`
**Required Role:** Conveyancer
**Key Features:**
- Task timeline (ID Check, Searches, Enquiries, Contracts, Exchange)
- Document checklists (what's received, what's outstanding)
- Client communication log
- Completion date countdown
**State Management:** React Query (matter, tasks, documents)
**External Data:** Matters table, tasks table, documents table

---

### Admin Routes

#### `/admin/users` - User Management
**Component:** `AdminUsers.tsx`
**Required Role:** Admin
**Key Features:**
- User list table (Name, Email, Roles, Status, Joined)
- Search and filters (by role, status)
- Invite flow (modal/drawer)
- Role assignment modal
- Impersonate button (dev only)
- Bulk actions (suspend, activate)
**State Management:** React Query (users list)
**External Data:** profiles table, auth.users (via edge function)
**Components:** DataTable, UserCard, InviteModal

#### `/admin/settings` - Platform Settings
**Component:** `AdminSettings.tsx`
**Required Role:** Admin
**Key Features:**
- Branding section (logo upload, color overrides)
- Feature flags toggles
- Environment info display (version, env, build date)
- Email templates (future)
- Maintenance mode toggle
**State Management:** React Query (settings), Zustand (feature flags)
**External Data:** Settings table (future)

#### `/admin/integrations` - API Configuration
**Component:** `AdminIntegrations.tsx`
**Required Role:** Admin
**Key Features:**
- Per-provider card:
  - Description
  - Docs link
  - Env var name(s)
  - Status indicator (key present?)
  - Test call button (uses mock to confirm wiring)
- Add new integration modal
**State Management:** React Query (integration status)
**External Data:** Supabase secrets (via edge function), test API calls
**Components:** IntegrationCard, TestCallModal

#### `/admin/audit` - Admin Audit Log
**Component:** `AdminAudit.tsx`
**Required Role:** Admin
**Key Features:**
- Event log table (Actor, Action, Resource, Timestamp)
- Filter chips (by actor, type, date range)
- Export CSV placeholder
- Pagination
**State Management:** React Query (audit log)
**External Data:** Audit table (admin actions only)
**Components:** DataTable with advanced filters

---

### User Settings Route

#### `/settings` - User Settings
**Component:** `Settings.tsx`
**Required Role:** Authenticated
**Key Features:**
- Tabs: Profile, Account, Notifications, Privacy
- Profile: Name, phone, avatar upload, bio
- Account: Email change, password change, 2FA (future)
- Notifications: Email/SMS preferences by type
- Privacy: Data export, account deletion
**State Management:** React Query (profile), form state (RHF)
**External Data:** profiles table, auth settings

---

## Route Guards & Access Control

### Guard Components

**`<RequireAuth>`** - Wraps all authenticated routes
- Checks: `auth.user` exists
- Redirect: `/auth/login` if not authenticated
- Usage: Wraps dashboard, properties, portals, admin

**`<RequireRole roles={['owner', 'admin']}>`** - Role-specific access
- Checks: User has at least one of specified roles
- Redirect: `/dashboard` with toast if unauthorized
- Usage: Wraps role-specific portals, admin routes

**`<DevOnly>`** - Development-only features
- Checks: `VITE_APP_ENV === 'development'` or feature flag
- Render: Children if dev, null otherwise
- Usage: Wraps impersonation bar, dev auth bypass, debug panels

### Route Protection Matrix

| Route Pattern | Guest | Authenticated | Owner | Buyer | Surveyor | Agent | Conveyancer | Tenant | Admin |
|---------------|-------|---------------|-------|-------|----------|-------|-------------|--------|-------|
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/auth/*` | ✅ | ➡️ dashboard | ➡️ dashboard | ➡️ dashboard | ➡️ dashboard | ➡️ dashboard | ➡️ dashboard | ➡️ dashboard | ➡️ dashboard |
| `/dashboard` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/properties/*` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/portal/owners/*` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/portal/purchasers/*` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/portal/tenants/*` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/pro/surveyors/*` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/pro/agents/*` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `/pro/conveyancers/*` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/admin/*` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Legend:**
- ✅ Full access
- ❌ No access (redirect)
- ➡️ Redirect target

---

## Navigation Hierarchy

### Primary Navigation (Sidebar)

**For All Authenticated Users:**
- Dashboard
- Notifications
- Inbox
- Properties

**Role-Specific Sections:**
- **Owner:** My Portal → Owner Home, Maintenance, Billing
- **Buyer:** Buyer Portal → Saved Properties, Checklist, Messages
- **Tenant:** Tenant Portal → Home, Repairs, Documents, Move
- **Surveyor:** Pro Tools → Jobs, Templates
- **Agent:** Pro Tools → Portfolio, Marketing
- **Conveyancer:** Pro Tools → Matters
- **Admin:** Admin → Users, Settings, Integrations, Audit

**Bottom Navigation:**
- Settings
- Help
- Logout

---

## State Management Per Route Type

| Route Type | Primary State | Cache Strategy | Realtime? |
|------------|---------------|----------------|-----------|
| Public | None | n/a | No |
| Auth | Form (RHF) | No cache | No |
| Dashboard | React Query | 5 min stale | Yes (activity feed) |
| Property List | React Query + URL params | 1 min stale | No |
| Property Detail | React Query | 5 min stale | No |
| Documents | React Query | No stale (instant refetch) | No |
| Photos | React Query | No stale (instant refetch) | No |
| API Tabs | React Query | 1 hour stale | No |
| Portals | React Query | 5 min stale | Varies |
| Admin | React Query | 30 sec stale | Yes (audit log) |

---

## SEO & Meta Tags

### Route-Level Meta Tags

Each route component should include:

```tsx
import { Helmet } from 'react-helmet-async';

function PropertyPassport() {
  return (
    <>
      <Helmet>
        <title>Property Passport - {property.address} | PPUK</title>
        <meta name="description" content={`View complete property information for ${property.address}`} />
        <meta property="og:title" content={`${property.address} - Property Passport UK`} />
        <meta property="og:description" content="Comprehensive property data in one place" />
        <meta property="og:image" content={property.frontPhotoUrl} />
      </Helmet>
      {/* ... */}
    </>
  );
}
```

**Priority Routes for SEO:**
- `/` - Landing (custom title, max keywords)
- `/about` - About (brand keywords)
- `/pricing` - Pricing (conversion keywords)
- `/properties/:id` - Property passports (long-tail, local keywords)

---

## Mobile Navigation

### Responsive Breakpoints

- **Mobile:** `< 768px` - Hamburger menu, bottom tabs for portals
- **Tablet:** `768px - 1024px` - Collapsible sidebar
- **Desktop:** `>= 1024px` - Full sidebar

### Mobile Menu Structure

**Top Bar (Fixed):**
- Logo (left)
- Search icon (center)
- Menu toggle (right)

**Slide-Out Menu:**
- User avatar + name
- Primary nav items
- Role-specific portals
- Settings
- Logout

**Bottom Tab Bar (Portal-Specific):**
- Owner Portal: Home, Properties, Maintenance, Billing
- Buyer Portal: Saved, Checklist, Messages, Settings
- Tenant Portal: Home, Repairs, Documents, Move

---

## Analytics & Tracking

### Key Events to Track

**Public Routes:**
- Page views (all public pages)
- Search queries (landing search bar)
- CTA clicks (Register, Claim Property)

**Auth Routes:**
- Registration attempts (success/failure)
- Login attempts (success/failure)
- Role selections

**Property Routes:**
- Property views (by ID)
- Document uploads
- Photo uploads
- API data refreshes
- Tab switches

**Portals:**
- Portal entry (which role)
- Feature usage (checklist items, repair requests, etc.)

**Admin:**
- User management actions
- Setting changes
- Integration test calls

---

## Future Route Additions

Routes not in v6.0 but planned:

1. `/compare` - Multi-property comparison tool
2. `/market-insights` - Regional data trends
3. `/api-docs` - Public API documentation (if offering API access)
4. `/partners` - Partner integrations directory
5. `/blog` - Content marketing
6. `/case-studies` - Customer success stories
7. `/integrations/callback/:provider` - OAuth callbacks for integrations

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-10  
**Routes Implemented:** 80+  
**Status:** Complete
