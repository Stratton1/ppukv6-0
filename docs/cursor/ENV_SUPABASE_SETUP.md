# Property Passport UK v6 - Environment and Supabase Setup

## Purpose
This document provides comprehensive guidance on environment configuration, Supabase setup, and security considerations for Property Passport UK v6.

## How to Use
- **Developers**: Step-by-step setup instructions
- **Contributors**: Environment configuration guide
- **Maintainers**: Security and deployment considerations

## Table of Contents
1. [Environment Variables](#environment-variables)
2. [Supabase Configuration](#supabase-configuration)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Security Considerations](#security-considerations)
6. [Troubleshooting](#troubleshooting)

## Environment Variables

### Required Variables

#### Supabase Configuration
```bash
# Supabase Project URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Key (Public)
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Supabase Service Role Key (Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Application Configuration
```bash
# Environment
NODE_ENV=development
VITE_APP_ENV=development

# Optional: External API Keys
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_EPC_API_KEY=your-epc-api-key
VITE_HMLR_API_KEY=your-hmlr-api-key
VITE_FLOOD_RISK_API_KEY=your-flood-risk-api-key
```

#### Storage Configuration
```bash
# Supabase Storage Buckets
VITE_STORAGE_BUCKET_PHOTOS=property-photos
VITE_STORAGE_BUCKET_DOCUMENTS=property-documents
```

### Environment File Structure

#### `.env.local` (Local Development)
```bash
# Copy from .env.example and fill in your values
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Development settings
NODE_ENV=development
VITE_APP_ENV=development

# Optional: External APIs (for development)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_EPC_API_KEY=your-epc-api-key
```

#### `.env.production` (Production)
```bash
# Production Supabase configuration
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Production settings
NODE_ENV=production
VITE_APP_ENV=production

# Production API keys
VITE_GOOGLE_MAPS_API_KEY=your-production-google-maps-key
VITE_EPC_API_KEY=your-production-epc-key
```

## Supabase Configuration

### 1. Project Setup

#### Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and region
4. Set project name: `ppuk-v6`
5. Set database password (save securely)
6. Wait for project creation

#### Get Project Credentials
1. Go to Project Settings → API
2. Copy Project URL → `VITE_SUPABASE_URL`
3. Copy anon/public key → `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Copy service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Database Schema

#### Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Manual Schema Setup
If migrations aren't available, create tables manually:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE property_type AS ENUM (
  'detached', 'semi_detached', 'terraced', 'flat', 'bungalow', 'cottage', 'other'
);

CREATE TYPE property_style AS ENUM (
  'victorian', 'edwardian', 'georgian', 'modern', 'new_build', 'period', 'contemporary', 'other'
);

CREATE TYPE tenure_type AS ENUM (
  'freehold', 'leasehold', 'shared_ownership'
);

CREATE TYPE user_role AS ENUM (
  'owner', 'buyer', 'other'
);

CREATE TYPE document_type AS ENUM (
  'epc', 'floorplan', 'title_deed', 'survey', 'planning', 'lease', 
  'guarantee', 'building_control', 'gas_safety', 'electrical_safety', 'other'
);

-- Create tables (see DOMAIN_AND_DATA.md for full schema)
```

### 3. Authentication Setup

#### Enable Authentication Providers
1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates
4. Set up email verification
5. Configure password reset

#### Row Level Security (RLS)
Enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Properties: Users can only access their claimed properties
CREATE POLICY "Users can view their own properties" ON properties
  FOR SELECT USING (auth.uid() = claimed_by);

CREATE POLICY "Users can update their own properties" ON properties
  FOR UPDATE USING (auth.uid() = claimed_by);

-- Documents: Users can only access documents for their properties
CREATE POLICY "Users can view documents for their properties" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = documents.property_id 
      AND properties.claimed_by = auth.uid()
    )
  );
```

### 4. Storage Setup

#### Create Storage Buckets
1. Go to Storage → Buckets
2. Create bucket: `property-photos`
3. Create bucket: `property-documents`
4. Set up bucket policies

#### Storage Policies
```sql
-- Property photos bucket policy
CREATE POLICY "Users can upload photos for their properties" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Property documents bucket policy
CREATE POLICY "Users can upload documents for their properties" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Local Development Setup

### 1. Environment Setup
```bash
# Clone repository
git clone https://github.com/Stratton1/ppukv6-0.git
cd ppukv6-0

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
```

### 2. Development Server
```bash
# Start development server
npm run dev

# Server will start on http://localhost:8080
```

### 3. Environment Validation
Create a debug endpoint to validate environment:

```typescript
// src/pages/dev/DebugEnv.tsx
const DebugEnv = () => {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    NODE_ENV: import.meta.env.NODE_ENV,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  };

  return (
    <div>
      <h1>Environment Variables</h1>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
    </div>
  );
};
```

### 4. Supabase Client Validation
```typescript
// src/lib/supabase-validation.ts
export const validateSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }

  if (!url.includes('supabase.co')) {
    throw new Error('Invalid Supabase URL');
  }

  return { url, key };
};
```

## Production Deployment

### 1. Environment Variables
Set environment variables in your deployment platform:

#### Vercel
```bash
# Set environment variables in Vercel dashboard
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NODE_ENV=production
VITE_APP_ENV=production
```

#### Netlify
```bash
# Set environment variables in Netlify dashboard
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NODE_ENV=production
VITE_APP_ENV=production
```

### 2. Build Configuration
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### 3. Domain Configuration
1. Set up custom domain in Supabase
2. Configure CORS settings
3. Set up SSL certificates
4. Configure CDN if needed

## Security Considerations

### 1. Environment Variable Security

#### Never Commit Secrets
```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.staging
```

#### Use Different Keys for Different Environments
- **Development**: Use development Supabase project
- **Staging**: Use staging Supabase project  
- **Production**: Use production Supabase project

### 2. Supabase Security

#### Service Role Key Protection
- **Never expose service role key in client-side code**
- **Only use in server-side functions**
- **Rotate keys regularly**
- **Monitor key usage**

#### Row Level Security
- **Enable RLS on all tables**
- **Create appropriate policies**
- **Test policies thoroughly**
- **Monitor access patterns**

### 3. API Key Security

#### External API Keys
```typescript
// Validate API keys at runtime
const validateApiKeys = () => {
  const requiredKeys = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY'
  ];

  const missingKeys = requiredKeys.filter(key => !import.meta.env[key]);
  
  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }
};
```

#### Rate Limiting
- **Implement rate limiting on API calls**
- **Monitor API usage**
- **Set up alerts for unusual activity**

### 4. Data Protection

#### Personal Data
- **Encrypt sensitive data**
- **Implement data retention policies**
- **Provide data export/deletion**
- **Comply with GDPR/CCPA**

#### File Upload Security
- **Validate file types and sizes**
- **Scan uploaded files for malware**
- **Implement virus scanning**
- **Set up content moderation**

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Issues
```typescript
// Check Supabase connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    console.log('Supabase connected successfully');
  } catch (error) {
    console.error('Supabase connection failed:', error);
  }
};
```

#### 2. Environment Variable Issues
```typescript
// Debug environment variables
const debugEnv = () => {
  console.log('Environment variables:', {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'Set' : 'Missing',
    NODE_ENV: import.meta.env.NODE_ENV,
  });
};
```

#### 3. Authentication Issues
```typescript
// Check authentication state
const checkAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Auth error:', error);
  } else if (user) {
    console.log('User authenticated:', user.email);
  } else {
    console.log('No user authenticated');
  }
};
```

### Debug Tools

#### Environment Debug Page
```typescript
// src/pages/debug/EnvDebug.tsx
const EnvDebug = () => {
  const [envStatus, setEnvStatus] = useState({});
  
  useEffect(() => {
    setEnvStatus({
      supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      nodeEnv: import.meta.env.NODE_ENV,
      appEnv: import.meta.env.VITE_APP_ENV,
    });
  }, []);

  return (
    <div>
      <h1>Environment Debug</h1>
      <pre>{JSON.stringify(envStatus, null, 2)}</pre>
    </div>
  );
};
```

#### Supabase Connection Test
```typescript
// src/pages/debug/SupabaseTest.tsx
const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) throw error;
        setConnectionStatus('Connected successfully');
      } catch (error) {
        setConnectionStatus(`Connection failed: ${error.message}`);
      }
    };

    testConnection();
  }, []);

  return <div>Supabase Status: {connectionStatus}</div>;
};
```

## Next Steps

1. **Review [TESTING_AND_QUALITY.md](./TESTING_AND_QUALITY.md)** for testing setup
2. **Check [PERFORMANCE_AND_DX.md](./PERFORMANCE_AND_DX.md)** for optimization
3. **Read [RISKS_AND_MITIGATIONS.md](./RISKS_AND_MITIGATIONS.md)** for security
4. **See [ONBOARDING_PATH.md](./ONBOARDING_PATH.md)** for development workflow

## References
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Environment Variable Security](https://12factor.net/config)
