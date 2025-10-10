# PPUK v6 Frontend Sync Layer

This document explains how to use the typed API layer and React Query hooks for PPUK v6 frontend development.

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file with the required variables:

```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_FN_BASE=https://your-project.supabase.co/functions/v1

# Optional Feature Flags
VITE_FEATURE_RELATIONSHIPS=true
VITE_FEATURE_DOC_UPLOADS=true
VITE_FEATURE_NOTES=true

# Optional: Use mock data in development
VITE_USE_MOCKS=false
```

### 2. Install Dependencies

The frontend sync layer requires these packages:

```bash
npm install @tanstack/react-query zod @supabase/supabase-js
```

### 3. Setup React Query

Wrap your app with the QueryClient provider:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
    </QueryClientProvider>
  )
}
```

## 📚 API Hooks Usage

### Property Search

```tsx
import { useSearchAddress } from '@/lib/api/hooks'

function PropertySearch() {
  const [query, setQuery] = useState('')
  const { data: results, isLoading } = useSearchAddress(query)

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search properties..."
      />
      {isLoading && <div>Searching...</div>}
      {results?.map(result => (
        <div key={result.uprn}>
          {result.address} - {result.postcode}
        </div>
      ))}
    </div>
  )
}
```

### Property Details

```tsx
import { usePropertySnapshot } from '@/lib/api/hooks'

function PropertyDetails({ propertyId }: { propertyId: string }) {
  const { data: snapshot, isLoading, error } = usePropertySnapshot(propertyId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{snapshot?.property.address_line_1}</h1>
      <p>EPC Rating: {snapshot?.external?.epc?.rating}</p>
      <p>Flood Risk: {snapshot?.external?.flood?.riskLevel}</p>
    </div>
  )
}
```

### My Properties

```tsx
import { useMyProperties } from '@/lib/api/hooks'

function MyProperties() {
  const { data: myProperties, isLoading } = useMyProperties('owner')

  return (
    <div>
      {myProperties?.properties.map(property => (
        <div key={property.id}>
          {property.address_line_1} ({property.relationship})
        </div>
      ))}
    </div>
  )
}
```

### Watchlist Management

```tsx
import { useWatchlistMutations, useIsInWatchlist } from '@/lib/api/hooks'

function WatchlistButton({ propertyId }: { propertyId: string }) {
  const { addToWatchlist, removeFromWatchlist, isLoading } = useWatchlistMutations()
  const { isInWatchlist } = useIsInWatchlist(propertyId)

  const handleToggle = async () => {
    try {
      if (isInWatchlist) {
        await removeFromWatchlist.mutateAsync({ property_id: propertyId })
      } else {
        await addToWatchlist.mutateAsync({ property_id: propertyId })
      }
    } catch (error) {
      console.error('Watchlist operation failed:', error)
    }
  }

  return (
    <button onClick={handleToggle} disabled={isLoading}>
      {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
    </button>
  )
}
```

## 🎛️ Feature Flags

Control feature availability with environment variables:

```tsx
import { useFeatureFlags } from '@/lib/api/hooks'

function MyComponent() {
  const { relationships, docUploads, notes } = useFeatureFlags()

  return (
    <div>
      {relationships && <WatchlistButton />}
      {docUploads && <DocumentUploader />}
      {notes && <NotesSection />}
    </div>
  )
}
```

## 🎭 Mock Data

Enable mock data for development:

```bash
# In .env.local
VITE_USE_MOCKS=true
```

Or use mocks when `VITE_FN_BASE` is not set:

```tsx
import { shouldUseMocks, mockApi } from '@/lib/api/mocks'

if (shouldUseMocks()) {
  const data = await mockApi.getPropertySnapshot('mock-property-1')
}
```

## 🧩 Common Components

### Error Handling

```tsx
import { ErrorBanner, APIErrorBanner } from '@/components/common/ErrorBanner'

function MyComponent() {
  const { data, error } = usePropertySnapshot(propertyId)

  if (error) {
    return <APIErrorBanner error={error} onRetry={() => refetch()} />
  }

  return <div>{/* Your content */}</div>
}
```

### Loading States

```tsx
import { LoadingBlock, PropertyCardSkeleton } from '@/components/common/LoadingBlock'

function MyComponent() {
  const { data, isLoading } = useMyProperties()

  if (isLoading) {
    return <PropertyCardSkeleton />
  }

  return <div>{/* Your content */}</div>
}
```

### Empty States

```tsx
import { EmptyState, EmptyPropertiesState } from '@/components/common/EmptyState'

function MyComponent() {
  const { data } = useMyProperties()

  if (!data?.properties.length) {
    return <EmptyPropertiesState onCreateProperty={() => navigate('/add-property')} />
  }

  return <div>{/* Your content */}</div>
}
```

### Data Attribution

```tsx
import { DataAttribution, EPCDataAttribution } from '@/components/common/DataAttribution'

function EPCInfo({ epcData }: { epcData: any }) {
  return (
    <div>
      <h3>EPC Rating: {epcData.rating}</h3>
      <EPCDataAttribution lastUpdated={epcData.lastUpdated} compact />
    </div>
  )
}
```

## 🔧 TypeScript Types

All API responses are typed with Zod schemas:

```tsx
import type { 
  Snapshot, 
  PropertyCore, 
  SearchResult,
  MyPropertiesResponse 
} from '@/lib/api/schemas'

function MyComponent({ property }: { property: PropertyCore }) {
  // property is fully typed
  return <div>{property.address_line_1}</div>
}
```

## 🚨 Error Handling

The API client provides comprehensive error handling:

```tsx
import { apiFetch } from '@/lib/api/client'

try {
  const data = await apiFetch<Snapshot>('property_snapshot?property_id=123')
} catch (error) {
  // Error includes context about which API call failed
  console.error(error.message) // "Failed to fetch property_snapshot: API 404: Not found"
}
```

## 🔄 Caching Strategy

React Query provides intelligent caching:

- **Property snapshots**: 10 minutes stale time
- **Search results**: 5 minutes stale time  
- **My properties**: 5 minutes stale time
- **EPC data**: 1 hour stale time (rarely changes)
- **Flood data**: 24 hours stale time (changes slowly)

## 🧪 Testing

Use the demo component to test the API layer:

```tsx
import { PropertyDemo } from '@/examples/PropertyDemo'

function App() {
  return <PropertyDemo />
}
```

## 📋 Available Endpoints

| Endpoint | Hook | Description |
|----------|------|-------------|
| `property_snapshot` | `usePropertySnapshot` | Get complete property data |
| `search_address` | `useSearchAddress` | Search properties by address/postcode |
| `my_properties` | `useMyProperties` | Get user's properties with relationship filter |
| `watchlist_add` | `useWatchlistMutations` | Add property to watchlist |
| `watchlist_remove` | `useWatchlistMutations` | Remove property from watchlist |
| `epc` | `useEPCData` | Get EPC certificate data |
| `flood` | `useFloodData` | Get flood risk assessment |
| `planning` | `usePlanningData` | Get planning application data |

## 🔒 Security

- All API keys are handled server-side
- JWT tokens are automatically included in requests
- Input validation with Zod schemas
- No sensitive data exposed to client

## 🎯 Best Practices

1. **Always handle loading and error states**
2. **Use feature flags to control feature availability**
3. **Leverage React Query's caching for better UX**
4. **Use TypeScript types for better development experience**
5. **Test with mock data during development**
6. **Include data attribution for transparency**

## 🆘 Troubleshooting

### "VITE_FN_BASE missing" error
- Ensure `VITE_FN_BASE` is set in your `.env.local` file
- Check that the URL points to your Supabase project's functions endpoint

### Authentication errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Ensure user is logged in before making API calls

### Mock data not working
- Set `VITE_USE_MOCKS=true` in `.env.local`
- Or ensure `VITE_FN_BASE` is not set (mocks will be used automatically)

### Type errors
- Ensure all required dependencies are installed
- Check that TypeScript is configured to use the new types

---

For more examples, see `src/examples/PropertyDemo.tsx` which demonstrates all the hooks and components in action.
