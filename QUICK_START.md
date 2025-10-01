# PPUK Quick Start Guide

## 🚀 Get Testing in 30 Seconds

### Option 1: Auto-Create Test Users (Recommended)
1. Navigate to `/test-login` in your app
2. Wait for "Test users ready!" message
3. Click "Login as Test Owner" or "Login as Test Buyer"
4. Start testing!

### Option 2: Manual Registration
If auto-creation doesn't work:

1. Go to `/register`
2. Create **Test Owner**:
   - Email: `owner@ppuk.test`
   - Password: `password123`
   - Full Name: `Test Owner`
   - Role: `Property Owner`

3. Create **Test Buyer**:
   - Email: `buyer@ppuk.test`
   - Password: `password123`
   - Full Name: `Test Buyer`
   - Role: `Buyer`

4. Go back to `/test-login` and login

## What Can Test Users Do?

### Test Owner (`owner@ppuk.test`)
✅ Claim properties via `/claim`
✅ Upload documents (EPC, floorplans, etc.)
✅ Upload property photos
✅ View passport completeness score
✅ Update property details

### Test Buyer (`buyer@ppuk.test`)
✅ Search properties via `/search`
✅ View property passports
✅ See uploaded documents
✅ Browse photo galleries
✅ View mock API data (EPC, Flood, etc.)

## Quick Testing Flow

1. **Login as Owner** → Dashboard → Claim Property
2. Fill in property details (3-step form)
3. Upload an EPC document
4. Upload 3+ property photos
5. Check completeness score (should show 70%+)
6. View property passport → See all tabs

## Features Ready to Test

- [x] Full auth system (login/register/logout)
- [x] Property claiming workflow
- [x] Document upload (10MB limit)
- [x] Photo gallery (5MB limit)
- [x] Completeness scoring
- [x] Mock API previews (4 data sources)
- [x] Search functionality
- [x] Mobile responsive design

## Troubleshooting

**"Invalid login credentials"**
- Refresh `/test-login` page to trigger auto-creation
- Or manually create accounts via `/register`

**Test users not created?**
- Edge function may need a moment to deploy
- Wait 30 seconds and refresh the page
- Fallback: Use manual registration

**Can't upload files?**
- Check file size (10MB docs, 5MB photos)
- Supported formats: PDF, DOCX, PNG, JPG, JPEG

## Backend Access

View your Lovable Cloud backend using the button in the AI chat or by checking the Backend tab in Lovable.

## Next Steps After Testing

Once basic testing is complete, you're ready for:
1. Real API integration (EPC, Flood Risk, HMLR, Planning)
2. AI document analysis
3. Enhanced property walkthroughs
4. Buyer saved properties
5. Cross-party messaging

---

**Built with:** React + TypeScript + Lovable Cloud + Supabase Storage
**Security:** Row Level Security (RLS) on all data
**Auto-Deploy:** Edge functions deploy automatically