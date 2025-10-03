# PPUK Testing Guide

## Test User Accounts

To test the PPUK platform, you'll need to create test user accounts first. Here's how:

### Creating Test Users

1. **Create Test Owner Account:**
   - Go to `/register`
   - Email: `owner@ppuk.test`
   - Password: `password123`
   - Full Name: `Test Owner`
   - Role: `Property Owner`

2. **Create Test Buyer Account:**
   - Go to `/register`
   - Email: `buyer@ppuk.test`
   - Password: `password123`
   - Full Name: `Test Buyer`
   - Role: `Buyer`

### Quick Test Login

Once you've created these accounts, you can use the **Test Login** page (`/test-login`) for quick access:

- Click the 🧪 Test Login button in the navbar
- Select which test user to login as
- Credentials are pre-filled for easy testing

## Testing Workflows

### Owner Workflow:

1. Login as Test Owner
2. Go to Dashboard
3. Claim a property via the "Claim Property" button
4. Upload documents (EPC, floorplan, etc.)
5. Upload property photos
6. View passport completeness score
7. Check API preview data (simulated)

### Buyer Workflow:

1. Login as Test Buyer
2. Search for properties
3. View property passports
4. Save properties (future feature)

## Features to Test

### ✅ Implemented:

- [x] User registration (Owner/Buyer roles)
- [x] Property claiming with guided form
- [x] Document upload system (PDF, DOCX, PNG, JPG)
- [x] Photo gallery with captions
- [x] API data preview (EPC, Flood, HMLR, Planning - simulated)
- [x] Passport completeness scoring
- [x] Property search
- [x] Responsive design (mobile/desktop)

### 🚧 Coming Next:

- [ ] AI document analysis
- [ ] Real API integrations (via Cursor)
- [ ] Property walkthrough wizard
- [ ] Enhanced property history
- [ ] Buyer saved properties
- [ ] Cross-party messaging

## File Upload Limits

- Documents: Max 10MB (PDF, DOCX, PNG, JPG)
- Photos: Max 5MB (Images only)

## Storage Buckets

- `property-documents` - Private documents (EPC, deeds, etc.)
- `property-photos` - Public property photos

## Notes for Developers

The platform uses:

- **Lovable Cloud** (Supabase) for backend
- **Row Level Security** for data protection
- **Mock API data** for EPC, Flood Risk, HMLR, Planning (replace with real APIs in Cursor)
- **Auto-generated PPUK references** for all properties

Email confirmation is disabled for testing (auto-confirm enabled).
