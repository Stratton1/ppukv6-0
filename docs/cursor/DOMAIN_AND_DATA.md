# Property Passport UK v6 - Domain and Data Models

## Purpose
This document provides a comprehensive overview of the domain models, data structures, and type definitions used in Property Passport UK v6.

## How to Use
- **Developers**: Reference for understanding data models and relationships
- **Contributors**: Guide for working with data structures and types
- **Maintainers**: Overview of domain logic and data integrity

## Table of Contents
1. [Domain Overview](#domain-overview)
2. [Database Schema](#database-schema)
3. [TypeScript Types](#typescript-types)
4. [API Types](#api-types)
5. [Data Relationships](#data-relationships)
6. [Validation Schemas](#validation-schemas)

## Domain Overview

Property Passport UK v6 manages several core domain entities:

### Core Entities
- **Properties**: Physical properties with addresses and characteristics
- **Users/Profiles**: System users with roles and permissions
- **Documents**: Property-related files and certificates
- **Photos**: Property images and visual documentation
- **Saved Properties**: User bookmarks and notes

### External Data Sources
- **EPC Data**: Energy Performance Certificates
- **HMLR Data**: HM Land Registry information
- **Flood Risk**: Environment Agency flood risk data
- **Planning Data**: Local authority planning applications

## Database Schema

### Tables

#### Properties Table
**Purpose**: Core property information and characteristics

```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  property_type property_type NOT NULL,
  property_style property_style,
  bedrooms INTEGER,
  bathrooms INTEGER,
  total_floor_area_sqm DECIMAL,
  year_built INTEGER,
  tenure tenure_type NOT NULL,
  title_number TEXT,
  epc_rating TEXT,
  epc_score INTEGER,
  epc_expiry_date DATE,
  flood_risk_level TEXT,
  council_tax_band TEXT,
  ground_rent_annual DECIMAL,
  service_charge_annual DECIMAL,
  lease_years_remaining INTEGER,
  front_photo_url TEXT,
  ppuk_reference TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  claimed_by UUID REFERENCES profiles(id),
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Fields**:
- `id`: Unique property identifier
- `address_line_1`, `address_line_2`, `city`, `postcode`: Address components
- `property_type`: Detached, Semi-detached, Terraced, Flat, etc.
- `property_style`: Victorian, Edwardian, Georgian, Modern, etc.
- `bedrooms`, `bathrooms`: Room counts
- `total_floor_area_sqm`: Floor area in square meters
- `year_built`: Construction year
- `tenure`: Freehold, Leasehold, Shared Ownership
- `title_number`: HMLR title number
- `epc_rating`, `epc_score`: Energy performance data
- `flood_risk_level`: Flood risk assessment
- `claimed_by`: User who owns this property
- `completion_percentage`: Property passport completion

#### Profiles Table
**Purpose**: User profiles and authentication

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Fields**:
- `id`: Links to Supabase auth.users
- `full_name`: User's display name
- `phone`: Contact phone number
- `role`: Owner, Buyer, Professional, Other

#### Documents Table
**Purpose**: Property-related documents and files

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  document_type document_type NOT NULL,
  description TEXT,
  ai_summary TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Document Types**:
- `epc`: Energy Performance Certificate
- `floorplan`: Property floor plans
- `title_deed`: Title deeds and ownership documents
- `survey`: Survey reports
- `planning`: Planning applications and permissions
- `lease`: Lease agreements
- `guarantee`: Warranties and guarantees
- `building_control`: Building control certificates
- `gas_safety`: Gas safety certificates
- `electrical_safety`: Electrical safety certificates
- `other`: Other documents

#### Property Photos Table
**Purpose**: Property images and visual documentation

```sql
CREATE TABLE property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  room_type TEXT,
  caption TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Saved Properties Table
**Purpose**: User bookmarks and property notes

```sql
CREATE TABLE saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enums

#### Property Type
```sql
CREATE TYPE property_type AS ENUM (
  'detached',
  'semi_detached', 
  'terraced',
  'flat',
  'bungalow',
  'cottage',
  'other'
);
```

#### Property Style
```sql
CREATE TYPE property_style AS ENUM (
  'victorian',
  'edwardian',
  'georgian',
  'modern',
  'new_build',
  'period',
  'contemporary',
  'other'
);
```

#### Tenure Type
```sql
CREATE TYPE tenure_type AS ENUM (
  'freehold',
  'leasehold',
  'shared_ownership'
);
```

#### User Role
```sql
CREATE TYPE user_role AS ENUM (
  'owner',
  'buyer',
  'other'
);
```

## TypeScript Types

### Database Types
**Location**: `src/integrations/supabase/types.ts`

```typescript
// Generated from Supabase schema
export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          postcode: string;
          property_type: 'detached' | 'semi_detached' | 'terraced' | 'flat' | 'bungalow' | 'cottage' | 'other';
          property_style: 'victorian' | 'edwardian' | 'georgian' | 'modern' | 'new_build' | 'period' | 'contemporary' | 'other' | null;
          bedrooms: number | null;
          bathrooms: number | null;
          total_floor_area_sqm: number | null;
          year_built: number | null;
          tenure: 'freehold' | 'leasehold' | 'shared_ownership';
          title_number: string | null;
          epc_rating: string | null;
          epc_score: number | null;
          epc_expiry_date: string | null;
          flood_risk_level: string | null;
          council_tax_band: string | null;
          ground_rent_annual: number | null;
          service_charge_annual: number | null;
          lease_years_remaining: number | null;
          front_photo_url: string | null;
          ppuk_reference: string | null;
          is_public: boolean | null;
          claimed_by: string | null;
          completion_percentage: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { /* Insert type */ };
        Update: { /* Update type */ };
      };
      // ... other tables
    };
  };
};
```

### API Types
**Location**: `src/types/api.ts`

#### Property Identifier
```typescript
export interface PropertyIdentifier {
  propertyId: string;
  postcode: string;
  address?: string;
  uprn?: string;
}
```

#### EPC Data
```typescript
export interface EPCData {
  rating: string;
  score: number;
  address: string;
  postcode: string;
  uprn?: string;
  lastUpdated: string;
  certificateUrl?: string;
  recommendations?: EPCRecommendation[];
  environmentalImpact?: {
    co2Emissions: number;
    energyConsumption: number;
    renewableEnergy: number;
  };
}

export interface EPCRecommendation {
  id: string;
  title: string;
  description: string;
  cost: number;
  savings: number;
  paybackPeriod: number;
  priority: "High" | "Medium" | "Low";
}
```

#### HMLR Data
```typescript
export interface HMLRData {
  titleNumber: string;
  address: string;
  postcode: string;
  uprn?: string;
  owner: string;
  lastSold: string;
  price: number;
  tenure: "Freehold" | "Leasehold" | "Commonhold";
  propertyType: string;
  buildDate?: string;
  planningRestrictions?: string[];
  easements?: string[];
  charges?: HMLRCharge[];
}

export interface HMLRCharge {
  type: string;
  amount?: number;
  description: string;
  date: string;
}
```

#### Flood Risk Data
```typescript
export interface FloodRiskData {
  riskLevel: "Very Low" | "Low" | "Medium" | "High" | "Very High";
  address: string;
  postcode: string;
  uprn?: string;
  lastUpdated: string;
  detailsUrl?: string;
  riskFactors: FloodRiskFactor[];
  historicalFloods?: HistoricalFlood[];
  mitigationMeasures?: string[];
}

export interface FloodRiskFactor {
  type: "River" | "Surface Water" | "Groundwater" | "Reservoir" | "Coastal";
  riskLevel: "Very Low" | "Low" | "Medium" | "High" | "Very High";
  description: string;
  probability: number; // 0-100
}
```

## Data Relationships

### Entity Relationships
```
User (Profile)
├── Claims Properties (1:many)
├── Uploads Documents (1:many)
├── Uploads Photos (1:many)
└── Saves Properties (many:many)

Property
├── Has Documents (1:many)
├── Has Photos (1:many)
├── Has Saved By Users (many:many)
└── Has External Data (1:1)
    ├── EPC Data
    ├── HMLR Data
    └── Flood Risk Data
```

### Foreign Key Relationships
- `properties.claimed_by` → `profiles.id`
- `documents.property_id` → `properties.id`
- `documents.uploaded_by` → `profiles.id`
- `property_photos.property_id` → `properties.id`
- `property_photos.uploaded_by` → `profiles.id`
- `saved_properties.user_id` → `profiles.id`
- `saved_properties.property_id` → `properties.id`

## Validation Schemas

### Property Validation
```typescript
const propertySchema = z.object({
  address_line_1: z.string().min(1, "Address is required"),
  address_line_2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  postcode: z.string().regex(/^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/i, "Invalid postcode"),
  property_type: z.enum(['detached', 'semi_detached', 'terraced', 'flat', 'bungalow', 'cottage', 'other']),
  property_style: z.enum(['victorian', 'edwardian', 'georgian', 'modern', 'new_build', 'period', 'contemporary', 'other']).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(10).optional(),
  total_floor_area_sqm: z.number().positive().optional(),
  year_built: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  tenure: z.enum(['freehold', 'leasehold', 'shared_ownership']),
  title_number: z.string().optional(),
});
```

### Document Validation
```typescript
const documentSchema = z.object({
  property_id: z.string().uuid(),
  file_name: z.string().min(1, "File name is required"),
  file_url: z.string().url("Invalid file URL"),
  file_size_bytes: z.number().int().positive().optional(),
  mime_type: z.string().optional(),
  document_type: z.enum(['epc', 'floorplan', 'title_deed', 'survey', 'planning', 'lease', 'guarantee', 'building_control', 'gas_safety', 'electrical_safety', 'other']),
  description: z.string().optional(),
});
```

### User Profile Validation
```typescript
const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100),
  phone: z.string().regex(/^[+]?[0-9\s\-\(\)]{10,15}$/, "Invalid phone number").optional(),
  role: z.enum(['owner', 'buyer', 'other']).default('other'),
});
```

## Data Integrity

### Constraints
- **Primary Keys**: All tables have UUID primary keys
- **Foreign Keys**: Referential integrity maintained
- **Unique Constraints**: `ppuk_reference` must be unique
- **Check Constraints**: Numeric fields have appropriate ranges
- **Not Null**: Required fields are enforced

### Row Level Security (RLS)
- **Properties**: Users can only access their claimed properties
- **Documents**: Users can only access documents for their properties
- **Photos**: Users can only access photos for their properties
- **Profiles**: Users can only access their own profile

### Data Validation
- **Client-side**: Zod schemas for form validation
- **Server-side**: Database constraints and triggers
- **API**: Input validation on all endpoints
- **File Upload**: Size and type validation

## Next Steps

1. **Review [ENV_SUPABASE_SETUP.md](./ENV_SUPABASE_SETUP.md)** for database setup
2. **Check [TESTING_AND_QUALITY.md](./TESTING_AND_QUALITY.md)** for data testing
3. **Read [PERFORMANCE_AND_DX.md](./PERFORMANCE_AND_DX.md)** for optimization
4. **See [RISKS_AND_MITIGATIONS.md](./RISKS_AND_MITIGATIONS.md)** for data security

## References
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Zod Documentation](https://zod.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
