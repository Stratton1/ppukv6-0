# Property Passport UK v6 - Codebase Overview

## Purpose
This document provides a comprehensive overview of the Property Passport UK v6 codebase, designed to help developers understand the project structure, architecture, and key components.

## How to Use
- **New developers**: Start here to understand the project structure
- **Contributors**: Use as a reference for navigation and understanding
- **Maintainers**: Reference for architectural decisions and patterns

## Table of Contents
1. [Project Summary](#project-summary)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Key Directories](#key-directories)
5. [Development Workflow](#development-workflow)
6. [Next Steps](#next-steps)

## Project Summary

Property Passport UK v6 is a comprehensive property information platform that aggregates data from multiple UK government and commercial sources to create detailed property profiles. The platform serves property owners, buyers, and professionals with essential property data including EPC ratings, flood risk, planning applications, and more.

### Core Features
- **Property Search & Discovery**: Search properties by postcode, address, or UPRN
- **Property Passports**: Comprehensive property profiles with aggregated data
- **Document Management**: Upload and manage property documents
- **User Authentication**: Role-based access (owners, buyers, professionals)
- **External API Integration**: EPC, HMLR, Flood Risk, Planning data
- **Responsive Design**: Mobile-first approach with modern UI

## Repository Structure

```
ppukv6-0/
├── src/                          # Main application source code
│   ├── components/               # Reusable UI components
│   │   ├── ui/                  # Shadcn/UI base components
│   │   ├── business/            # Domain-specific components
│   │   └── layout/              # Layout components
│   ├── pages/                   # Route components
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/          # User dashboard
│   │   └── public/             # Public pages
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions
│   ├── integrations/           # External service integrations
│   │   └── supabase/           # Supabase client and types
│   └── types/                   # TypeScript type definitions
├── supabase/                    # Database schema and migrations
├── public/                      # Static assets
├── docs/                        # Documentation
├── scripts/                     # Build and deployment scripts
└── config/                      # Configuration files
```

## Technology Stack

### Frontend
- **React 18.3.1**: Modern React with hooks and concurrent features
- **TypeScript 5.8.3**: Type-safe development
- **Vite 5.4.19**: Fast build tool and dev server
- **React Router 6.30.1**: Client-side routing
- **TanStack Query 5.83.0**: Server state management and caching

### UI & Styling
- **Tailwind CSS 3.4.18**: Utility-first CSS framework
- **Shadcn/UI**: High-quality component library
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Next Themes**: Dark/light mode support

### Backend & Database
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Storage
  - Edge functions

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Playwright**: End-to-end testing
- **TypeScript**: Static type checking

## Key Directories

### `/src` - Application Source
- **`components/`**: Reusable UI components organized by domain
- **`pages/`**: Route components following feature-based organization
- **`hooks/`**: Custom React hooks for shared logic
- **`lib/`**: Utility functions and helpers
- **`integrations/`**: External service clients and configurations
- **`types/`**: TypeScript type definitions

### `/supabase` - Database & Backend
- **`migrations/`**: Database schema changes
- **`functions/`**: Edge functions for server-side logic
- **Schema definitions**: Type-safe database schema

### `/public` - Static Assets
- **Images, fonts, and other static files**
- **Test files for development**

### `/docs` - Documentation
- **`cursor/`**: This documentation suite
- **Project documentation and guides**

## Development Workflow

### Getting Started
1. **Clone the repository**
2. **Install dependencies**: `npm install` or `pnpm install`
3. **Set up environment**: Copy `.env.example` to `.env.local`
4. **Configure Supabase**: Add your Supabase credentials
5. **Start development**: `npm run dev`

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm run typecheck`: Run TypeScript compiler

### Environment Setup
Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-side only)

## Next Steps

1. **Read [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)** for detailed system architecture
2. **Follow [ONBOARDING_PATH.md](./ONBOARDING_PATH.md)** for step-by-step learning
3. **Check [ROUTES_AND_PAGES.md](./ROUTES_AND_PAGES.md)** for route documentation
4. **Review [COMPONENTS_HANDBOOK.md](./COMPONENTS_HANDBOOK.md)** for component usage

## References
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Shadcn/UI Documentation](https://ui.shadcn.com/)
