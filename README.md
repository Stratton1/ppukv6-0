⸻


# 🏠 Property Passport UK v6.0

**Digital transparency for every UK property.**  
A unified platform bringing together verified property data, professional reports, and live environmental insights — built for owners, purchasers, tenants, and property professionals.

---

## 🔍 Overview

**Property Passport UK (PPUK)** is an open, extensible property intelligence platform designed to centralise all data related to a single property.  
Each property is identified by its **Unique Property Reference Number (UPRN)** and enriched with data from verified government and industry sources.

The platform provides:

- Unified data workspace per property (EPC, Flood Risk, Planning, Price Paid, etc.)
- Secure storage for professional reports and compliance documents
- Role-based portals for Owners, Purchasers, Tenants, and Professionals
- AI-ready architecture for document parsing, property insights, and risk analysis
- Full Supabase backend with RLS (Row Level Security) for data integrity

---

## ⚙️ Technology Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| Frontend | **Vite + React + TypeScript** | Fast, typed, modular UI |
| Styling | **Tailwind CSS + shadcn/ui** | Modern, accessible design system |
| State & Data | **Zustand + React Query** | Local and async data management |
| Backend | **Supabase (Postgres + Edge Functions)** | Auth, API, Storage, RLS |
| Documentation | **Cursor + Lovable integration** | Auto-generated dev documentation |
| Hosting | **Vercel / Supabase Cloud / Lovable Cloud** | Scalable deployment |

---

## 🗂️ Repository Structure

ppukv6-0/
├── supabase/                # Database migrations, RLS policies, edge functions
│   ├── migrations/          # SQL migrations for schema + policies
│   ├── functions/           # Serverless functions (EPC, Flood, etc.)
│   └── seed/                # Optional development data
├── server/                  # Shared server utilities (types, env, cache)
├── src/                     # Frontend (Lovable-built React app)
│   ├── components/          # UI components
│   ├── pages/               # Routes and page layouts
│   ├── hooks/               # React hooks (query, auth, etc.)
│   ├── store/               # Zustand state stores
│   └── utils/               # Shared frontend utilities
├── docs/                    # Documentation suite
│   ├── cursor-backend/      # Backend architecture and API docs
│   ├── cursor/              # Developer documentation (Cursor-generated)
│   ├── lovable/             # Frontend documentation (Lovable-generated)
│   └── roadmap.md           # Feature and milestone planning
├── public/                  # Static assets
├── .env.example             # Environment variable template
├── package.json             # Scripts and dependencies
└── README.md                # You are here

---

## 🧱 Core Modules

| Module | Description |
|---------|--------------|
| **Auth & Roles** | Supabase Auth with roles for Owner, Purchaser, Tenant, Professional, Admin. |
| **Property Workspace** | Core dashboard showing property data and documents by UPRN. |
| **Document Vault** | Secure upload and retrieval of reports, warranties, and certificates. |
| **External Integrations** | Free UK government & open data APIs (EPC, Flood, Planning, Price Paid, etc.). |
| **Audit & Compliance** | Full event tracking, RLS enforcement, and GDPR-ready architecture. |
| **AI & Insights (future)** | OCR and analysis for uploaded documents, automated property grading. |

---

## 🌍 External APIs (Free Priority)

The backend integrates or stubs the following **free** UK data sources:

1. EPC (Energy Performance Certificates)  
2. Environment Agency Flood Risk  
3. Planning.data.gov.uk  
4. HM Land Registry Price Paid  
5. Companies House  
6. VOA (Council Tax)  
7. Postcodes.io  
8. DEFRA / MAGIC map layers  
9. UK Police API  
10. British Geological Survey (link-out)  
11. FENSA, Gas Safe, EICR, HSE (link-outs only)

Commercial APIs (OS Places, Google Maps, Stripe, etc.) are **stubbed** with code-box instructions for manual access until licensed.

---

## 🧩 Multiple Storage Buckets

Supabase Storage is used for secure file handling, divided by category:

| Bucket | Purpose |
|--------|----------|
| `property-images` | Property and site photographs |
| `professional-reports` | Surveyor, valuation, and conveyancer reports |
| `warranties-guarantees` | FENSA, EICR, Gas Safe, and warranty docs |
| `planning-docs` | Planning permissions and decision notices |
| `misc-docs` | Any other associated files |

All buckets use **path-based RLS policies**:  
`<bucket>/property/<property_id>/<yyyy>/<mm>/<filename>`

---

## 🚀 Getting Started (Local Dev)

### 1. Clone and install
```bash
git clone git@github.com:Stratton1/ppukv6-0.git
cd ppukv6-0
npm install

2. Configure environment

Copy .env.example → .env.local and populate:

VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_key>

3. Run locally

npm run dev

Then visit http://localhost:5173

⸻

⚡ Backend Development

To work with Supabase locally:

supabase start          # Launch local database and APIs
supabase db reset       # Reset to match latest migrations
supabase db push        # Apply schema changes
supabase functions serve

Edge functions are in /supabase/functions.
Run tests or trigger them via curl for local verification.

⸻

🧠 Developer Workflows

Tool	Purpose
Cursor AI	Backend architecture, documentation, and API build-out
Lovable AI	Frontend generation, layout design, and UI polish
Claude / ChatGPT	QA, copywriting, schema reviews
Supabase Studio	Database, Storage, and RLS management
Vercel / Lovable Cloud	Deployment targets

All tools work additively.
Lovable handles frontend; Cursor handles backend and documentation.

⸻

📘 Documentation Index
	•	Backend: /docs/cursor-backend/
	•	BACKEND_OVERVIEW.md – system design
	•	SCHEMA.md – database tables
	•	EDGE_FUNCTIONS.md – serverless APIs
	•	INTEGRATIONS.md – data provider details
	•	AUDIT_AND_COMPLIANCE.md – RLS and audit rules
	•	Frontend: /docs/lovable/
	•	Page structure, components, and style guide
	•	Full Developer Guide: /docs/cursor/
	•	Architecture, routes, components, onboarding

⸻

🔒 Security & Compliance
	•	Full Row Level Security (RLS) in all Supabase tables
	•	Scoped access by property_parties and roles
	•	GDPR-ready architecture with audit trail
	•	No secrets exposed to client — only VITE_* anon keys
	•	Service keys stored in Supabase Secrets

⸻

🧭 Roadmap (Snapshot)

Phase	Focus	Status
1	Core schema, RLS, base APIs	✅ Complete
2	Edge functions, storage, audit	🚧 In progress
3	Portals (Owners, Buyers, Tenants, Pros)	⏳ Next
4	AI document extraction & insights	⏳ Planned
5	Payments, subscriptions, and automation	⏳ Planned

Detailed milestones live in /docs/roadmap.md

⸻

🧩 Contribution

Branching convention

main                  → stable, production-ready
restore6.0_v1.0       → baseline restoration branch
cursor/backend-v1     → backend development
cursor/docs-v1        → backend docs and architecture
lovable/frontend-v1   → frontend build

Commit convention

feat(<scope>): new feature
fix(<scope>): bug fix
docs(<scope>): documentation update
refactor(<scope>): structural change

Typical workflow

git checkout -b cursor/backend-v1
git add .
git commit -m "feat(backend): add planning and pricepaid functions"
git push -u origin cursor/backend-v1


⸻

🧠 Learning Path

If you’re new to this codebase:
	1.	Start with /docs/cursor/CODEBASE_OVERVIEW.md
	2.	Follow /docs/cursor/ONBOARDING_PATH.md
	3.	Review /docs/cursor-backend/BACKEND_OVERVIEW.md
	4.	Run local tests and experiment with /supabase/functions/*

Each document is designed to teach you step-by-step — from HTML basics to full-stack Supabase workflows.

⸻

💡 Vision

PPUK is building a transparent property ecosystem.
Every property should have a single digital passport — a secure, continuously updated profile combining public data, professional insight, and owner documentation.

“Own your property data — for life.”

⸻

📫 Support & Contact

Maintainer: Joseph B. Weaver
Email: joe@jbs-surveying.co.uk
Company: JBS Residential Developments & JBS Surveying Ltd
Location: London, UK

⸻

🏁 License

© 2025 Property Passport UK.
Open for internal and collaborative development.
All integrations comply with open-data licence terms.

---