# Scripts Directory

This directory contains utility scripts for development, testing, and database management.

## 📁 Files

### `seed-dev-data.sql`
**Purpose:** SQL script to seed development database with test data

**Usage:**
```bash
# Run via Supabase CLI
supabase db reset

# Or execute directly in Supabase SQL editor
# Copy and paste contents into Supabase Dashboard > SQL Editor
```

**What it does:**
- Creates test users (owner, buyer)
- Creates test properties with PPUK-DEV prefix
- Sets up relationships and permissions
- Idempotent (safe to run multiple times)

**Note:** This script is idempotent - it checks for existing data before inserting.

---

### `seed-supabase-users.js`
**Purpose:** Node.js script to create test users via Supabase Admin API

**Prerequisites:**
```bash
# Install dependencies
npm install @supabase/supabase-js dotenv
```

**Usage:**
```bash
# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run script
node scripts/seed-supabase-users.js
```

**What it does:**
- Creates test users in Supabase Auth
- Creates corresponding profiles in database
- Sets email confirmation to true (for testing)
- Idempotent (checks for existing users)

**Environment Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin access)

**Security Note:** Service role key has admin access. Never commit this to version control.

---

## 🧪 Test Users Created

Both scripts create the following test accounts:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `owner@ppuk.test` | `password123` | Owner | Test property ownership features |
| `buyer@ppuk.test` | `password123` | Buyer | Test buyer portal features |

---

## 🔄 Alternative: Edge Functions

For automated seeding, see Supabase Edge Functions:
- `supabase/functions/create-test-users/` - Creates test users
- `supabase/functions/seed-dev-data/` - Seeds properties and data
- `supabase/functions/seed-property-media/` - Seeds photos and documents

These can be called from the frontend or via Supabase CLI.

---

## 📝 Best Practices

1. **Idempotency**: All scripts check for existing data before creating
2. **Environment Variables**: Use `.env` files (never commit secrets)
3. **Testing**: Run scripts in development/preview environments only
4. **Cleanup**: Scripts use PPUK-DEV prefix for easy identification and cleanup

---

## 🚨 Troubleshooting

### Script fails with "User already exists"
- This is expected - scripts are idempotent
- Check Supabase Dashboard > Authentication > Users

### Script fails with "Permission denied"
- Ensure you're using Service Role Key (not anon key)
- Check RLS policies allow the operation

### Database connection errors
- Verify `SUPABASE_URL` is correct
- Check network connectivity
- Verify Supabase project is active

---

**Last Updated:** 2025-01-10

