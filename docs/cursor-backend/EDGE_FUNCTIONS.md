# PPUK v6 Edge Functions

## Overview

Edge Functions are serverless functions that run on Supabase Edge Runtime, providing external API integrations, data aggregation, and caching capabilities for the PPUK v6 platform.

## Function Architecture

```
Request → Authentication → Authorization → Business Logic → External APIs → Cache → Response
```

## Available Functions

### 1. EPC Function (`/functions/epc`)

**Purpose**: Fetches Energy Performance Certificate data from UK EPC Open Data API.

**Endpoint**: `POST /functions/v1/epc`

**Request Body**:
```json
{
  "postcode": "SW1A 1AA",
  "address": "15 Victoria Street",
  "uprn": "123456789012",
  "rrn": "123456789"
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "certificateNumber": "123456789",
      "address": "15 Victoria Street",
      "postcode": "SW1A 1AA",
      "currentRating": "D",
      "currentEfficiency": 65,
      "co2EmissionsCurrent": 2.5,
      "totalCostCurrent": 1200,
      "inspectionDate": "2023-01-15",
      "expires_at": "2033-01-15T00:00:00Z"
    }
  ],
  "timestamp": "2025-01-03T10:00:00Z",
  "requestId": "req-123"
}
```

**Features**:
- Caching with 24-hour TTL
- Multiple search methods (postcode, address, UPRN, RRN)
- Data transformation and normalization
- Error handling and fallbacks

### 2. Flood Risk Function (`/functions/flood`)

**Purpose**: Fetches flood risk data from Environment Agency APIs.

**Endpoint**: `POST /functions/v1/flood`

**Request Body**:
```json
{
  "postcode": "SW1A 1AA",
  "address": "15 Victoria Street",
  "latitude": 51.5074,
  "longitude": -0.1278
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "address": "15 Victoria Street",
    "postcode": "SW1A 1AA",
    "floodRisk": {
      "surfaceWater": {
        "level": "Low",
        "score": 2,
        "description": "Low flood risk",
        "probability": "1 in 100 years"
      },
      "riversAndSea": {
        "level": "Very Low",
        "score": 1,
        "description": "Very low flood risk",
        "probability": "1 in 1000 years"
      }
    },
    "riskLevel": "Low",
    "riskScore": 2,
    "lastUpdated": "2025-01-03T10:00:00Z"
  }
}
```

**Features**:
- Multiple flood risk sources
- Coordinate-based and postcode-based lookups
- Current warnings and historical data
- 7-day cache TTL

### 3. Postcodes Function (`/functions/postcodes`)

**Purpose**: Postcode validation and geocoding using postcodes.io API.

**Endpoint**: `POST /functions/v1/postcodes`

**Request Body**:
```json
{
  "postcode": "SW1A 1AA",
  "validate": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "postcode": "SW1A 1AA",
    "quality": 1,
    "eastings": 529090,
    "northings": 179645,
    "country": "England",
    "longitude": -0.1278,
    "latitude": 51.5074,
    "parliamentary_constituency": "Cities of London and Westminster",
    "admin_district": "Westminster",
    "region": "London"
  }
}
```

**Features**:
- Postcode validation and lookup
- Reverse geocoding from coordinates
- Search functionality
- 24-hour cache TTL

### 4. Property Snapshot Function (`/functions/property_snapshot`)

**Purpose**: Aggregates comprehensive property data from multiple sources.

**Endpoint**: `POST /functions/v1/property_snapshot`

**Request Body**:
```json
{
  "property_id": "123e4567-e89b-12d3-a456-426614174000",
  "include_epc": true,
  "include_flood": true,
  "include_planning": false,
  "include_postcode": true,
  "include_companies": false,
  "include_recent_activity": true,
  "include_pinned_notes": true,
  "include_pending_tasks": true,
  "include_overdue_tasks": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "ppuk_reference": "PPUK-123456",
      "address_line_1": "15 Victoria Street",
      "city": "London",
      "postcode": "SW1A 1AA",
      "property_type": "terraced",
      "tenure": "leasehold"
    },
    "parties": [
      {
        "id": "party-123",
        "role": "owner",
        "is_primary": true,
        "users": {
          "full_name": "John Smith",
          "email": "john@example.com"
        }
      }
    ],
    "stats": {
      "documentCount": 5,
      "noteCount": 3,
      "taskCount": 2,
      "partyCount": 1,
      "lastActivity": "2025-01-03T10:00:00Z"
    },
    "epc": {
      "currentRating": "D",
      "currentEfficiency": 65
    },
    "floodRisk": {
      "riskLevel": "Low",
      "riskScore": 2
    },
    "recentDocuments": [...],
    "recentNotes": [...],
    "recentTasks": [...],
    "pinnedNotes": [...],
    "pendingTasks": [...],
    "overdueTasks": [...]
  }
}
```

**Features**:
- Comprehensive property overview
- Configurable data inclusion
- External API integration
- Performance optimization

### 5. Address Search Function (`/functions/search_address`)

**Purpose**: Searches addresses using multiple data sources.

**Endpoint**: `POST /functions/v1/search_address`

**Request Body**:
```json
{
  "query": "15 Victoria Street",
  "limit": 10,
  "include_postcodes": true,
  "include_osplaces": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "uprn": "123456789012",
        "address": "15 Victoria Street, London",
        "postcode": "SW1A 1AA",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "classification": "Residential",
        "administrative_area": "Westminster"
      }
    ],
    "total": 1,
    "query": "15 Victoria Street",
    "suggestions": ["Victoria Street", "SW1A 1AA"]
  }
}
```

**Features**:
- Multiple data sources
- Deduplication and ranking
- Search suggestions
- 1-hour cache TTL

## Authentication & Authorization

### JWT Authentication
All functions require valid JWT tokens in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Property Access Control
Functions that access property data verify user permissions:

```typescript
async function authorizePropertyAccess(userId: string, propertyId: string): Promise<boolean> {
  const { data } = await supabase
    .from('property_parties')
    .select('id')
    .eq('property_id', propertyId)
    .eq('user_id', userId)
    .single();
  
  return !!data;
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "FUNCTION_ERROR",
    "message": "Error description",
    "timestamp": "2025-01-03T10:00:00Z",
    "requestId": "req-123"
  },
  "timestamp": "2025-01-03T10:00:00Z",
  "requestId": "req-123"
}
```

### Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing token
- `AUTHORIZATION_ERROR`: Access denied
- `EXTERNAL_API_ERROR`: External API failure
- `CACHE_ERROR`: Cache operation failed
- `RATE_LIMIT_ERROR`: Rate limit exceeded

## Caching Strategy

### Cache Keys
Functions use structured cache keys:
- EPC: `epc:postcode:address`
- Flood: `flood:lat:lng`
- Postcodes: `postcode:SW1A1AA`
- Search: `search:query:limit`

### TTL Configuration
- EPC data: 24 hours
- Flood risk: 7 days
- Postcodes: 24 hours
- Search results: 1 hour

### Cache Invalidation
- Automatic expiration
- Manual invalidation
- Stale data handling
- Request deduplication

## Rate Limiting

### Limits
- 100 requests per hour per user
- 10 requests per minute per IP
- Burst allowance for authenticated users

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Performance Optimization

### Response Times
- Cached responses: < 100ms
- External API calls: 1-3 seconds
- Database queries: < 50ms
- Aggregation functions: 2-5 seconds

### Optimization Techniques
- Response caching
- Request deduplication
- Batch operations
- Connection pooling
- Query optimization

## Monitoring & Logging

### Request Logging
```json
{
  "timestamp": "2025-01-03T10:00:00Z",
  "function": "epc",
  "requestId": "req-123",
  "userId": "user-456",
  "propertyId": "prop-789",
  "duration": 1250,
  "status": "success",
  "cacheHit": false
}
```

### Error Logging
```json
{
  "timestamp": "2025-01-03T10:00:00Z",
  "function": "epc",
  "requestId": "req-123",
  "error": "External API timeout",
  "stack": "Error: timeout\n  at fetch...",
  "context": {
    "postcode": "SW1A 1AA",
    "retryCount": 2
  }
}
```

## Testing

### Unit Tests
```typescript
describe('EPC Function', () => {
  it('should fetch EPC data for valid postcode', async () => {
    const response = await fetch('/functions/v1/epc', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer token' },
      body: JSON.stringify({ postcode: 'SW1A 1AA' })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });
});
```

### Integration Tests
```typescript
describe('Property Snapshot', () => {
  it('should aggregate all property data', async () => {
    const response = await fetch('/functions/v1/property_snapshot', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer token' },
      body: JSON.stringify({ property_id: 'prop-123' })
    });
    
    const data = await response.json();
    expect(data.data.property).toBeDefined();
    expect(data.data.parties).toBeDefined();
    expect(data.data.stats).toBeDefined();
  });
});
```

## Deployment

### Environment Variables
```bash
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
EPC_API_KEY=epc_key_123
FLOOD_API_KEY=flood_key_456
OSPLACES_API_KEY=osplaces_key_789
```

### Deployment Commands
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy epc

# Deploy with environment
supabase functions deploy --env-file .env.production
```

### Health Checks
```bash
# Check function status
curl https://project.supabase.co/functions/v1/epc \
  -H "Authorization: Bearer token" \
  -d '{"postcode": "SW1A 1AA"}'
```

## Troubleshooting

### Common Issues
1. **Authentication Errors**: Check JWT token validity
2. **Authorization Errors**: Verify property access permissions
3. **External API Errors**: Check API keys and rate limits
4. **Cache Errors**: Verify database connectivity
5. **Performance Issues**: Check query optimization and indexing

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=true
```

### Performance Monitoring
- Response time tracking
- Error rate monitoring
- Cache hit ratio
- External API latency
- Database query performance

## Watchlist & Relationship Endpoints

### 1. My Properties

**Endpoint**: `/functions/v1/my_properties`
**Method**: `GET`
**Purpose**: Get user's properties with optional relationship filtering

**Query Parameters**:
- `relationship` (optional): `owner`, `occupier`, or `interested`
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example Request**:
```
GET /functions/v1/my_properties?relationship=owner&limit=20&offset=0
```

**Response**:
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "uuid",
        "ppuk_reference": "PPUK-2025-001",
        "address_line_1": "123 Example Street",
        "city": "London",
        "postcode": "SW1A 1AA",
        "property_type": "terraced",
        "bedrooms": 3,
        "bathrooms": 2,
        "epc_rating": "C",
        "epc_score": 75,
        "flood_risk_level": "Low",
        "tenure": "freehold",
        "front_photo_url": "https://...",
        "relationship": "owner",
        "completion_percentage": 85,
        "stats": {
          "document_count": 5,
          "note_count": 3,
          "task_count": 2,
          "photo_count": 8,
          "planning_count": 1
        },
        "last_updated": "2025-01-03T10:30:00Z",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "relationship": "owner",
    "pagination": {
      "limit": 20,
      "offset": 0,
      "has_more": false
    }
  }
}
```

### 2. Watchlist Add

**Endpoint**: `/functions/v1/watchlist_add`
**Method**: `POST`
**Purpose**: Add a property to user's watchlist (interested relationship)

**Request Body**:
```json
{
  "property_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "ok": true,
    "relationship": "interested",
    "property_id": "uuid",
    "message": "Property added to watchlist successfully"
  }
}
```

**Error Cases**:
- Property not found: Returns 400 with message "Property not found"
- Already has relationship: Returns 400 with message "Property already has relationship: owner"
- Already in watchlist: Returns 200 with message "Property already in watchlist"

### 3. Watchlist Remove

**Endpoint**: `/functions/v1/watchlist_remove`
**Method**: `POST`
**Purpose**: Remove a property from user's watchlist

**Request Body**:
```json
{
  "property_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "ok": true,
    "property_id": "uuid",
    "message": "Property removed from watchlist successfully"
  }
}
```

**Error Cases**:
- Not in watchlist: Returns 200 with message "Property not in watchlist"

## Relationship-Based Visibility

### Property Snapshot Visibility Tiers

The `property_snapshot` endpoint now respects relationship-based visibility:

**Owner Access**:
- Full access to all property data
- All documents, notes, tasks, and parties
- Complete statistics and activity history

**Occupier Access**:
- Access to shared documents (`is_public = true`)
- Access to shared notes (`visibility IN ('public', 'shared')`)
- Access to assigned tasks
- Can see other occupiers and interested parties

**Interested Access**:
- Public documents only (`is_public = true`)
- Public notes only (`visibility = 'public'`)
- Public tasks only
- Can only see other interested parties

### Relationship Management

**Adding Relationships**:
- Users can add themselves as `interested` (watchlist)
- Property owners can add others as `occupier` or `owner`
- Unique constraint prevents duplicate relationships

**Removing Relationships**:
- Users can remove their own `interested` relationships
- Property owners can remove any relationship
- System maintains audit trail of all changes

## Error Handling

All functions return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "FUNCTION_ERROR",
    "message": "Error description",
    "timestamp": "2025-01-03T10:00:00Z",
    "requestId": "req-123"
  }
}
```

**Common Error Codes**:
- `MY_PROPERTIES_ERROR`: Error in my_properties function
- `WATCHLIST_ADD_ERROR`: Error in watchlist_add function  
- `WATCHLIST_REMOVE_ERROR`: Error in watchlist_remove function
- `PROPERTY_SNAPSHOT_ERROR`: Error in property_snapshot function

## Rate Limiting

- **EPC API**: 100 requests/hour
- **Flood Risk API**: 1000 requests/day
- **Planning API**: 100 requests/hour
- **Postcodes API**: 1000 requests/day
- **Watchlist Functions**: 1000 requests/hour per user

## Caching

All functions implement intelligent caching:
- **Cache TTL**: Varies by data type (EPC: 1 year, Flood: 1 month, Planning: 1 week)
- **Cache Key**: Generated from request parameters
- **Cache Invalidation**: Automatic based on TTL
- **Cache Headers**: ETag support for conditional requests

## Authentication

All functions require valid JWT authentication:
- **Header**: `Authorization: Bearer <jwt_token>`
- **Token Validation**: Automatic via Supabase Auth
- **User Context**: Available in function context

## Authorization

Functions implement property-based authorization:
- Users can only access data for properties they have relationships with
- Relationship types: `owner`, `occupier`, `interested`
- RLS policies enforce access control at the database level
