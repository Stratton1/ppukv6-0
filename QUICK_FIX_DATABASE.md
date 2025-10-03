# 🚨 URGENT: Database Setup Required

## The Problem

Your Supabase database is completely empty - no tables, no schema. This is why the test-login is failing.

## 🔧 IMMEDIATE SOLUTION (5 minutes)

### Step 1: Open Supabase Dashboard

1. Go to [supabase.com](https://supabase.com) and sign in
2. Open your PPUK project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Copy the Database Setup SQL

Copy the entire SQL block from `docs/DATABASE_SETUP.md` (lines 17-219) and paste it into the Supabase SQL Editor.

### Step 3: Run the SQL

Click the **"Run"** button in Supabase SQL Editor.

### Step 4: Verify It Worked

1. Go to `http://localhost:8080/test-login`
2. Click **"🗄️ Check Migrations"** - should show all tables exist
3. Click **"🚀 One-Click Dev Setup"** - should now work!

## 🎯 What This Creates

- ✅ **5 core tables**: profiles, properties, documents, media, saved_properties
- ✅ **4 enums**: user_role, property_type, tenure_type, document_type
- ✅ **Row Level Security**: All tables protected with proper policies
- ✅ **Storage buckets**: property-photos (public), property-documents (private)
- ✅ **Auto-functions**: PPUK reference generation, user profile creation

## 🚨 If You Get Errors

**"Type already exists"** → Ignore, continue running
**"Table already exists"** → Ignore, continue running  
**"Policy already exists"** → Ignore, continue running

The SQL uses `IF NOT EXISTS` and `ON CONFLICT DO NOTHING` to be safe.

## ✅ Success Indicators

After running the SQL, you should see:

- All tables created in Supabase dashboard
- Storage buckets visible in Storage section
- Test-login working with property creation
- Debug functions showing "✅" for all checks

## 📞 Need Help?

If you're still stuck:

1. Check the Supabase SQL Editor for any error messages
2. Make sure you're in the right Supabase project
3. Verify your environment variables are correct in `.env`

**This is a one-time setup - once done, everything will work perfectly!**
