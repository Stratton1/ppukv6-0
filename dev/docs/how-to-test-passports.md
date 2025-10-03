# How to Test Property Passports

## Overview

This guide covers testing the complete property passport functionality including photo galleries, document management, and access controls.

---

## Quick Start

### 1. Seed Demo Data

Visit `/test-login` to automatically seed test users and properties, then run:

```typescript
// In browser console or via button on test page
await supabase.functions.invoke("seed-property-media");
```

This adds 3-5 demo photos and 2 demo documents to each property.

### 2. Login as Test User

- **Owner:** owner@ppuk.test / password123
- **Buyer:** buyer@ppuk.test / password123

### 3. Navigate to Property Passport

From dashboard, click any property card or go directly to:
`/passport/[property-id]`

---

## Feature Testing Checklist

### A. Photo Gallery Tests

#### Test A1: View Photos (All Users)

**Steps:**

1. Login as Owner or Buyer
2. Navigate to property passport page
3. Click "Photos" tab

**Expected:**

- ✅ Gallery displays all photos in grid layout
- ✅ Photos are properly sized and responsive
- ✅ Click photo opens lightbox preview
- ✅ Lightbox shows caption and room type
- ✅ Close button works

**Evidence:** Screenshot of photo gallery

#### Test A2: Upload Photo (Owner Only)

**Steps:**

1. Login as Owner (owner@ppuk.test)
2. Go to property you claimed
3. Click "Photos" tab
4. Click "Upload Photo" button
5. Select image file (JPG/PNG, max 5MB)
6. Enter caption: "Test Kitchen Photo"
7. Enter room type: "Kitchen"
8. Click "Upload"

**Expected:**

- ✅ Upload dialog opens
- ✅ File selector accepts images only
- ✅ Shows file name and size after selection
- ✅ Upload button enabled when file selected
- ✅ Shows loading spinner during upload
- ✅ Toast: "Photo uploaded successfully"
- ✅ New photo appears in gallery immediately

**SQL Verification:**

```sql
SELECT id, property_id, file_name, caption, room_type, uploaded_by, created_at
FROM property_photos
WHERE property_id = '[your-property-id]'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:** New row with your uploaded photo

#### Test A3: File Size Validation

**Steps:**

1. Login as Owner
2. Try uploading image > 5MB

**Expected:**

- ❌ Toast: "File too large - Maximum file size is 5MB"
- ❌ Upload blocked

#### Test A4: Photo Access Control (Buyer)

**Steps:**

1. Login as Buyer
2. Navigate to any public property passport
3. Click "Photos" tab

**Expected:**

- ✅ Can view all photos
- ✅ Can open lightbox
- ❌ No "Upload Photo" button visible

---

### B. Document Management Tests

#### Test B1: View Documents (All Users)

**Steps:**

1. Login as any user
2. Navigate to property passport
3. Click "Documents" tab

**Expected:**

- ✅ Document list displays
- ✅ Shows file name, type, and size
- ✅ Shows description if present
- ✅ "Download Document" button visible

#### Test B2: Upload Document (Owner Only)

**Steps:**

1. Login as Owner
2. Go to claimed property
3. Click "Documents" tab
4. Find "Upload Document" card
5. Click "Select File", choose PDF/DOCX
6. Select document type: "EPC Certificate"
7. Enter description: "Current EPC rating B"
8. Click "Upload Document"

**Expected:**

- ✅ Upload dialog shows
- ✅ File selector accepts PDF, DOCX, PNG, JPG
- ✅ Shows file name and size (KB)
- ✅ Upload button enabled when file + type selected
- ✅ Toast: "Document uploaded successfully"
- ✅ New document appears in list

**SQL Verification:**

```sql
SELECT id, property_id, document_type, file_name, file_size_bytes, mime_type, description, uploaded_by
FROM documents
WHERE property_id = '[your-property-id]'
ORDER BY created_at DESC
LIMIT 5;
```

#### Test B3: Download Document with Signed URL

**Steps:**

1. Login as any user (Owner or Buyer)
2. Navigate to property passport
3. Click "Documents" tab
4. Click "Download Document" on any document

**Expected:**

- ✅ Loading indicator appears briefly
- ✅ New tab opens with document
- ✅ URL contains signed token (not direct public URL)
- ✅ URL format: `...storage.supabase.co/object/sign/property-documents/...?token=...`
- ✅ Document downloads/views successfully

**Network Tab Check:**

1. Open DevTools > Network
2. Filter: "createSignedUrl"
3. Verify POST request to Supabase storage API
4. Response should contain `signedUrl` field

#### Test B4: Document Type Validation

**Steps:**

1. Login as Owner
2. Try uploading .exe or .zip file

**Expected:**

- ❌ File selector should only accept: `.pdf,.docx,.png,.jpg,.jpeg`
- ❌ Browser blocks selection of invalid types

#### Test B5: File Size Limit (Documents)

**Steps:**

1. Try uploading document > 10MB

**Expected:**

- ❌ Toast: "File too large - Maximum file size is 10MB"
- ❌ Upload blocked

---

### C. Row Level Security (RLS) Tests

#### Test C1: Owner Can Upload to Own Property

**Steps:**

1. Login as owner@ppuk.test
2. Claim a property (if not claimed)
3. Upload photo or document

**Expected:**

- ✅ Upload succeeds
- ✅ Record created with `uploaded_by = [owner's UUID]`

**SQL Check:**

```sql
SELECT p.ppuk_reference, p.claimed_by, d.file_name, d.uploaded_by
FROM properties p
JOIN documents d ON d.property_id = p.id
WHERE p.claimed_by = '[owner-uuid]'
LIMIT 5;
```

#### Test C2: Owner Cannot Upload to Others' Property

**Steps:**

1. Login as owner@ppuk.test
2. Navigate to property claimed by different user
3. Attempt to upload photo/document

**Expected:**

- ❌ Upload button not visible OR
- ❌ Upload fails with RLS error

#### Test C3: Buyer Cannot Upload Anywhere

**Steps:**

1. Login as buyer@ppuk.test
2. Navigate to any property passport
3. Check "Photos" and "Documents" tabs

**Expected:**

- ❌ No "Upload Photo" button
- ❌ No "Upload Document" card
- ✅ Can view all photos/documents

#### Test C4: Anonymous User Access

**Steps:**

1. Logout (clear session)
2. Try navigating to `/passport/[property-id]`

**Expected:**

- Redirect to /login OR
- Can view if property is public, but no uploads

---

### D. Storage Bucket Verification

#### Test D1: Check property-photos Bucket (Public)

**Steps:**

1. Open Lovable Cloud backend
2. Navigate to Storage section
3. Select `property-photos` bucket
4. Browse files

**Expected:**

- ✅ Bucket exists
- ✅ Public = true
- ✅ Files organized by folder: `/[property-id]/[filename]`
- ✅ Can view images directly via public URL
- ✅ URL format: `...storage.supabase.co/object/public/property-photos/...`

**Programmatic Check:**

```sql
SELECT name, public FROM storage.buckets WHERE name = 'property-photos';
```

Expected: `public = true`

#### Test D2: Check property-documents Bucket (Private)

**Steps:**

1. Open Lovable Cloud backend
2. Navigate to Storage section
3. Select `property-documents` bucket
4. Browse files

**Expected:**

- ✅ Bucket exists
- ✅ Public = false
- ✅ Files organized by folder: `/[property-id]/[filename]`
- ❌ Direct URL access without signed token fails
- ✅ Signed URL access works (1 hour expiry)

**Programmatic Check:**

```sql
SELECT name, public FROM storage.buckets WHERE name = 'property-documents';
```

Expected: `public = false`

---

### E. Property Passport Page Layout

#### Test E1: Overview Tab

**Steps:**

1. Navigate to any property passport
2. Click "Overview" tab

**Expected:**

- ✅ Displays property type, style, bedrooms
- ✅ Shows floor area in m²
- ✅ Shows EPC rating and score
- ✅ Displays tenure (freehold/leasehold)
- ✅ Shows flood risk level
- ✅ Title number displayed if available
- ✅ All cards have proper styling

#### Test E2: Documents Tab

**Steps:**

1. Click "Documents" tab

**Expected:**

- ✅ Shows upload card (if owner)
- ✅ Shows passport completion score
- ✅ Lists all documents with type badges
- ✅ Each document shows file name, size, description
- ✅ Download buttons functional

#### Test E3: Photos Tab

**Steps:**

1. Click "Photos" tab

**Expected:**

- ✅ Upload button visible (if owner)
- ✅ Grid layout of photos
- ✅ Responsive design (2 cols mobile, 3 tablet, 4 desktop)
- ✅ Click opens lightbox
- ✅ Lightbox shows full image + caption

#### Test E4: Data Tab (API Placeholders)

**Steps:**

1. Click "Data" tab

**Expected:**

- ✅ Shows 4 cards: EPC, Flood Risk, Title Info, Planning
- ✅ Each card displays mock data
- ✅ Marked as placeholder/demo data

#### Test E5: History & Insights Tabs

**Steps:**

1. Click "History" and "Insights" tabs

**Expected:**

- ✅ Placeholder messages
- ✅ "Coming soon" text
- ✅ Appropriate icons

---

### F. Error Handling Tests

#### Test F1: Upload Network Error

**Steps:**

1. Open DevTools > Network
2. Set throttling to "Offline"
3. Try uploading photo/document

**Expected:**

- ❌ Toast: "Upload failed" with error message
- ❌ Upload state resets
- ✅ Can retry after reconnecting

#### Test F2: Invalid File Type

**Steps:**

1. Try uploading .txt or .exe file

**Expected:**

- ❌ File selector blocks invalid types
- OR ❌ Toast: "Invalid file type"

#### Test F3: Signed URL Expiry

**Steps:**

1. Generate signed URL for document
2. Wait 1 hour + 1 minute
3. Try accessing URL

**Expected:**

- ❌ Expired token error
- ✅ Can regenerate by clicking "Download" again

---

## Database Queries for Verification

### Check All Photos for Property

```sql
SELECT
  pp.id,
  pp.file_name,
  pp.caption,
  pp.room_type,
  pp.is_featured,
  pp.created_at,
  p.ppuk_reference,
  prof.full_name AS uploaded_by_name
FROM property_photos pp
JOIN properties p ON p.id = pp.property_id
LEFT JOIN profiles prof ON prof.id = pp.uploaded_by
WHERE p.ppuk_reference LIKE 'PPUK-DEV%'
ORDER BY pp.created_at DESC;
```

### Check All Documents for Property

```sql
SELECT
  d.id,
  d.document_type,
  d.file_name,
  d.file_size_bytes,
  d.mime_type,
  d.description,
  d.created_at,
  p.ppuk_reference,
  prof.full_name AS uploaded_by_name
FROM documents d
JOIN properties p ON p.id = d.property_id
LEFT JOIN profiles prof ON prof.id = d.uploaded_by
WHERE p.ppuk_reference LIKE 'PPUK-DEV%'
ORDER BY d.created_at DESC;
```

### Verify RLS Policies

```sql
-- Check property_photos policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'property_photos';

-- Check documents policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'documents';
```

---

## Security Checklist

Before deploying to production:

- [ ] property-photos bucket is public (for gallery display)
- [ ] property-documents bucket is private (sensitive docs)
- [ ] RLS policies prevent cross-user uploads
- [ ] RLS policies allow owners to manage their content
- [ ] Buyers can view but not modify
- [ ] File size limits enforced (5MB photos, 10MB docs)
- [ ] File type validation enforced
- [ ] Signed URLs used for private documents
- [ ] Signed URLs have reasonable expiry (1 hour)
- [ ] No service_role key exposed in frontend
- [ ] Upload functions validate user authentication

---

## Common Issues & Troubleshooting

### Issue: "Upload failed - Not authenticated"

**Fix:** Ensure user is logged in. Check session in browser console:

```javascript
const {
  data: { user },
} = await supabase.auth.getUser();
console.log(user);
```

### Issue: "RLS policy violation"

**Fix:** Verify user owns the property:

```sql
SELECT id, claimed_by FROM properties WHERE id = '[property-id]';
```

Compare `claimed_by` with logged-in user's UUID.

### Issue: Photos not displaying

**Fix:**

1. Check bucket is public: `SELECT public FROM storage.buckets WHERE name = 'property-photos';`
2. Verify file URLs in DB: `SELECT file_url FROM property_photos WHERE property_id = '...';`
3. Test URL directly in browser

### Issue: "Download Document" button does nothing

**Fix:**

1. Open browser console, check for errors
2. Verify file path extraction logic
3. Test signed URL generation manually:

```javascript
const { data, error } = await supabase.storage
  .from("property-documents")
  .createSignedUrl("property-id/filename.pdf", 3600);
console.log(data, error);
```

### Issue: Demo photos not seeding

**Fix:**

1. Check edge function logs: Lovable Cloud > Edge Functions > seed-property-media
2. Verify properties exist: `SELECT COUNT(*) FROM properties WHERE ppuk_reference LIKE 'PPUK-DEV%';`
3. Re-run seed function

---

## Test Report Template

### Test Run: [Date]

**Tester:** [Name]  
**Environment:** Dev / Staging / Production  
**Browser:** Chrome / Firefox / Safari

| Test ID | Feature                  | Status  | Notes                   |
| ------- | ------------------------ | ------- | ----------------------- |
| A1      | View Photos              | ✅ PASS | Gallery loads correctly |
| A2      | Upload Photo             | ✅ PASS | Upload successful       |
| A3      | File Size Validation     | ✅ PASS | Blocks large files      |
| A4      | Buyer Photo Access       | ✅ PASS | Read-only confirmed     |
| B1      | View Documents           | ✅ PASS | List displays           |
| B2      | Upload Document          | ✅ PASS | Upload + DB entry       |
| B3      | Download Signed URL      | ✅ PASS | Token generated         |
| B4      | Document Type Validation | ✅ PASS | Blocks invalid          |
| B5      | Doc Size Limit           | ✅ PASS | 10MB enforced           |
| C1      | Owner Upload             | ✅ PASS | RLS allows              |
| C2      | Cross-User Upload Block  | ✅ PASS | RLS denies              |
| C3      | Buyer Cannot Upload      | ✅ PASS | UI hidden               |
| C4      | Anonymous Access         | ✅ PASS | Redirect or view-only   |
| D1      | Photos Bucket Public     | ✅ PASS | Verified                |
| D2      | Docs Bucket Private      | ✅ PASS | Verified                |
| E1-E5   | Page Layout              | ✅ PASS | All tabs functional     |
| F1-F3   | Error Handling           | ✅ PASS | Errors caught           |

**Summary:**

- Total Tests: 19
- Passed: 19
- Failed: 0
- Blocked: 0

**Issues Found:** None

**Recommendations:**

- Consider adding batch photo upload
- Add drag-and-drop for documents
- Implement photo reordering

---

## Next Steps After Testing

1. **Real API Integration** (Cursor phase)
   - Replace mock EPC data with real API calls
   - Integrate HM Land Registry API
   - Connect flood risk API

2. **AI Document Analysis**
   - Implement OCR for scanned documents
   - Auto-extract key fields (EPC rating, title number)
   - Generate summaries

3. **Enhanced Features**
   - Photo annotations and markup
   - Document version control
   - Batch uploads
   - Folder organization

4. **Performance**
   - Image optimization and lazy loading
   - CDN integration
   - Thumbnail generation

---

**Last Updated:** 2025-01-10  
**Version:** 1.0  
**Status:** ✅ Ready for Testing
