# PPUK Comprehensive Roadmap & Task Plan

**Last Updated:** 2025-01-10  
**Current Status:** Phase 3 Complete - Storage & Media System Ready  
**Next Phase:** Database Migration & Testing

---

## 🎯 **CURRENT SITUATION ANALYSIS**

### ✅ **What's Working (Phase 1-3 Complete)**
- **Authentication System:** Test users, roles, profiles ✅
- **Property Management:** Claiming, basic CRUD ✅  
- **Storage Infrastructure:** Buckets created, RLS policies ✅
- **UI Components:** PhotoGallery, DocumentUploader, PropertyPassport ✅
- **Debug Tools:** /debug/storage page with error handling ✅
- **API Framework:** Edge Functions, mock data, validation ✅

### ⚠️ **Critical Blockers (Must Fix First)**
1. **Database Migrations Not Run:** New tables/buckets exist in code but not in Supabase
2. **Media Table Schema Mismatch:** Components expect `media` table but `property_photos` exists
3. **No Test Data:** Properties exist but no photos/documents to test with
4. **Type Column Missing:** `media.type` column needs to be added

### 🔄 **Schema Evolution Required**
- **Current:** `property_photos` table (old schema)
- **Target:** `media` table with `type` column (new unified schema)
- **Migration Path:** Create `media` table → Add `type` column → Migrate data → Update components

---

## 📋 **PHASE 4: DATABASE MIGRATION & TESTING**

### **Priority 1: Database Setup (CRITICAL - 30 mins)**

#### **Step 1.1: Run Core Migrations**
```sql
-- Run these in Supabase SQL Editor in order:

-- 1. Create storage buckets
-- File: supabase/migrations/20251003_create_ppuk_buckets.sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('property-documents', 'property-documents', false, 10485760, '{"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"}'),
  ('property-photos', 'property-photos', true, 5242880, '{"image/png", "image/jpeg"}');

-- 2. Create media table
-- File: supabase/migrations/20251003_create_media_table.sql
CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'audio', 'document')),
  url TEXT NOT NULL,
  caption TEXT,
  room_type TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Add type column (if not exists)
-- File: supabase/migrations/20251003_alter_media_add_type.sql
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'photo';
```

#### **Step 1.2: Verify Database State**
```bash
# Run verification script
npm run verify:storage
```

**Expected Output:**
- ✅ Buckets: property-photos (public), property-documents (private)
- ✅ Media table exists with type column
- ✅ RLS policies active
- ⚠️ 0 photos, 0 documents (expected - no data yet)

### **Priority 2: Test Data Seeding (15 mins)**

#### **Step 2.1: Seed Media Data**
```bash
# Option A: Use test login page (auto-seeds)
# Navigate to: http://localhost:8080/test-login
# Wait for "Dev environment ready" toast

# Option B: Manual seeding
# In browser console after login:
const { data, error } = await supabase.functions.invoke('seed-property-media');
console.log('Seeded:', data);
```

#### **Step 2.2: Verify Seeding Success**
```sql
-- Check media table
SELECT COUNT(*) as media_count FROM media;
SELECT COUNT(*) as documents_count FROM documents;

-- Should show: 6-10 media items, 4 documents
```

### **Priority 3: Component Testing (20 mins)**

#### **Step 3.1: Test Debug Page**
1. Navigate to: `http://localhost:8080/debug/storage`
2. Verify console output:
   ```
   Type column present: true, null
   Bucket checks: [{id: "property-photos", status: "exists"}, {id: "property-documents", status: "exists"}]
   Media loaded: 6 items
   Documents loaded: 4 items
   ```

#### **Step 3.2: Test Property Passport**
1. Login as `owner@ppuk.test` / `password123`
2. Navigate to any property passport
3. Test **Photos tab:**
   - ✅ Gallery displays seeded photos
   - ✅ Upload new photo works
   - ✅ Lightbox opens on click
4. Test **Documents tab:**
   - ✅ Document list displays
   - ✅ Download with signed URL works
   - ✅ Upload new document works

#### **Step 3.3: Test Buyer Access**
1. Login as `buyer@ppuk.test` / `password123`
2. Navigate to same property passport
3. Verify **read-only access:**
   - ✅ Can view photos
   - ✅ Can download documents
   - ❌ No upload controls visible

---

## 🚀 **PHASE 5: REAL API INTEGRATION**

### **Priority 4: API Implementation (2-3 hours)**

#### **Step 4.1: EPC API Integration**
- **File:** `supabase/functions/api-epc/index.ts` ✅ (Already implemented)
- **Status:** Mock data working, needs real API keys
- **Action:** Add EPC Register API credentials

#### **Step 4.2: Flood Risk API**
- **File:** `supabase/functions/api-flood/index.ts` ✅ (Already implemented)  
- **Status:** Mock data working, needs Environment Agency API
- **Action:** Add EA API credentials

#### **Step 4.3: HMLR API**
- **File:** `supabase/functions/api-hmlr/index.ts` ✅ (Already implemented)
- **Status:** Mock data working, needs HM Land Registry API
- **Action:** Add HMLR API credentials

#### **Step 4.4: Deploy Edge Functions**
```bash
npm run deploy:functions
```

### **Priority 5: AI Document Analysis (1-2 hours)**

#### **Step 5.1: Document OCR Integration**
- **Goal:** Auto-extract data from uploaded EPCs, surveys, etc.
- **Implementation:** Add Lovable AI integration to DocumentUploader
- **Output:** Populate `ai_summary` field in documents table

#### **Step 5.2: Property Data Auto-Population**
- **Goal:** Extract property details from documents
- **Fields:** EPC rating, floor area, property type, etc.
- **Implementation:** Update PropertyPassport with AI-extracted data

---

## 🎨 **PHASE 6: ENHANCED FEATURES**

### **Priority 6: User Experience (1-2 hours)**

#### **Step 6.1: Property Walkthrough Wizard**
- **Goal:** Guided onboarding for property owners
- **Features:** Step-by-step photo capture, document upload, data entry
- **File:** `src/pages/Walkthrough.tsx` (new)

#### **Step 6.2: Enhanced Photo Management**
- **Features:** Drag & drop reordering, featured image selection, batch upload
- **Implementation:** Update PhotoGallery component

#### **Step 6.3: Buyer Features**
- **Features:** Saved properties, property comparison, favorites
- **Implementation:** Extend saved_properties table usage

### **Priority 7: Performance & Security (1 hour)**

#### **Step 7.1: Image Optimization**
- **Goal:** Generate thumbnails, WebP conversion, lazy loading
- **Implementation:** Add image processing to upload flow

#### **Step 7.2: Security Hardening**
- **Goal:** File validation, rate limiting, audit logging
- **Implementation:** Enhanced upload validation, security headers

---

## 📊 **SUCCESS METRICS & VALIDATION**

### **Phase 4 Success Criteria:**
- [ ] All database migrations run successfully
- [ ] Debug page shows: type column ✅, buckets exist, media loaded
- [ ] Property passport displays photos and documents
- [ ] Upload/download functionality works for both user types
- [ ] RLS policies prevent unauthorized access

### **Phase 5 Success Criteria:**
- [ ] Real API data replaces mock data in Property Passport
- [ ] Edge functions deployed and responding
- [ ] API rate limiting and error handling working
- [ ] Document analysis extracts meaningful data

### **Phase 6 Success Criteria:**
- [ ] Property walkthrough improves onboarding completion rate
- [ ] Photo management features enhance user experience
- [ ] Buyer features increase engagement
- [ ] Performance metrics meet targets (LCP < 2.5s, INP < 100ms)

---

## ⚠️ **RISK ASSESSMENT & MITIGATION**

### **High Risk: Database Migration**
- **Risk:** Data loss during schema changes
- **Mitigation:** Run migrations in staging first, backup before production
- **Rollback Plan:** Keep old tables until new system verified

### **Medium Risk: API Integration**
- **Risk:** External API failures, rate limits, costs
- **Mitigation:** Implement circuit breakers, caching, fallback to mock data
- **Monitoring:** Add API health checks and alerting

### **Low Risk: UI Changes**
- **Risk:** Breaking existing functionality
- **Mitigation:** Feature flags, gradual rollout, comprehensive testing
- **Testing:** E2E tests for critical user flows

---

## 🛠️ **DEVELOPMENT WORKFLOW**

### **Recommended Order of Operations:**

1. **Database First** (30 mins)
   - Run migrations in Supabase
   - Verify schema with debug page
   - Seed test data

2. **Component Testing** (20 mins)
   - Test all upload/download flows
   - Verify RLS policies
   - Test both user roles

3. **API Integration** (2-3 hours)
   - Deploy Edge Functions
   - Add real API credentials
   - Test with real data

4. **Feature Enhancement** (2-3 hours)
   - Add AI document analysis
   - Implement walkthrough wizard
   - Enhance photo management

5. **Performance & Security** (1 hour)
   - Optimize images
   - Add security headers
   - Performance monitoring

### **Testing Strategy:**
- **Unit Tests:** Component logic, utility functions
- **Integration Tests:** Database queries, API calls
- **E2E Tests:** Complete user workflows
- **Manual Testing:** Cross-browser, mobile responsiveness

---

## 📞 **SUPPORT & TROUBLESHOOTING**

### **Common Issues & Solutions:**

**"Media table not found"**
- **Cause:** Migration not run
- **Solution:** Run `supabase/migrations/20251003_create_media_table.sql`

**"Type column missing"**
- **Cause:** Type column migration not run
- **Solution:** Run `supabase/migrations/20251003_alter_media_add_type.sql`

**"Buckets not found"**
- **Cause:** Storage bucket migration not run
- **Solution:** Run `supabase/migrations/20251003_create_ppuk_buckets.sql`

**"No test data"**
- **Cause:** Media seeding not run
- **Solution:** Navigate to `/test-login` or run seed function manually

### **Debug Commands:**
```bash
# Check database state
npm run verify:storage

# Test Edge Functions
npm run test:functions

# Run E2E tests
npm run test:e2e

# Check linting
npm run lint
```

---

## 🎯 **IMMEDIATE NEXT STEPS**

### **Right Now (Next 30 minutes):**
1. **Run Database Migrations** in Supabase SQL Editor
2. **Verify with Debug Page** - should show all green checkmarks
3. **Seed Test Data** via `/test-login` page
4. **Test Property Passport** - upload/download should work

### **This Week:**
1. **Deploy Edge Functions** with real API credentials
2. **Add AI Document Analysis** for auto-extraction
3. **Implement Property Walkthrough** for better onboarding
4. **Performance Optimization** and security hardening

### **Next Week:**
1. **User Testing** with real property owners
2. **Feature Refinement** based on feedback
3. **Production Deployment** preparation
4. **Monitoring & Analytics** setup

---

**Status:** Ready to proceed with Phase 4 (Database Migration)  
**Estimated Time to MVP:** 4-6 hours of focused development  
**Blockers:** None - all code is ready, just needs database setup
