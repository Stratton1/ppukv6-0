# PPUK Testing Instructions

## 🧪 Environment Setup

### Prerequisites
- Lovable Cloud enabled
- Supabase storage configured
- Dev mode enabled (`NODE_ENV=development`)

### Seed Test Data

**Option 1: Via Edge Function (Recommended)**
1. Navigate to `/test-login`
2. Wait for auto-creation message
3. Verify 2 test users created

**Option 2: Manual SQL**
```bash
# Run the seed script
cat scripts/seed-dev-data.sql | supabase db execute
```

**Option 3: Via Supabase Dashboard**
1. Open Lovable Cloud → Database
2. Run SQL from `scripts/seed-dev-data.sql`

---

## 👥 Test Accounts

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `ppuk_owner@example.com` | `Password123!` | Owner | Full property management |
| `ppuk_buyer@example.com` | `Password123!` | Buyer | Search & view properties |
| `owner@ppuk.test` | `password123` | Owner | Quick test (auto-created) |
| `buyer@ppuk.test` | `password123` | Buyer | Quick test (auto-created) |

---

## 📋 Test Cases

### A. Authentication & Dev Bypass

#### A1: Normal Login
**Steps:**
1. Go to `/login`
2. Enter: `ppuk_owner@example.com` / `Password123!`
3. Click "Login"

**Expected:** Redirected to `/dashboard`  
**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

#### A2: Dev Bypass (Dev Mode Only)
**Steps:**
1. Go to `/test-login`
2. Click "Login as Test Owner"

**Expected:** Instant login, no password required  
**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### B. Seeds & Data Integrity

#### B1: Verify Test Users Exist
**Steps:**
1. Open Backend → Database → Profiles table
2. Search for `ppuk_owner@example.com`

**Expected:** 2 profiles found  
**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

#### B2: Verify Properties Seeded
**Steps:**
1. Backend → Database → Properties table
2. Filter by `ppuk_reference LIKE 'PPUK-DEV%'`

**Expected:** 10 properties found  
**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### C. Storage & File Upload

#### C1: Upload Document
**Steps:**
1. Login as owner
2. Go to property passport
3. Documents tab → Upload Document
4. Select a PDF file
5. Choose type: "EPC"
6. Click Upload

**Expected:**  
- File uploaded successfully
- Appears in documents list
- Downloadable via link

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

#### C2: Check Supabase Storage
**Steps:**
1. Open Backend
2. Storage → `property-documents`
3. Browse folder structure

**Expected:** See uploaded file  
**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### D. Property Passport

#### D1: View Property Passport
**Steps:**
1. Login as any user
2. Navigate to `/search`
3. Click any property card

**Expected:**  
- Passport page loads
- Address displayed
- PPUK reference shown
- EPC rating visible

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

#### D2: Photo Carousel (If Implemented)
**Steps:**
1. On passport page
2. Check Photos tab
3. Test keyboard navigation (← →)
4. Click image for lightbox

**Expected:**  
- Images load
- Keyboard works
- Lightbox opens

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### E. Claim Flow

#### E1: Claim Property as Owner
**Steps:**
1. Login as `ppuk_owner@example.com`
2. Go to `/claim`
3. Fill 3-step form
4. Submit

**Expected:**  
- Property added to dashboard
- Completion score calculated

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### F. Row Level Security

#### F1: Access Control Test
**Steps:**
1. Login as buyer
2. Try to access owner's private document URL directly

**Expected:** 403 Forbidden or redirect  
**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### G. UI/UX & Accessibility

#### G1: Mobile Responsiveness
**Steps:**
1. Open dev tools
2. Toggle device toolbar (iPhone 12)
3. Navigate through all pages

**Expected:** No horizontal scroll, readable text  
**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

#### G2: Keyboard Navigation
**Steps:**
1. Use Tab to navigate Home page
2. Press Enter on "Search" button

**Expected:** Focus visible, Enter activates  
**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

## 🔍 How to Check Supabase Storage

### Via Lovable Backend:
1. Click "View Backend" in chat
2. Navigate to **Storage** tab
3. Select bucket: `property-documents` or `property-photos`
4. Browse uploaded files
5. Click file → Generate signed URL → Test download

### Via Supabase Dashboard (if using external project):
1. Go to `https://supabase.com/dashboard/project/YOUR_PROJECT`
2. Left sidebar → Storage
3. Select bucket
4. Browse files

### Programmatic Check:
```javascript
// In browser console (on any PPUK page)
const { data, error } = await supabase.storage
  .from('property-documents')
  .list();
console.log('Files:', data);
```

---

## 🐛 Troubleshooting

### Issue: "User not found"
- **Fix:** Run seed script or create user manually via `/register`

### Issue: "Storage bucket not found"
- **Fix:** Check migration ran successfully, buckets should auto-create

### Issue: "RLS policy blocks access"
- **Fix:** Verify user is logged in and is property owner

### Issue: "Dev bypass not visible"
- **Fix:** Ensure `NODE_ENV=development` or check `/test-login` page

---

## 📊 Test Report Template

After testing, copy results to `docs/test-report.md`:

```markdown
# Test Run: [DATE]

## Summary
- **Total Tests:** 15
- **Passed:** X
- **Failed:** Y
- **Skipped:** Z

## Failures
1. [Test ID] - [Description] - [Error message]

## Notes
- [Any observations]

## Next Steps
- [Action items]
```

---

## 🚀 Quick Test Script

Run all automated checks:
```bash
# Coming soon: scripts/run-tests.sh
```

---

**Last Updated:** 2025-01-10  
**Environment:** Development  
**Tester:** [Your Name]