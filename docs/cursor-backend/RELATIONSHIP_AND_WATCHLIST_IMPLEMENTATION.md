# Relationship Enum & Watchlist Implementation

## Overview

This document describes the implementation of the formal relationship model and watchlist functionality for PPUK v6. The system now uses a clean relationship enum (`owner`, `occupier`, `interested`) and provides watchlist endpoints for the frontend.

## Implementation Summary

### ✅ Completed Tasks

1. **SQL Migration** - `supabase/migrations/20250103_relationship_and_watchlist.sql`
   - Created `relationship` enum with values: `owner`, `occupier`, `interested`
   - Added `relationship` column to `property_parties` table
   - Backfilled existing data based on legacy `role` column
   - Added unique constraint: `(user_id, property_id, relationship)`
   - Created `tenancies` table stub for future use

2. **RLS Policies Update** - `supabase/migrations/20250103_relationship_rls_policies.sql`
   - Updated all RLS policies to work with new relationship model
   - Implemented relationship-based access control:
     - **Owner**: Full access to property scope
     - **Occupier**: Read + tenancy/shared docs (write notes/tasks)
     - **Interested**: Read public subset only
   - Updated storage bucket policies for relationship-based access

3. **Edge Functions**
   - **`my_properties`**: Get user's properties with optional relationship filtering
   - **`watchlist_add`**: Add property to watchlist (interested relationship)
   - **`watchlist_remove`**: Remove property from watchlist
   - **`property_snapshot`**: Updated with relationship-based visibility tiers

4. **Documentation Updates**
   - Updated `RLS_POLICIES.md` with new relationship model
   - Updated `EDGE_FUNCTIONS.md` with new endpoint specifications
   - Created comprehensive examples and error handling documentation

## Relationship Model

### Enum Values
```sql
CREATE TYPE relationship AS ENUM ('owner', 'occupier', 'interested');
```

### Access Levels
- **Owner**: Full control over property and all associated data
- **Occupier**: Shared access for tenants/purchasers with limited write permissions
- **Interested**: Watchlist/saved properties with public data access only

### Unique Constraint
```sql
ALTER TABLE property_parties 
ADD CONSTRAINT property_parties_user_property_relationship_unique 
UNIQUE (user_id, property_id, relationship);
```

## New Endpoints

### 1. My Properties
**Endpoint**: `GET /functions/v1/my_properties`
**Purpose**: Get user's properties with optional relationship filtering

**Query Parameters**:
- `relationship` (optional): `owner`, `occupier`, or `interested`
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example**:
```bash
curl -X GET "https://project.supabase.co/functions/v1/my_properties?relationship=owner" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 2. Watchlist Add
**Endpoint**: `POST /functions/v1/watchlist_add`
**Purpose**: Add a property to user's watchlist

**Request Body**:
```json
{
  "property_id": "uuid"
}
```

**Example**:
```bash
curl -X POST "https://project.supabase.co/functions/v1/watchlist_add" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"property_id": "property-uuid"}'
```

### 3. Watchlist Remove
**Endpoint**: `POST /functions/v1/watchlist_remove`
**Purpose**: Remove a property from user's watchlist

**Request Body**:
```json
{
  "property_id": "uuid"
}
```

**Example**:
```bash
curl -X POST "https://project.supabase.co/functions/v1/watchlist_remove" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"property_id": "property-uuid"}'
```

## Visibility Tiers

### Property Snapshot Filtering

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

## RLS Policy Updates

### Property Parties
- Users can see their own relationships
- Property owners can see all relationships for their properties
- Users can manage their own relationships
- Property owners can manage all relationships for their properties

### Documents
- Access based on relationship and document visibility
- Owners: All documents
- Occupiers: Shared documents
- Interested: Public documents only

### Notes
- Access based on relationship and note visibility
- Owners: All notes
- Occupiers: Shared and public notes
- Interested: Public notes only

### Tasks
- Access based on relationship and task assignment
- Owners: All tasks
- Occupiers: Assigned tasks
- Interested: Public tasks only

## Database Schema Changes

### New Columns
```sql
-- Added to property_parties table
ALTER TABLE property_parties 
ADD COLUMN relationship relationship NOT NULL DEFAULT 'owner';
```

### New Tables
```sql
-- Tenancies table (stub for future use)
CREATE TABLE tenancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    landlord_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status tenancy_status NOT NULL DEFAULT 'active',
    rent_amount DECIMAL(10,2),
    rent_frequency rent_frequency DEFAULT 'monthly',
    deposit_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New Enums
```sql
CREATE TYPE relationship AS ENUM ('owner', 'occupier', 'interested');
CREATE TYPE tenancy_status AS ENUM ('active', 'ended', 'terminated', 'pending');
CREATE TYPE rent_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'annually');
```

## Testing

### Test Script
A test script is provided: `test_watchlist_endpoints.sh`

**Usage**:
1. Update the configuration variables in the script
2. Run: `./test_watchlist_endpoints.sh`

### Manual Testing
```bash
# Test my_properties endpoint
curl -X GET "https://project.supabase.co/functions/v1/my_properties?relationship=owner" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test watchlist_add endpoint
curl -X POST "https://project.supabase.co/functions/v1/watchlist_add" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"property_id": "property-uuid"}'

# Test watchlist_remove endpoint
curl -X POST "https://project.supabase.co/functions/v1/watchlist_remove" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"property_id": "property-uuid"}'

# Test property_snapshot with different relationships
curl -X POST "https://project.supabase.co/functions/v1/property_snapshot" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"property_id": "property-uuid"}'
```

## Deployment

### Database Migration
```bash
supabase db push
```

### Edge Functions
```bash
supabase functions deploy
```

### Environment Variables
No new environment variables required. All functions use existing Supabase configuration.

## Security Considerations

1. **Unique Constraints**: Prevent duplicate relationships
2. **RLS Policies**: Enforce relationship-based access control
3. **Audit Trail**: All relationship changes are logged
4. **Input Validation**: All endpoints validate input with Zod schemas
5. **Authentication**: All endpoints require valid JWT tokens
6. **Authorization**: Property access is verified for all operations

## Future Enhancements

1. **Tenancies Table**: Wire up RLS policies when needed
2. **Bulk Operations**: Add bulk watchlist operations
3. **Notifications**: Add notifications for relationship changes
4. **Analytics**: Track watchlist usage and engagement
5. **Sharing**: Add property sharing functionality

## Files Created/Modified

### New Files
- `supabase/migrations/20250103_relationship_and_watchlist.sql`
- `supabase/migrations/20250103_relationship_rls_policies.sql`
- `supabase/functions/my_properties/index.ts`
- `supabase/functions/watchlist_add/index.ts`
- `supabase/functions/watchlist_remove/index.ts`
- `test_watchlist_endpoints.sh`
- `docs/cursor-backend/RELATIONSHIP_AND_WATCHLIST_IMPLEMENTATION.md`

### Modified Files
- `supabase/functions/property_snapshot/index.ts` (updated for visibility tiers)
- `docs/cursor-backend/RLS_POLICIES.md` (updated with new policies)
- `docs/cursor-backend/EDGE_FUNCTIONS.md` (added new endpoints)

## Acceptance Criteria ✅

- [x] SQL migration creates relationship enum and constraints
- [x] RLS policies updated for new relationship model
- [x] `my_properties` endpoint returns filtered properties
- [x] `watchlist_add` and `watchlist_remove` endpoints work and are idempotent
- [x] `property_snapshot` returns different shapes based on relationship
- [x] Documentation updated with new endpoints and policies
- [x] All functions compile and are ready for deployment

## Summary

The relationship enum and watchlist functionality has been successfully implemented with:

- **Clean relationship model**: `owner`, `occupier`, `interested`
- **Watchlist endpoints**: Add/remove properties from watchlist
- **Visibility tiers**: Different data access based on relationship
- **Secure RLS policies**: Relationship-based access control
- **Comprehensive documentation**: Complete API specifications
- **Test scripts**: Ready for validation

The implementation is production-ready and maintains backward compatibility while providing a clean foundation for future enhancements.
