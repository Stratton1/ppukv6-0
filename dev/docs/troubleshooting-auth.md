# Authentication Troubleshooting Guide

## Overview

This document provides comprehensive troubleshooting steps for the PPUK authentication system.

## Test Credentials

### Test Owner Account

- **Email:** owner@ppuk.test
- **Password:** password123
- **Role:** owner
- **User ID:** 60159326-e6d0-44a0-9ad8-a5fc64aca9a7

### Test Buyer Account

- **Email:** buyer@ppuk.test
- **Password:** password123
- **Role:** buyer
- **User ID:** f30927f0-3945-4be4-b730-503ddfe4ed9e

## Diagnostic Checklist

### 1. Check Supabase Auth Users

```sql
SELECT id, email, raw_user_meta_data, email_confirmed_at
FROM auth.users
WHERE email LIKE '%ppuk%' OR email LIKE '%@ppuk.test';
```

**Expected Result:** Both test users should exist with `email_confirmed_at` set.

### 2. Check Profiles Table

```sql
SELECT id, role, full_name, phone
FROM profiles
WHERE id IN ('60159326-e6d0-44a0-9ad8-a5fc64aca9a7', 'f30927f0-3945-4be4-b730-503ddfe4ed9e');
```

**Expected Result:** Both profiles should exist with correct roles (owner/buyer).

### 3. Verify Environment Variables

Check that frontend env variables point to the correct Supabase project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### 4. Check RLS Policies

```sql
SELECT pol.polname, pol.polcmd, pol.polqual, pol.polwithcheck
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
WHERE c.relname = 'profiles';
```

**Expected Result:** Policies should allow users to read their own profile (`auth.uid() = id`).

## Common Issues & Fixes

### Issue: "Invalid login credentials"

**Possible Causes:**

1. User not created in auth.users
2. Email not confirmed
3. Password mismatch
4. Environment variable mismatch

**Fix:**

1. Run the create-test-users edge function:

   ```bash
   # Visit /test-login page - it auto-creates users
   ```

2. Or manually create via Supabase Admin API (see seed script)

### Issue: Profile not found after login

**Possible Causes:**

1. Profile not created in profiles table
2. RLS policy blocking read access

**Fix:**

1. Check if profile exists for the user_id
2. Verify RLS policy allows `SELECT` for authenticated users:
   ```sql
   CREATE POLICY "Users can view their own profile"
   ON profiles FOR SELECT
   USING (auth.uid() = id);
   ```

### Issue: Login succeeds but redirect fails

**Possible Causes:**

1. Navigation guard blocking access
2. Session not persisting

**Fix:**

1. Check browser console for errors
2. Verify supabase client configuration has `persistSession: true`

## Dev Bypass Mode

For rapid testing, the Login page includes a dev bypass component that auto-fills credentials.

**Location:** `/login` page, yellow card at top

**Usage:**

1. Click "Login as Owner" or "Login as Buyer"
2. Automatically signs in with correct credentials
3. Redirects to dashboard

**Security:** This component should be disabled in production builds.

## Testing Login Flow

### Manual Test Steps

1. **Navigate to Login Page**
   - Open `/login` or click "Login" in navbar

2. **Test Dev Bypass**
   - Click "Login as Owner"
   - Expected: Redirect to `/dashboard`, see owner properties
   - Logout

3. **Test Manual Login**
   - Enter: owner@ppuk.test
   - Enter: password123
   - Click "Login"
   - Expected: Success toast, redirect to dashboard

4. **Test Invalid Credentials**
   - Enter: owner@ppuk.test
   - Enter: wrongpassword
   - Expected: Error toast with "Invalid login credentials"

5. **Verify Profile Load**
   - After login, check browser console
   - Should see: "Login successful: owner@ppuk.test"
   - Dashboard should show user's name and role

### Automated Tests

See `scripts/seed-dev-data.sql` for SQL-based verification.

## Edge Functions

### create-test-users

**Purpose:** Creates test accounts in auth.users and profiles table

**Invocation:**

```typescript
const { data } = await supabase.functions.invoke("create-test-users");
```

**Response:**

```json
{
  "success": true,
  "results": [
    {
      "email": "owner@ppuk.test",
      "status": "created",
      "userId": "..."
    }
  ]
}
```

### seed-dev-data

**Purpose:** Seeds properties and documents for testing

**Note:** Currently fails on fetch. Investigate CORS or function timeout issues.

## Security Considerations

### Production Checklist

- [ ] Disable dev bypass component
- [ ] Remove or secure test accounts
- [ ] Ensure RLS policies are production-ready
- [ ] Rotate service_role key if exposed
- [ ] Enable email confirmation for new signups
- [ ] Set up proper password policies

### RLS Best Practices

- Always use `auth.uid()` to check user identity
- Test policies with different user roles
- Never expose service_role key in frontend
- Use separate policies for SELECT, INSERT, UPDATE, DELETE

## Debugging Tips

### Enable Console Logging

The Login component now includes console.log statements:

- Supabase auth response
- Error details
- Successful login confirmation

### Check Supabase Auth Logs

1. Open Lovable Cloud backend
2. Navigate to Authentication section
3. Check "Logs" tab for failed login attempts

### Network Tab Inspection

1. Open browser DevTools > Network
2. Filter: "token" or "auth"
3. Check request/response for `/auth/v1/token` calls
4. Look for 400 errors with detailed messages

## Contact & Support

For issues not covered in this guide:

1. Check `/docs/test-instructions.md` for comprehensive test scenarios
2. Review `/docs/how-to-check-supabase-storage.md` for storage issues
3. Check Lovable Discord community
4. Review Supabase documentation at docs.supabase.com
