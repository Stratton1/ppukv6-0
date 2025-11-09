# Property Passport UK v6.0

> Comprehensive property data platform for owners, buyers, and professionals

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58-green.svg)](https://supabase.com/)
[![CI](https://github.com/Stratton1/ppukv6-0/actions/workflows/ci.yml/badge.svg)](https://github.com/Stratton1/ppukv6-0/actions/workflows/ci.yml)

## 🎯 Overview

Property Passport UK is a comprehensive platform that consolidates all property-related data in one place. Property owners can create digital passports for their properties, buyers can access complete due diligence information, and professionals can collaborate seamlessly.

### Key Features

- **Property Passports** - Complete digital records for any UK property
- **Document Management** - Secure storage and organization of property documents
- **Photo Galleries** - Professional property photography with room categorization
- **External API Integration** - EPC, flood risk, planning, and HMLR data
- **Role-Based Access** - Owners, buyers, surveyors, agents, conveyancers, and tenants
- **Completeness Scoring** - Track passport completion with visual progress indicators

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm, yarn, or pnpm
- Supabase account and project

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ppukv6-0

# Install dependencies
npm install
# or
pnpm install
# or
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Environment Variables

See `.env.example` for all required variables. Minimum required:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_APP_ENV=development
```

For detailed setup instructions, see [docs/ENV_AND_AUTH.md](docs/ENV_AND_AUTH.md)

## 📁 Project Structure

```
ppukv6-0/
├── docs/                    # Documentation
│   ├── implementation/      # Implementation details
│   ├── testing/            # Testing guides
│   ├── ENV_AND_AUTH.md    # Environment & auth setup
│   ├── ROUTES.md          # Complete route documentation
│   └── FRONTEND_PLAN.md   # Frontend architecture
├── scripts/                # Utility scripts
│   ├── seed-dev-data.sql  # Database seed script
│   └── seed-supabase-users.js  # User seeding script
├── src/
│   ├── app/               # App-level configuration
│   │   └── auth/          # Auth guards & providers
│   ├── components/        # React components
│   │   ├── ui/           # Shadcn UI components
│   │   ├── property/     # Property-related components
│   │   ├── auth/         # Auth-related components
│   │   ├── layout/       # Layout components
│   │   └── dev/          # Development tools
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Third-party integrations
│   ├── lib/              # Utilities & helpers
│   │   ├── apis/         # API clients & mock data
│   │   ├── env.ts        # Environment validation
│   │   └── supabase/     # Supabase client
│   └── pages/            # Route pages
├── supabase/             # Supabase configuration
│   ├── functions/        # Edge functions
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run lint         # Run ESLint
npm run preview      # Preview production build
npm run test         # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
npm run test:run     # Run tests once (for CI)
```

### Testing

For testing instructions, see:
- [docs/testing/README_TESTING.md](docs/testing/README_TESTING.md)
- [docs/how-to-test-passports.md](docs/how-to-test-passports.md)

### Development Tools

- **Test Login**: Visit `/test-login` for quick authentication
- **Debug Environment**: Visit `/debug/env` (dev only) to check environment variables
- **Dev Auth Bypass**: Available on login page in development mode

## 📚 Documentation

### 🗺️ **Start Here:**
- **[Complete Project Roadmap](docs/PROJECT_ROADMAP.md)** ⭐ - Comprehensive guide from start to finish (perfect for new colleagues)

### 📋 Core Documentation:
- **[Project Status](PROJECT_STATUS.md)** - Current state and organization
- **[Next Steps](NEXT_STEPS.md)** - Prioritized roadmap and recommendations
- **[Architecture](docs/ARCHITECTURE.md)** - Technical architecture details
- **[Routes](docs/ROUTES.md)** - Complete route documentation (80+ routes)
- **[Frontend Plan](docs/FRONTEND_PLAN.md)** - Frontend architecture and plans

### 🔧 Setup & Configuration:
- **[Environment Setup](docs/ENV_AND_AUTH.md)** - Environment variables and authentication
- **[Implementation Status](docs/IMPLEMENTATION_STATUS.md)** - Feature implementation tracking
- **[Troubleshooting](docs/troubleshooting-auth.md)** - Common issues and solutions

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18.3 + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn UI + Radix UI
- **Routing**: React Router v6
- **State Management**: React Query + Zustand
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Forms**: React Hook Form + Zod validation

### Key Patterns

- **Server Components**: Prefer server-side rendering where possible
- **Type Safety**: TypeScript throughout with strict type checking
- **Component Organization**: Feature-based folder structure
- **Environment Validation**: Zod-based env variable validation
- **Error Handling**: Comprehensive error boundaries and user feedback

## 🔐 Security

- Row Level Security (RLS) on all database tables
- Secure file uploads with type validation
- Environment variable validation
- Auth guards on protected routes
- Role-based access control

## 🚢 Deployment

The application is configured for deployment on platforms that support Vite builds:

1. Set environment variables in your deployment platform
2. Run `npm run build`
3. Serve the `dist` folder

**For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

### Quick Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

For Supabase deployment, see [Supabase documentation](https://supabase.com/docs/guides/hosting/overview).

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 📄 License

UNLICENSED - Proprietary software

## 🆘 Support

- **Documentation**: Check the `docs/` folder
- **Environment Issues**: See [docs/ENV_AND_AUTH.md](docs/ENV_AND_AUTH.md)
- **Troubleshooting**: See [docs/troubleshooting-auth.md](docs/troubleshooting-auth.md)

## 🗺️ Roadmap

See [docs/FRONTEND_PLAN.md](docs/FRONTEND_PLAN.md) for planned features and roadmap.

---

**Built with ❤️ for the UK property market**
