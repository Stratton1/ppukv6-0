# Property Passport UK v6 - Routes and Pages

## Purpose
This document provides a comprehensive overview of all routes, pages, and their functionality in the Property Passport UK v6 application.

## How to Use
- **Developers**: Reference for understanding page structure and routing
- **Contributors**: Guide for adding new pages and routes
- **Maintainers**: Overview of page responsibilities and dependencies

## Table of Contents
1. [Route Structure](#route-structure)
2. [Public Routes](#public-routes)
3. [Authentication Routes](#authentication-routes)
4. [Protected Routes](#protected-routes)
5. [Development Routes](#development-routes)
6. [Page Components](#page-components)
7. [Navigation Patterns](#navigation-patterns)

## Route Structure

The application uses React Router v6 with the following route hierarchy:

```typescript
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/search" element={<SearchResults />} />
  <Route path="/property/:id" element={<PropertyPassport />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/test-login" element={<TestLogin />} />
  <Route path="/debug/storage" element={<DebugStorage />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/claim" element={<ClaimProperty />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

## Public Routes

### `/` - Home Page
- **Component**: `IndexPage.tsx` → `Home.tsx`
- **Access**: Public
- **Purpose**: Landing page with search functionality
- **Features**:
  - Hero section with search bar
  - Feature highlights
  - Call-to-action sections
  - Navigation to registration/login

**Key Components Used**:
- `Navbar`: Site navigation
- `Button`: CTA buttons
- `Input`: Search functionality

### `/search` - Search Results
- **Component**: `SearchResults.tsx`
- **Access**: Public
- **Purpose**: Display property search results
- **Features**:
  - Property listing with filters
  - Search result pagination
  - Property preview cards

### `/property/:id` - Property Passport
- **Component**: `PropertyPassport.tsx`
- **Access**: Public (with owner-specific features)
- **Purpose**: Detailed property information and management
- **Features**:
  - Property details and photos
  - Document management
  - API data integration (EPC, Flood Risk, etc.)
  - Owner-specific actions (if authenticated)

**Key Components Used**:
- `DocumentUploader`: File upload functionality
- `PhotoGallery`: Image display and management
- `APIPreviewCard`: External API data display
- `PassportScore`: Property completion tracking

## Authentication Routes

### `/login` - User Login
- **Component**: `Login.tsx`
- **Access**: Public (redirects if authenticated)
- **Purpose**: User authentication
- **Features**:
  - Email/password login form
  - Supabase authentication integration
  - Development auth bypass
  - Error handling and validation

**Form Fields**:
- Email (required)
- Password (required)

**Authentication Flow**:
1. Form validation
2. Supabase auth call
3. Success: Redirect to dashboard
4. Error: Display error message

### `/register` - User Registration
- **Component**: `Register.tsx`
- **Access**: Public
- **Purpose**: New user account creation
- **Features**:
  - User registration form
  - Profile creation
  - Role selection (Owner, Buyer, Professional)
  - Email verification

### `/settings` - User Settings
- **Component**: `Settings.tsx`
- **Access**: Authenticated users only
- **Purpose**: User profile and account management
- **Features**:
  - Profile information editing
  - Password change
  - Account preferences
  - Data export options

## Protected Routes

### `/dashboard` - User Dashboard
- **Component**: `Dashboard.tsx`
- **Access**: Authenticated users only
- **Purpose**: User's property portfolio overview
- **Features**:
  - User profile display
  - Property statistics
  - Quick actions (claim property)
  - Property listing with management options

**Data Sources**:
- User profile from `profiles` table
- User's properties from `properties` table
- Property completion statistics

**Key Components Used**:
- `PropertyCard`: Property display cards
- `Card`: Statistics and action cards
- `Button`: Action buttons

### `/claim` - Claim Property
- **Component**: `ClaimProperty.tsx`
- **Access**: Authenticated users only
- **Purpose**: Add new properties to user's portfolio
- **Features**:
  - Multi-step property form
  - Address validation
  - Property details collection
  - Document upload

**Form Steps**:
1. **Address Information**: Postcode, address lines, city
2. **Property Details**: Type, style, bedrooms, bathrooms
3. **Additional Info**: Floor area, year built, tenure
4. **Confirmation**: Review and submit

**Form Fields**:
- Address: `postcode`, `addressLine1`, `addressLine2`, `city`
- Property: `propertyType`, `propertyStyle`, `bedrooms`, `bathrooms`
- Details: `floorArea`, `yearBuilt`, `tenure`, `titleNumber`

## Development Routes

### `/test-login` - Test Authentication
- **Component**: `TestLogin.tsx`
- **Access**: Development only
- **Purpose**: Development authentication testing
- **Features**:
  - Quick login for development
  - Test user creation
  - Authentication state debugging

### `/debug/storage` - Storage Debug
- **Component**: `DebugStorage.tsx`
- **Access**: Development only
- **Purpose**: Debug storage and data
- **Features**:
  - Local storage inspection
  - Supabase data debugging
  - Authentication state display

## Page Components

### Layout Components
All pages use consistent layout patterns:

```typescript
<div className="min-h-screen bg-background">
  <Navbar />
  <div className="container mx-auto px-4 py-8">
    {/* Page content */}
  </div>
</div>
```

### Common Patterns

#### 1. Authentication Check
```typescript
useEffect(() => {
  checkAuth();
}, []);

const checkAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    navigate("/login");
    return;
  }
  // Continue with authenticated logic
};
```

#### 2. Loading States
```typescript
if (loading) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    </div>
  );
}
```

#### 3. Error Handling
```typescript
const { toast } = useToast();

try {
  // API call
} catch (error: any) {
  toast({
    title: "Error",
    description: error.message || "Something went wrong",
    variant: "destructive",
  });
}
```

## Navigation Patterns

### 1. Public Navigation
- **Home**: `/`
- **Search**: `/search`
- **Login**: `/login`
- **Register**: `/register`

### 2. Authenticated Navigation
- **Dashboard**: `/dashboard`
- **Claim Property**: `/claim`
- **Settings**: `/settings`
- **Property Details**: `/property/:id`

### 3. Route Protection
- **Public routes**: Accessible to all users
- **Protected routes**: Require authentication
- **Owner routes**: Require property ownership
- **Admin routes**: Require admin role (future)

### 4. Redirects
- **Unauthenticated users**: Redirected to login
- **Authenticated users**: Redirected to dashboard
- **Invalid routes**: Redirected to 404 page

## State Management

### Page-Level State
- **Form data**: Local component state
- **Loading states**: Component-level loading flags
- **Error states**: Component-level error handling

### Global State
- **Authentication**: Supabase auth state
- **User profile**: React Query cache
- **Property data**: React Query cache

### Data Flow
1. **Page loads** → Check authentication
2. **Fetch data** → React Query handles caching
3. **User interactions** → Local state updates
4. **Form submission** → API calls with error handling
5. **Success** → Navigation or state updates

## Next Steps

1. **Review [COMPONENTS_HANDBOOK.md](./COMPONENTS_HANDBOOK.md)** for component usage
2. **Check [DOMAIN_AND_DATA.md](./DOMAIN_AND_DATA.md)** for data models
3. **Read [ENV_SUPABASE_SETUP.md](./ENV_SUPABASE_SETUP.md)** for environment setup
4. **See [TESTING_AND_QUALITY.md](./TESTING_AND_QUALITY.md)** for testing strategies

## References
- [React Router Documentation](https://reactrouter.com/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
