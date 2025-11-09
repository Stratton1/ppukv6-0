# Contributing to Property Passport UK

Thank you for your interest in contributing! This document provides guidelines and best practices for contributing to the project.

## 🎯 Getting Started

1. **Fork the repository** and clone your fork
2. **Create a branch** from `main`: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the guidelines below
4. **Test your changes** thoroughly
5. **Submit a pull request** with a clear description

## 📋 Code Style

### TypeScript

- Use TypeScript for all new code
- Prefer `interface` over `type` for object shapes
- Avoid `any` - use `unknown` or proper types
- Use type inference where possible, but be explicit for function returns

### React Components

- Use functional components with hooks
- Prefer named exports over default exports
- Use descriptive component names (PascalCase)
- Keep components focused and single-purpose
- Use TypeScript interfaces for props

### File Naming

- **Components**: `PascalCase.tsx` (e.g., `PropertyCard.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Hooks**: `use-kebab-case.tsx` (e.g., `use-property-data.tsx`)
- **Pages**: `PascalCase.tsx` (e.g., `Dashboard.tsx`)

### Folder Structure

- Organize components by feature: `components/property/`, `components/auth/`
- Keep shared UI components in `components/ui/`
- Group related utilities in `lib/` subfolders

## 🧪 Testing

- Test your changes locally before submitting
- Use the test login page (`/test-login`) for quick testing
- Verify environment variables are set correctly
- Check browser console for errors

## 📝 Commit Messages

Use clear, descriptive commit messages:

```
feat: Add property comparison feature
fix: Resolve document upload error handling
docs: Update README with deployment instructions
refactor: Reorganize component structure
style: Format code with Prettier
test: Add tests for property search
```

## 🔍 Code Review Process

1. All PRs require review before merging
2. Address review comments promptly
3. Keep PRs focused - one feature or fix per PR
4. Update documentation if needed

## 🐛 Reporting Issues

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps to reproduce
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Browser, OS, Node version
- **Screenshots**: If applicable

## ✨ Feature Requests

For feature requests:

- Check if the feature is already planned
- Provide a clear use case
- Explain the expected behavior
- Consider edge cases

## 📚 Documentation

- Update relevant documentation when adding features
- Add JSDoc comments for new functions
- Update README if setup changes
- Keep inline comments clear and concise

## 🔐 Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Follow security best practices
- Report security issues privately

## 🎨 UI/UX Guidelines

- Follow existing design patterns
- Use Shadcn UI components when possible
- Ensure responsive design (mobile-first)
- Maintain accessibility standards (WCAG AA)
- Use consistent spacing and typography

## 🚀 Development Workflow

1. **Start development server**: `npm run dev`
2. **Check linting**: `npm run lint`
3. **Build locally**: `npm run build`
4. **Test production build**: `npm run preview`

## 📦 Dependencies

- **Add dependencies**: Use `npm install <package>`
- **Update dependencies**: Keep dependencies up to date
- **Remove unused**: Clean up unused dependencies
- **Document**: Note why a dependency is needed

## 🏗️ Architecture Decisions

- Follow existing patterns
- Keep components modular and reusable
- Use React Query for data fetching
- Prefer server components where possible
- Use Zustand for client-side state

## ❓ Questions?

- Check existing documentation in `docs/`
- Review existing code for patterns
- Ask in discussions or issues

---

Thank you for contributing to Property Passport UK! 🎉

