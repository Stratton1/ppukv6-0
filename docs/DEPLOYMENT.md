# Deployment Guide - Property Passport UK v6.0

**Last Updated:** 2025-01-10  
**Version:** 6.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Environments](#environments)
3. [Prerequisites](#prerequisites)
4. [Environment Variables](#environment-variables)
5. [Deployment Steps](#deployment-steps)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Rollback Procedure](#rollback-procedure)
8. [Monitoring & Health Checks](#monitoring--health-checks)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Property Passport UK is deployed as a static site using Vite, served via Vercel (or similar platform), with Supabase handling backend services (database, auth, storage).

### Architecture

```
┌─────────────────┐
│   Vercel/CDN    │  ← Frontend (Static files)
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   Supabase      │  ← Backend (PostgreSQL + Auth + Storage)
│   (Cloud)       │
└─────────────────┘
```

---

## 🌍 Environments

### Development
- **Location:** Local machine
- **URL:** `http://localhost:8080`
- **Database:** Supabase (dev project)
- **Purpose:** Local development and testing

### Staging
- **Location:** Vercel Preview
- **URL:** `https://ppuk-staging.vercel.app` (or preview URL)
- **Database:** Supabase (staging project)
- **Purpose:** Pre-production testing, QA

### Production
- **Location:** Vercel Production
- **URL:** `https://propertypassport.uk` (or your domain)
- **Database:** Supabase (production project)
- **Purpose:** Live application

---

## 📦 Prerequisites

### Required Accounts
- ✅ **Vercel Account** - For hosting
- ✅ **Supabase Account** - For backend services
- ✅ **GitHub Account** - For version control and CI/CD

### Required Tools
- Node.js 20+ (for local builds)
- npm, yarn, or pnpm
- Git
- Vercel CLI (optional, for manual deployments)

### Required Access
- Vercel project access
- Supabase project admin access
- GitHub repository access

---

## 🔐 Environment Variables

### Required Variables

All environments require these variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Environment
VITE_APP_ENV=production  # or "development" or "preview"
```

### Optional Variables (Future)

```env
# External API Keys (when implemented)
VITE_EPC_API_KEY=your-epc-api-key
VITE_EA_FLOOD_API_KEY=your-ea-api-key
VITE_HMLR_API_KEY=your-hmlr-api-key
VITE_PLANNING_API_KEY=your-planning-api-key
```

### Setting Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable for the appropriate environment:
   - **Production:** Production deployments
   - **Preview:** Preview deployments
   - **Development:** Local development (via `.env` file)

---

## 🚀 Deployment Steps

### Automated Deployment (Recommended)

**Via GitHub Actions + Vercel:**

1. **Push to main branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature
   # Make changes
   git add .
   git commit -m "feat: your feature"
   git push origin feature/your-feature
   ```

2. **Create Pull Request:**
   - GitHub Actions runs CI checks
   - Vercel creates preview deployment
   - Review and test preview

3. **Merge to main:**
   - CI checks must pass
   - Merge PR
   - Vercel automatically deploys to production

### Manual Deployment

**Via Vercel CLI:**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Via Vercel Dashboard:**

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Click "Redeploy" on latest deployment
4. Or connect GitHub repo for automatic deployments

### Build Process

The build process runs automatically, but you can test locally:

```bash
# Install dependencies
npm ci

# Run tests
npm run test:run

# Build for production
npm run build

# Preview production build
npm run preview
```

**Build Output:**
- Location: `dist/`
- Contains: HTML, CSS, JS bundles
- Size: ~500KB initial load (target)

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The CI pipeline (`.github/workflows/ci.yml`) runs on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Pipeline Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js 20
3. ✅ Install dependencies (`npm ci`)
4. ✅ Run linter (`npm run lint`)
5. ✅ Type check (`tsc --noEmit`)
6. ✅ Run tests with coverage (`npm run test:coverage`)
7. ✅ Upload coverage to Codecov (optional)
8. ✅ Build (`npm run build`)
9. ✅ Upload build artifacts

### Branch Protection Rules

**Recommended Settings:**
- Require status checks to pass before merging
- Require `build-and-test` job to pass
- Require up-to-date branches
- Restrict direct pushes to `main`

**Setup:**
1. Go to GitHub → Repository → Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks to pass"
4. Select `build-and-test` check
5. Save changes

---

## 🔙 Rollback Procedure

### Quick Rollback (Vercel Dashboard)

1. Go to Vercel Dashboard → Your Project → Deployments
2. Find the previous working deployment
3. Click "..." menu → "Promote to Production"
4. Confirm promotion

### Rollback via Git

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or revert to specific commit
git revert <commit-hash>
git push origin main
```

### Rollback via Vercel CLI

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

### Database Rollback

If database migrations need rollback:

```bash
# Via Supabase CLI
supabase db reset

# Or manually via Supabase Dashboard
# Go to SQL Editor → Run rollback migration
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoint

Create a health check route (future):

```typescript
// src/pages/Health.tsx
export default function Health() {
  return { status: "ok", timestamp: new Date().toISOString() };
}
```

**URL:** `/health`

### Monitoring Tools

**Recommended:**
- **Vercel Analytics** - Built-in performance monitoring
- **Sentry** - Error tracking (to be implemented)
- **Supabase Dashboard** - Database and API monitoring
- **GitHub Actions** - CI/CD status

### Key Metrics to Monitor

- **Build Time:** < 2 minutes
- **Deployment Time:** < 5 minutes
- **Error Rate:** < 0.1%
- **Response Time:** < 500ms (p95)
- **Uptime:** > 99.9%

---

## 🐛 Troubleshooting

### Build Failures

**Issue:** Build fails in CI/CD

**Solutions:**
1. Check build logs in GitHub Actions
2. Test build locally: `npm run build`
3. Check for TypeScript errors: `npx tsc --noEmit`
4. Verify all dependencies installed: `npm ci`
5. Check Node.js version (requires 20+)

### Environment Variable Issues

**Issue:** App not working after deployment

**Solutions:**
1. Verify variables set in Vercel Dashboard
2. Check variable names (must start with `VITE_`)
3. Ensure no typos in variable values
4. Redeploy after adding variables
5. Check browser console for errors

### Database Connection Issues

**Issue:** Cannot connect to Supabase

**Solutions:**
1. Verify `VITE_SUPABASE_URL` is correct
2. Verify `VITE_SUPABASE_PUBLISHABLE_KEY` is correct
3. Check Supabase project is active
4. Verify RLS policies allow access
5. Check network connectivity

### Deployment Not Updating

**Issue:** Changes not appearing after deployment

**Solutions:**
1. Clear browser cache
2. Check deployment logs in Vercel
3. Verify build completed successfully
4. Check if correct branch deployed
5. Force redeploy in Vercel Dashboard

---

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm run test:run`)
- [ ] Linter passing (`npm run lint`)
- [ ] Type check passing (`npx tsc --noEmit`)
- [ ] Build successful (`npm run build`)
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied (if any)
- [ ] Documentation updated

### Post-Deployment

- [ ] Verify production URL loads correctly
- [ ] Test authentication flow
- [ ] Test critical user paths
- [ ] Check error monitoring (Sentry)
- [ ] Verify performance metrics
- [ ] Monitor for errors in first hour

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **GitHub Actions:** https://github.com/[org]/[repo]/actions
- **Project Documentation:** `/docs/` folder

---

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review deployment logs
3. Check GitHub Issues
4. Contact team lead

---

**Last Updated:** 2025-01-10  
**Maintained By:** Development Team

