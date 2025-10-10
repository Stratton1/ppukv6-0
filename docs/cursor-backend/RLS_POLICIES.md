# RLS Policies Documentation

## Overview

Row Level Security (RLS) policies control data access at the database level, ensuring users can only access data they're authorized to see. This document outlines all RLS policies implemented in the PPUK v6 backend.

## Policy Architecture

### Core Principles
- **Principle of Least Privilege**: Users only access data they need
- **Role-Based Access**: Different access levels for different user types
- **Property-Centric Security**: Access based on property relationships
- **Audit Trail**: All access attempts logged for compliance

### User Roles & Relationships
1. **Owner**: Full access to their properties (create, read, update, delete)
2. **Occupier**: Read access to shared properties + write notes/tasks (tenant, purchaser)
3. **Interested**: Read-only access to public subset (watchlist/saved properties)
4. **Admin**: Elevated access via custom JWT claims

### Relationship Model
The system uses a formal relationship enum to define user-property relationships:
- `owner`: Full control over property and all associated data
- `occupier`: Shared access for tenants/purchasers with limited write permissions
- `interested`: Watchlist/saved properties with public data access only

## Table Policies

### 1. Users Table

**Policy**: `Users can view their own profile`
```sql
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);
```

**Policy**: `Users can update their own profile`
```sql
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);
```

### 2. Properties Table

**Policy**: `Users can view properties they have access to`
```sql
CREATE POLICY "Users can view properties they have access to" ON properties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = properties.id
            AND pp.user_id = auth.uid()
        )
    );
```

**Policy**: `Property owners can insert properties`
```sql
CREATE POLICY "Property owners can insert properties" ON properties
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND created_by = auth.uid()
    );
```

**Policy**: `Property owners can update their properties`
```sql
CREATE POLICY "Property owners can update their properties" ON properties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = properties.id
            AND pp.user_id = auth.uid()
            AND pp.role = 'owner'
        )
    );
```

### 3. Property Parties Table

**Policy**: `Users can view property parties based on relationship`
```sql
CREATE POLICY "Users can view property parties for properties they have access to" ON property_parties
    FOR SELECT USING (
        -- Users can see their own relationships
        user_id = auth.uid()
        OR
        -- Property owners can see all relationships for their properties
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = property_parties.property_id
            AND pp.user_id = auth.uid()
            AND pp.relationship = 'owner'
        )
    );
```

**Policy**: `Users can manage their own relationships`
```sql
CREATE POLICY "Users can manage their own relationships" ON property_parties
    FOR ALL USING (
        user_id = auth.uid()
        OR
        -- Property owners can manage all relationships for their properties
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = property_parties.property_id
            AND pp.user_id = auth.uid()
            AND pp.relationship = 'owner'
        )
    );
```

**Unique Constraint**: `Prevent duplicate relationships`
```sql
ALTER TABLE property_parties 
ADD CONSTRAINT property_parties_user_property_relationship_unique 
UNIQUE (user_id, property_id, relationship);
```

### 4. Documents Table

**Policy**: `Users can view documents for properties they have access to`
```sql
CREATE POLICY "Users can view documents for properties they have access to" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = documents.property_id
            AND pp.user_id = auth.uid()
        )
    );
```

**Policy**: `Users can upload documents to properties they have access to`
```sql
CREATE POLICY "Users can upload documents to properties they have access to" ON documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = documents.property_id
            AND pp.user_id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );
```

**Policy**: `Document owners can update their documents`
```sql
CREATE POLICY "Document owners can update their documents" ON documents
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = documents.property_id
            AND pp.user_id = auth.uid()
            AND pp.role = 'owner'
        )
    );
```

### 5. Notes Table

**Policy**: `Users can view notes for properties they have access to`
```sql
CREATE POLICY "Users can view notes for properties they have access to" ON notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = notes.property_id
            AND pp.user_id = auth.uid()
        )
    );
```

**Policy**: `Users can create notes for properties they have access to`
```sql
CREATE POLICY "Users can create notes for properties they have access to" ON notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = notes.property_id
            AND pp.user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );
```

**Policy**: `Note authors can update their notes`
```sql
CREATE POLICY "Note authors can update their notes" ON notes
    FOR UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = notes.property_id
            AND pp.user_id = auth.uid()
            AND pp.role = 'owner'
        )
    );
```

### 6. Tasks Table

**Policy**: `Users can view tasks for properties they have access to`
```sql
CREATE POLICY "Users can view tasks for properties they have access to" ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = tasks.property_id
            AND pp.user_id = auth.uid()
        )
    );
```

**Policy**: `Users can create tasks for properties they have access to`
```sql
CREATE POLICY "Users can create tasks for properties they have access to" ON tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = tasks.property_id
            AND pp.user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );
```

**Policy**: `Task assignees and creators can update tasks`
```sql
CREATE POLICY "Task assignees and creators can update tasks" ON tasks
    FOR UPDATE USING (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = tasks.property_id
            AND pp.user_id = auth.uid()
            AND pp.role = 'owner'
        )
    );
```

### 7. API Cache Table

**Policy**: `Users can view cached data for properties they have access to`
```sql
CREATE POLICY "Users can view cached data for properties they have access to" ON api_cache
    FOR SELECT USING (
        provider = 'epc' AND EXISTS (
            SELECT 1 FROM properties p
            JOIN property_parties pp ON pp.property_id = p.id
            WHERE pp.user_id = auth.uid()
            AND p.upn = (api_cache.meta->>'upn')::text
        )
        OR provider = 'flood' AND EXISTS (
            SELECT 1 FROM properties p
            JOIN property_parties pp ON pp.property_id = p.id
            WHERE pp.user_id = auth.uid()
            AND p.postcode = (api_cache.meta->>'postcode')::text
        )
        OR provider IN ('postcodes', 'osplaces', 'planning', 'companies', 'police')
    );
```

**Policy**: `System can manage cache entries`
```sql
CREATE POLICY "System can manage cache entries" ON api_cache
    FOR ALL USING (true); -- Edge functions have elevated privileges
```

### 8. Audit Log Table

**Policy**: `Users can view audit logs for properties they have access to`
```sql
CREATE POLICY "Users can view audit logs for properties they have access to" ON audit_log
    FOR SELECT USING (
        entity = 'property' AND EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = (entity_id)::uuid
            AND pp.user_id = auth.uid()
        )
        OR entity = 'document' AND EXISTS (
            SELECT 1 FROM documents d
            JOIN property_parties pp ON pp.property_id = d.property_id
            WHERE d.id = (entity_id)::uuid
            AND pp.user_id = auth.uid()
        )
        OR entity = 'note' AND EXISTS (
            SELECT 1 FROM notes n
            JOIN property_parties pp ON pp.property_id = n.property_id
            WHERE n.id = (entity_id)::uuid
            AND pp.user_id = auth.uid()
        )
        OR entity = 'task' AND EXISTS (
            SELECT 1 FROM tasks t
            JOIN property_parties pp ON pp.property_id = t.property_id
            WHERE t.id = (entity_id)::uuid
            AND pp.user_id = auth.uid()
        )
    );
```

**Policy**: `System can insert audit logs`
```sql
CREATE POLICY "System can insert audit logs" ON audit_log
    FOR INSERT WITH CHECK (true); -- Triggers and functions have elevated privileges
```

## Storage Bucket Policies

### 1. Property Images Bucket

**Policy**: `Users can view property images they have access to`
```sql
CREATE POLICY "Users can view property images they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'property-images'
        AND EXISTS (
            SELECT 1 FROM properties p
            JOIN property_parties pp ON pp.property_id = p.id
            WHERE pp.user_id = auth.uid()
            AND storage.objects.name LIKE 'property/' || p.id::text || '/%'
        )
    );
```

**Policy**: `Users can upload property images to properties they have access to`
```sql
CREATE POLICY "Users can upload property images to properties they have access to" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images'
        AND EXISTS (
            SELECT 1 FROM properties p
            JOIN property_parties pp ON pp.property_id = p.id
            WHERE pp.user_id = auth.uid()
            AND storage.objects.name LIKE 'property/' || p.id::text || '/%'
        )
    );
```

### 2. Professional Reports Bucket

**Policy**: `Professionals can upload reports to assigned properties`
```sql
CREATE POLICY "Professionals can upload reports to assigned properties" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'professional-reports'
        AND EXISTS (
            SELECT 1 FROM properties p
            JOIN property_parties pp ON pp.property_id = p.id
            WHERE pp.user_id = auth.uid()
            AND pp.role IN ('agent', 'surveyor', 'conveyancer')
            AND storage.objects.name LIKE 'property/' || p.id::text || '/%'
        )
    );
```

**Policy**: `Users can view professional reports for properties they have access to`
```sql
CREATE POLICY "Users can view professional reports for properties they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'professional-reports'
        AND EXISTS (
            SELECT 1 FROM properties p
            JOIN property_parties pp ON pp.property_id = p.id
            WHERE pp.user_id = auth.uid()
            AND storage.objects.name LIKE 'property/' || p.id::text || '/%'
        )
    );
```

### 3. Warranties & Guarantees Bucket

**Policy**: `Users can manage warranty documents for properties they have access to`
```sql
CREATE POLICY "Users can manage warranty documents for properties they have access to" ON storage.objects
    FOR ALL USING (
        bucket_id = 'warranties-guarantees'
        AND EXISTS (
            SELECT 1 FROM properties p
            JOIN property_parties pp ON pp.property_id = p.id
            WHERE pp.user_id = auth.uid()
            AND storage.objects.name LIKE 'property/' || p.id::text || '/%'
        )
    );
```

### 4. Planning Documents Bucket

**Policy**: `Users can manage planning documents for properties they have access to`
```sql
CREATE POLICY "Users can manage planning documents for properties they have access to" ON storage.objects
    FOR ALL USING (
        bucket_id = 'planning-docs'
        AND EXISTS (
            SELECT 1 FROM properties p
            JOIN property_parties pp ON pp.property_id = p.id
            WHERE pp.user_id = auth.uid()
            AND storage.objects.name LIKE 'property/' || p.id::text || '/%'
        )
    );
```

### 5. Miscellaneous Documents Bucket

**Policy**: `Users can manage miscellaneous documents for properties they have access to`
```sql
CREATE POLICY "Users can manage miscellaneous documents for properties they have access to" ON storage.objects
    FOR ALL USING (
        bucket_id = 'misc-docs'
        AND EXISTS (
            SELECT 1 FROM properties p
            JOIN property_parties pp ON pp.property_id = p.id
            WHERE pp.user_id = auth.uid()
            AND storage.objects.name LIKE 'property/' || p.id::text || '/%'
        )
    );
```

## Admin Override Policies

### Admin Access
```sql
-- Admin users can access all data
CREATE POLICY "Admin users can access all data" ON properties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );
```

### System Access
```sql
-- System functions can access all data
CREATE POLICY "System functions can access all data" ON api_cache
    FOR ALL USING (true); -- Edge functions have elevated privileges
```

## Security Considerations

### 1. JWT Token Validation
- All policies rely on `auth.uid()` for user identification
- JWT tokens must be valid and not expired
- Custom claims (like `role`) are checked for admin access

### 2. Property Access Verification
- All data access is verified through `property_parties` relationships
- Users must have an active relationship with a property to access its data
- Role-based permissions within property relationships

### 3. Audit Trail
- All data access attempts are logged in `audit_log`
- Failed access attempts are recorded for security monitoring
- PII is sanitized in audit logs for compliance

### 4. Data Isolation
- Users can only access data for properties they're associated with
- Cross-property data access is prevented
- Admin users have elevated access for system management

### 5. File Access Control
- Storage bucket policies mirror database RLS policies
- File paths include property IDs for access verification
- Signed URLs have short expiration times (1 hour)

## Testing RLS Policies

### 1. Test User Access
```sql
-- Test property owner access
SELECT * FROM properties WHERE id = 'property-uuid';

-- Test non-owner access (should return empty)
SELECT * FROM properties WHERE id = 'other-property-uuid';
```

### 2. Test Role-Based Access
```sql
-- Test agent access to assigned properties
SELECT * FROM documents 
WHERE property_id IN (
    SELECT property_id FROM property_parties 
    WHERE user_id = auth.uid() AND role = 'agent'
);
```

### 3. Test Storage Access
```sql
-- Test file access
SELECT * FROM storage.objects 
WHERE bucket_id = 'property-images'
AND name LIKE 'property/property-uuid/%';
```

## Policy Maintenance

### 1. Adding New Tables
- Create RLS policies for all new tables
- Follow the property-centric access pattern
- Include audit logging for sensitive data

### 2. Modifying Existing Policies
- Test all existing functionality after changes
- Update documentation
- Consider impact on existing users

### 3. Performance Optimization
- Add indexes for frequently queried columns
- Monitor query performance
- Optimize complex policy conditions

## Compliance and Auditing

### 1. GDPR Compliance
- Users can only access their own data
- Data retention policies are enforced
- Right to be forgotten is supported

### 2. Audit Requirements
- All data access is logged
- Failed access attempts are recorded
- Admin actions are tracked separately

### 3. Security Monitoring
- Monitor for unusual access patterns
- Alert on failed authentication attempts
- Track policy violations

## Troubleshooting

### 1. Common Issues
- **No data returned**: Check user has property access
- **Permission denied**: Verify RLS policies are enabled
- **Storage access denied**: Check bucket policies and file paths

### 2. Debugging Steps
1. Check user authentication status
2. Verify property party relationships
3. Test policy conditions manually
4. Review audit logs for access attempts

### 3. Policy Validation
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE rowsecurity = true;

-- Check policy definitions
SELECT * FROM pg_policies 
WHERE tablename = 'properties';
```
