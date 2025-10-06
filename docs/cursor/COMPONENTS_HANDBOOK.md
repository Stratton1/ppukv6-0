# Property Passport UK v6 - Components Handbook

## Purpose
This document provides a comprehensive guide to all components in the Property Passport UK v6 application, including usage patterns, props, and best practices.

## How to Use
- **Developers**: Reference for component usage and patterns
- **Contributors**: Guide for creating and modifying components
- **Designers**: Understanding of component capabilities and limitations

## Table of Contents
1. [Component Architecture](#component-architecture)
2. [UI Components (Shadcn/UI)](#ui-components-shadcnui)
3. [Business Components](#business-components)
4. [Layout Components](#layout-components)
5. [Component Patterns](#component-patterns)
6. [Best Practices](#best-practices)

## Component Architecture

The component library is organized into three main categories:

```
src/components/
├── ui/                    # Base UI components (Shadcn/UI)
├── business/              # Domain-specific components
└── layout/                # Layout and navigation components
```

### Component Hierarchy
```
Pages
├── Layout Components (Navbar, Footer)
├── Business Components (PropertyCard, DocumentUploader)
└── UI Components (Button, Card, Input)
```

## UI Components (Shadcn/UI)

### Core Components

#### Button
**Purpose**: Interactive buttons for actions and navigation
**Location**: `src/components/ui/button.tsx`

```typescript
interface ButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  children: React.ReactNode;
}
```

**Usage Examples**:
```typescript
// Primary action
<Button onClick={handleSubmit}>Save Property</Button>

// Secondary action
<Button variant="outline" onClick={handleCancel}>Cancel</Button>

// Destructive action
<Button variant="destructive" onClick={handleDelete}>Delete</Button>

// Icon button
<Button size="icon" variant="ghost">
  <Search className="h-4 w-4" />
</Button>
```

#### Card
**Purpose**: Container for related content and actions
**Location**: `src/components/ui/card.tsx`

```typescript
// Card with header and content
<Card>
  <CardHeader>
    <CardTitle>Property Details</CardTitle>
    <CardDescription>Basic property information</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>
```

#### Input
**Purpose**: Text input fields for forms
**Location**: `src/components/ui/input.tsx`

```typescript
<Input
  type="email"
  placeholder="your@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>
```

#### Select
**Purpose**: Dropdown selection component
**Location**: `src/components/ui/select.tsx`

```typescript
<Select value={propertyType} onValueChange={setPropertyType}>
  <SelectTrigger>
    <SelectValue placeholder="Select property type" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="detached">Detached</SelectItem>
    <SelectItem value="semi_detached">Semi-detached</SelectItem>
    <SelectItem value="terraced">Terraced</SelectItem>
  </SelectContent>
</Select>
```

### Form Components

#### Form Field
**Purpose**: Form field with label and validation
**Pattern**: Used with react-hook-form

```typescript
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="your@email.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
  />
</div>
```

### Display Components

#### Badge
**Purpose**: Status indicators and labels
**Location**: `src/components/ui/badge.tsx`

```typescript
<Badge variant="secondary">EPC A</Badge>
<Badge variant="outline">Freehold</Badge>
<Badge variant="destructive">High Risk</Badge>
```

#### Avatar
**Purpose**: User profile images
**Location**: `src/components/ui/avatar.tsx`

```typescript
<Avatar>
  <AvatarImage src="/user-avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

## Business Components

### PropertyCard
**Purpose**: Display property information in a card format
**Location**: `src/components/business/PropertyCard.tsx`

```typescript
interface PropertyCardProps {
  id: string;
  address: string;
  postcode: string;
  city: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  floorArea?: number;
  epcRating?: string;
  tenure: string;
  frontPhotoUrl?: string;
  ppukReference: string;
}
```

**Usage**:
```typescript
<PropertyCard
  id={property.id}
  address={property.address_line_1}
  postcode={property.postcode}
  city={property.city}
  propertyType={property.property_type}
  bedrooms={property.bedrooms}
  bathrooms={property.bathrooms}
  floorArea={property.total_floor_area_sqm}
  epcRating={property.epc_rating}
  tenure={property.tenure}
  frontPhotoUrl={property.front_photo_url}
  ppukReference={property.ppuk_reference}
/>
```

**Features**:
- Clickable card with navigation to property details
- Property image with fallback
- EPC rating badge
- Property statistics (bedrooms, bathrooms, floor area)
- Property type and tenure display

### DocumentUploader
**Purpose**: Upload and manage property documents
**Location**: `src/components/business/DocumentUploader.tsx`

```typescript
interface DocumentUploaderProps {
  propertyId: string;
  onUploadComplete?: () => void;
}
```

**Usage**:
```typescript
<DocumentUploader
  propertyId={property.id}
  onUploadComplete={() => {
    // Refresh documents list
    queryClient.invalidateQueries(['documents', property.id]);
  }}
/>
```

**Features**:
- File upload with size validation (10MB limit)
- Document type selection
- Description field
- Progress indicator
- Error handling

**Supported Document Types**:
- EPC Certificate
- Floorplan
- Title Deed
- Survey Report
- Planning Document
- Lease Agreement
- Guarantee/Warranty
- Building Control
- Gas Safety Certificate
- Electrical Safety Certificate
- Other

### PhotoGallery
**Purpose**: Display and manage property photos
**Location**: `src/components/business/PhotoGallery.tsx`

**Features**:
- Image grid display
- Featured image selection
- Room type categorization
- Image upload
- Image deletion

### APIPreviewCard
**Purpose**: Display external API data (EPC, Flood Risk, etc.)
**Location**: `src/components/business/APIPreviewCard.tsx`

**Features**:
- Data source identification
- Status indicators (loading, error, success)
- Data preview with expand/collapse
- Refresh functionality
- Error handling

### PassportScore
**Purpose**: Display property completion percentage
**Location**: `src/components/business/PassportScore.tsx`

**Features**:
- Progress circle visualization
- Completion percentage display
- Missing data indicators
- Completion recommendations

## Layout Components

### Navbar
**Purpose**: Main navigation component
**Location**: `src/components/layout/Navbar.tsx`

**Features**:
- Responsive design (mobile/desktop)
- Logo and branding
- Navigation links
- Authentication buttons
- Mobile menu toggle

**Navigation Items**:
- Home (`/`)
- Search (`/search`)
- Login (`/login`)
- Register (`/register`)

### DevAuthBypass
**Purpose**: Development authentication bypass
**Location**: `src/components/layout/DevAuthBypass.tsx`

**Features**:
- Quick login for development
- Test user creation
- Authentication state debugging
- Development-only component

## Component Patterns

### 1. Container/Presenter Pattern
```typescript
// Container: Handles data and logic
const PropertyContainer = ({ propertyId }: { propertyId: string }) => {
  const { data, loading, error } = useProperty(propertyId);
  
  if (loading) return <PropertySkeleton />;
  if (error) return <PropertyError error={error} />;
  
  return <PropertyPresenter property={data} />;
};

// Presenter: Handles presentation
const PropertyPresenter = ({ property }: { property: Property }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{property.address}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Property details */}
      </CardContent>
    </Card>
  );
};
```

### 2. Compound Components
```typescript
// Card compound component
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    Actions
  </CardFooter>
</Card>
```

### 3. Render Props Pattern
```typescript
interface DataFetcherProps {
  children: (data: any, loading: boolean, error: any) => React.ReactNode;
  queryKey: string[];
  queryFn: () => Promise<any>;
}

const DataFetcher = ({ children, queryKey, queryFn }: DataFetcherProps) => {
  const { data, loading, error } = useQuery({ queryKey, queryFn });
  return <>{children(data, loading, error)}</>;
};
```

### 4. Custom Hooks Pattern
```typescript
// Data fetching hook
const useProperty = (id: string) => {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchProperty(id),
  });
};

// Business logic hook
const usePropertyActions = (propertyId: string) => {
  const queryClient = useQueryClient();
  
  const claimProperty = useMutation({
    mutationFn: claimPropertyMutation,
    onSuccess: () => {
      queryClient.invalidateQueries(['property', propertyId]);
    },
  });
  
  return { claimProperty };
};
```

## Best Practices

### 1. Component Design
- **Single Responsibility**: Each component should have one clear purpose
- **Composition over Inheritance**: Use composition to build complex components
- **Props Interface**: Always define TypeScript interfaces for props
- **Default Props**: Provide sensible defaults for optional props

### 2. State Management
- **Local State**: Use useState for component-specific state
- **Server State**: Use TanStack Query for server data
- **Global State**: Use React Context for app-wide state
- **Form State**: Use react-hook-form for form management

### 3. Performance
- **Memoization**: Use React.memo for expensive components
- **Lazy Loading**: Use dynamic imports for large components
- **Code Splitting**: Split components by route
- **Bundle Analysis**: Monitor bundle size

### 4. Accessibility
- **Semantic HTML**: Use proper HTML elements
- **ARIA Labels**: Add labels for screen readers
- **Keyboard Navigation**: Ensure keyboard accessibility
- **Color Contrast**: Maintain WCAG AA compliance

### 5. Testing
- **Unit Tests**: Test component logic
- **Integration Tests**: Test component interactions
- **Visual Tests**: Test component appearance
- **Accessibility Tests**: Test a11y compliance

### 6. Documentation
- **Props Documentation**: Document all props
- **Usage Examples**: Provide usage examples
- **Storybook**: Use Storybook for component documentation
- **TypeScript**: Use TypeScript for type safety

## Common Pitfalls

### 1. Props Drilling
```typescript
// ❌ Avoid: Props drilling
<Parent>
  <Child>
    <GrandChild prop={prop} />
  </Child>
</Parent>

// ✅ Better: Use context or composition
<PropertyProvider>
  <PropertyDetails />
</PropertyProvider>
```

### 2. Inline Styles
```typescript
// ❌ Avoid: Inline styles
<div style={{ color: 'red', fontSize: '16px' }}>

// ✅ Better: Use Tailwind classes
<div className="text-red-500 text-base">
```

### 3. Missing Error Boundaries
```typescript
// ❌ Avoid: No error handling
<ComponentThatMightFail />

// ✅ Better: Wrap with error boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <ComponentThatMightFail />
</ErrorBoundary>
```

### 4. Missing Loading States
```typescript
// ❌ Avoid: No loading state
{data && <Component data={data} />}

// ✅ Better: Handle loading state
{loading ? <Skeleton /> : data ? <Component data={data} /> : <EmptyState />}
```

## Next Steps

1. **Review [DOMAIN_AND_DATA.md](./DOMAIN_AND_DATA.md)** for data models
2. **Check [TESTING_AND_QUALITY.md](./TESTING_AND_QUALITY.md)** for testing strategies
3. **Read [ACCESSIBILITY_AND_UX.md](./ACCESSIBILITY_AND_UX.md)** for a11y guidelines
4. **See [PERFORMANCE_AND_DX.md](./PERFORMANCE_AND_DX.md)** for optimization tips

## References
- [Shadcn/UI Documentation](https://ui.shadcn.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [React Component Patterns](https://react.dev/learn)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
