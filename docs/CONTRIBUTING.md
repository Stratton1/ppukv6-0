# Contributing to Property Passport UK

Thank you for your interest in contributing to Property Passport UK! This guide will help you get started with development and understand our processes.

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or later
- npm or yarn package manager
- Git
- Supabase account (for database access)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/ppukv6-0.git
   cd ppukv6-0
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:8080`
   - Test login page: `http://localhost:8080/test-login`

## 🛠️ Development Workflow

### Available Scripts

| Script                 | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start development server     |
| `npm run build`        | Build for production         |
| `npm run preview`      | Preview production build     |
| `npm run typecheck`    | Run TypeScript type checking |
| `npm run lint`         | Run ESLint                   |
| `npm run format`       | Format code with Prettier    |
| `npm run format:check` | Check code formatting        |

### Code Quality Standards

#### TypeScript

- Use strict TypeScript configuration
- Avoid `any` types when possible
- Use proper type definitions for all functions and components
- Run `npm run typecheck` before committing

#### Code Formatting

- Use Prettier for consistent formatting
- Run `npm run format` before committing
- Follow the configured style (semi-colons, double quotes, 100 char width)

#### ESLint

- Follow ESLint rules for code quality
- Run `npm run lint` to check for issues
- Fix warnings and errors before committing

## 📝 Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit messages.

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `ci`: CI/CD changes

### Examples

```bash
feat(auth): add user registration flow
fix(ui): resolve button alignment issue
docs(readme): update installation instructions
chore(deps): update dependencies
ci(workflow): add typecheck to CI pipeline
```

## 🔄 CI/CD Pipeline

Our GitHub Actions workflow runs on every push and pull request to `main` and `develop` branches.

### Pipeline Steps

1. **Checkout code** - Get the latest code
2. **Setup Node.js 20.x** - Install Node.js with caching
3. **Install dependencies** - `npm ci` for clean install
4. **Type check** - `npm run typecheck`
5. **Lint** - `npm run lint`
6. **Format check** - `npm run format:check`
7. **Build** - `npm run build`

### Fixing CI Failures

#### TypeScript Errors

```bash
npm run typecheck
# Fix any TypeScript errors
# Add proper type annotations
# Use type assertions carefully
```

#### ESLint Errors

```bash
npm run lint
# Fix linting issues
# Use --fix flag for auto-fixable issues
npm run lint -- --fix
```

#### Formatting Issues

```bash
npm run format:check
# Check formatting issues
npm run format
# Auto-fix formatting
```

#### Build Failures

```bash
npm run build
# Check for build errors
# Fix import issues
# Resolve dependency conflicts
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── business/       # Business logic components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components (shadcn)
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   ├── dev/            # Development tools
│   └── public/         # Public pages
├── lib/                # Utility libraries
│   ├── apis/           # API integration
│   └── dev/            # Development utilities
├── integrations/       # External integrations
│   └── supabase/       # Supabase client and types
├── types/              # TypeScript type definitions
└── hooks/              # Custom React hooks
```

## 🧪 Testing

### Manual Testing

- Use `/test-login` page for development testing
- Test both owner and buyer user flows
- Verify property passport functionality
- Check file upload/download features

### Database Testing

- Ensure Supabase migrations are applied
- Test RLS policies
- Verify storage bucket configurations

## 🐛 Debugging

### Common Issues

#### "Module not found" errors

- Check import paths use `@/` alias
- Verify file extensions (.ts, .tsx)
- Ensure proper export/import syntax

#### TypeScript errors

- Run `npm run typecheck` to see all errors
- Check for missing type definitions
- Verify Supabase schema types

#### Build failures

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for circular dependencies
- Verify all imports are correct

### Development Tools

- Browser DevTools for debugging
- Supabase Dashboard for database inspection
- Network tab for API debugging
- Console for error messages

## 📚 Documentation

- `docs/REPAIR_LOG.md` - Build fixes and changes
- `docs/CONTRIBUTING.md` - This file
- `docs/COMPREHENSIVE_ROADMAP.md` - Project roadmap
- `docs/CURRENT_STATUS.md` - Current project status

## 🤝 Pull Request Process

1. **Create feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Write code following our standards
   - Add tests if applicable
   - Update documentation

3. **Test locally**

   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm run build
   ```

4. **Commit changes**

   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

5. **Push and create PR**

   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

6. **Address feedback**
   - Respond to review comments
   - Make requested changes
   - Ensure CI passes

## 📞 Getting Help

- Check existing documentation
- Review `docs/REPAIR_LOG.md` for common fixes
- Ask questions in GitHub issues
- Join our development discussions

## 🎯 Development Priorities

### Current Focus

1. **Database Migration** - Complete Supabase schema setup
2. **Type Safety** - Resolve remaining TypeScript errors
3. **API Integration** - Connect real external APIs
4. **Testing** - Comprehensive test coverage

### Future Enhancements

1. **AI Document Analysis** - Automated data extraction
2. **Performance Optimization** - Image optimization, caching
3. **Enhanced Features** - Advanced property management
4. **Production Deployment** - Full production readiness

---

**Thank you for contributing to Property Passport UK!** 🏠✨
