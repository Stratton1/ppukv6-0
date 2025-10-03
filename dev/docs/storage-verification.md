# Storage Verification Guide

This document provides SQL queries and instructions for verifying that the Property Passport UK storage system is working correctly.

## Overview

The PPUK platform uses two Supabase storage buckets:

- **property-photos** (public) - For property photos that can be viewed by anyone
- **property-documents** (private) - For sensitive documents that require signed URLs

Data is stored in two database tables:

- **media** - For photos and other media (type='photo')
- **documents** - For property documents with metadata

## SQL Verification Queries

### 1. Check Storage Buckets

```sql
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id IN ('property-photos','property-documents')
ORDER BY created_at;
```

**Expected Result:**

- `property-photos` should exist with `public = true`
- `property-documents` should exist with `public = false`

### 2. Check Media Table (Photos)

```sql
SELECT id, property_id, type, url, caption, created_at
FROM media
WHERE type = 'photo'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**

- Should show recent photo uploads
- `type` should be 'photo'
- `url` should contain public URLs to property-photos bucket

### 3. Check Documents Table

```sql
SELECT id, property_id, file_name, mime_type, file_size_bytes, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**

- Should show recent document uploads
- `file_name` should contain original filenames
- `file_size_bytes` should show file sizes

### 4. Check RLS Policies

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('media', 'documents')
ORDER BY tablename, policyname;
```

**Expected Result:**

- Should show RLS policies for both tables
- Policies should allow property owners to manage their data
- Public read access for media on public properties

## Manual Testing Steps

### 1. Test Photo Upload

1. Navigate to `/debug/storage`
2. Click "Upload Test Photo"
3. Verify success message
4. Check that photo appears in the Media section
5. Verify the image is publicly accessible

### 2. Test Document Upload

1. Navigate to `/debug/storage`
2. Click "Upload Test Document"
3. Verify success message
4. Check that document appears in the Documents section
5. Click "Test Signed URL" to verify private access

### 3. Test Property Passport Integration

1. Login as a property owner
2. Navigate to a property passport
3. Upload a real photo via the Photos tab
4. Upload a real document via the Documents tab
5. Verify photos appear in gallery
6. Verify document download works with signed URL

## Troubleshooting

### Common Issues

**"Media table not found"**

- Run the media table migration: `supabase/migrations/20251003_create_media_table.sql`
- Check that the migration was applied successfully

**"Storage bucket not found"**

- Run the bucket migration: `supabase/migrations/20251003_create_ppuk_buckets.sql`
- Verify buckets exist in Supabase dashboard

**"RLS policy violation"**

- Check that user is authenticated
- Verify property ownership
- Check RLS policies are correctly configured

**"Signed URL generation failed"**

- Verify document exists in storage
- Check file path is correct
- Ensure user has permission to access the document

### Verification Script

Run the automated verification script:

```bash
npm run verify:storage
```

This will:

- Check bucket existence
- Verify media and documents data
- Test signed URL generation
- Provide detailed status report

## Security Considerations

### Storage Bucket Security

- **property-photos**: Public bucket for gallery display
- **property-documents**: Private bucket requiring signed URLs
- RLS policies control access at the database level

### File Upload Security

- File type validation (client and server)
- File size limits (5MB photos, 10MB documents)
- Path sanitization to prevent directory traversal
- Authentication required for all uploads

### Signed URL Security

- 1-hour expiry for document access
- User must be authenticated
- Property ownership verified
- No direct access to private bucket

## Performance Optimization

### Caching

- Photos use public URLs for fast loading
- Documents use signed URLs with 1-hour cache
- Consider CDN for production deployment

### Database Indexes

- `idx_media_property_id` for photo queries
- `idx_media_type` for filtering by media type
- `idx_documents_property_id` for document queries

## Monitoring

### Key Metrics to Monitor

- Storage bucket usage
- Upload success/failure rates
- Signed URL generation performance
- RLS policy effectiveness

### Logging

- Upload attempts and results
- Signed URL generation
- RLS policy violations
- Storage errors

## Next Steps

1. **Run Migrations**: Apply the SQL migrations in Supabase
2. **Test Uploads**: Use the debug page to verify functionality
3. **Verify Integration**: Test the full Property Passport workflow
4. **Monitor Performance**: Check storage usage and response times
5. **Security Review**: Verify RLS policies and access controls

---

**Last Updated:** 2025-01-03  
**Version:** 1.0  
**Status:** Ready for Testing
