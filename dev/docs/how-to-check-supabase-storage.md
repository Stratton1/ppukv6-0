# How to Check Supabase Storage in PPUK

## 📦 Storage Buckets Overview

PPUK uses two Supabase storage buckets:

| Bucket Name | Public | Purpose | RLS Policy |
|-------------|--------|---------|------------|
| `property-documents` | ❌ Private | EPCs, deeds, surveys | Owner-only access |
| `property-photos` | ✅ Public | Property images | Public read, owner write |

---

## 🔍 Method 1: Via Lovable Backend (Easiest)

### Step-by-Step:

1. **Open Backend Interface**
   - In Lovable chat, look for the "View Backend" button
   - Or click the Backend tab in Lovable editor

2. **Navigate to Storage**
   - Click **Storage** in the left sidebar
   - You'll see a list of all buckets

3. **Select a Bucket**
   - Click `property-documents` or `property-photos`
   - Browse folder structure (organized by property ID)

4. **View Files**
   - Click any file to see details:
     - File size
     - Upload date
     - MIME type
     - Public URL (if public bucket)

5. **Generate Signed URL**
   - For private files, click "Generate Signed URL"
   - Copy URL and test in new tab
   - URL expires after 1 hour (configurable)

6. **Download File**
   - Click "Download" to get local copy
   - Verify file opens correctly

### Screenshot Example:
```
[Backend UI]
├── Storage
│   ├── property-documents/
│   │   ├── 11111111-1111-1111-1111-111111111111/
│   │   │   ├── 1704990000.pdf (EPC)
│   │   │   └── 1704990123.pdf (Survey)
│   └── property-photos/
│       └── 11111111-1111-1111-1111-111111111111/
│           ├── 1704990456.jpg (Front)
│           └── 1704990789.jpg (Kitchen)
```

---

## 🔍 Method 2: Via Supabase Dashboard (If Using External Project)

### Step-by-Step:

1. **Login to Supabase**
   - Go to: `https://supabase.com/dashboard`
   - Select your PPUK project

2. **Open Storage**
   - Left sidebar → Click "Storage" icon
   - See list of buckets

3. **Browse Files**
   - Click bucket name
   - Navigate folders (organized by property UUID)

4. **File Actions**
   - **View:** Click file name
   - **Download:** Click download icon
   - **Copy URL:** Click copy icon (public files only)
   - **Delete:** Click trash icon (test carefully!)

5. **Check Policies**
   - Click "Policies" tab
   - Review RLS rules for each bucket

### Example Policies:

**property-documents (Private)**
```sql
Policy: "Property owners can view their documents"
Type: SELECT
Check: auth.uid() IN (
  SELECT claimed_by FROM properties 
  WHERE id::text = (storage.foldername(name))[1]
)
```

**property-photos (Public)**
```sql
Policy: "Anyone can view property photos"
Type: SELECT
Check: bucket_id = 'property-photos'
```

---

## 🔍 Method 3: Programmatic Check (Browser Console)

### Check Files in Bucket:

Open browser console on any PPUK page and run:

```javascript
// List all files in property-documents
const { data, error } = await supabase.storage
  .from('property-documents')
  .list('11111111-1111-1111-1111-111111111111');

if (error) {
  console.error('Error:', error);
} else {
  console.log('Files found:', data);
  data.forEach(file => {
    console.log(`- ${file.name} (${file.metadata.size} bytes)`);
  });
}
```

### Get Signed URL:

```javascript
// Get signed URL for private document
const { data, error } = await supabase.storage
  .from('property-documents')
  .createSignedUrl(
    '11111111-1111-1111-1111-111111111111/1704990000.pdf',
    3600 // expires in 1 hour
  );

if (error) {
  console.error('Error:', error);
} else {
  console.log('Signed URL:', data.signedUrl);
  // Click URL to test download
}
```

### Get Public URL:

```javascript
// For public photos bucket
const { data } = supabase.storage
  .from('property-photos')
  .getPublicUrl('11111111-1111-1111-1111-111111111111/1704990456.jpg');

console.log('Public URL:', data.publicUrl);
```

---

## 🧪 Testing Checklist

Use this checklist to verify storage is working:

### Pre-Upload Tests:
- [ ] Both buckets exist in Storage UI
- [ ] RLS policies are configured
- [ ] Folder structure matches property UUIDs

### Upload Test:
- [ ] Upload a test file via PPUK UI
- [ ] File appears in correct bucket/folder
- [ ] Database record created (documents/property_photos table)
- [ ] File size matches original

### Download Test:
- [ ] Generate signed URL for private file
- [ ] URL downloads file successfully
- [ ] Public photo URL loads in browser
- [ ] URLs expire after configured time

### Security Test:
- [ ] Non-owner cannot access private document URL
- [ ] Logged-out user cannot list private files
- [ ] Public photos accessible without auth

---

## 🐛 Common Issues

### Issue: "Bucket not found"
**Cause:** Migration didn't run or buckets deleted  
**Fix:**
```sql
-- Re-create buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('property-documents', 'property-documents', false),
  ('property-photos', 'property-photos', true);
```

### Issue: "Access denied" when viewing file
**Cause:** RLS policy blocking access  
**Fix:** Check user is logged in and is property owner

### Issue: "Signed URL expired"
**Cause:** URL older than 1 hour  
**Fix:** Generate new signed URL

### Issue: "File not found after upload"
**Cause:** Upload didn't complete or wrong path  
**Fix:** Check console logs, verify file path format

---

## 📊 Storage Metrics

### Check Usage:

Via Supabase Dashboard:
1. Project → Settings → Usage
2. View storage usage graph
3. Current usage / Quota

### Monitor Performance:

```javascript
// Time storage operations
console.time('storage-upload');
const { data, error } = await supabase.storage
  .from('property-documents')
  .upload('test.pdf', file);
console.timeEnd('storage-upload');
```

---

## 🔐 Security Best Practices

1. **Never expose signed URLs** in public HTML
2. **Use short expiry times** (1-4 hours max)
3. **Verify user ownership** before generating URLs
4. **Log all storage access** for audit trail
5. **Regularly review RLS policies**

---

## 📝 Next Steps

After verifying storage:
1. Test file upload flow end-to-end
2. Check RLS policies prevent unauthorized access
3. Verify file cleanup on property/document deletion
4. Test large file uploads (edge cases)
5. Monitor storage quotas

---

**Last Updated:** 2025-01-10  
**Related Docs:** 
- `test-instructions.md` - Full testing guide
- `../scripts/seed-dev-data.sql` - Test data
- `../supabase/functions/*/` - Edge functions