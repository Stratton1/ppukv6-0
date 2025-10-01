// scripts/seed-supabase-users.js
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-supabase-users.js
// 
// This script creates test users for PPUK development using Supabase Admin API.
// It is idempotent - safe to run multiple times without creating duplicates.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nExample:');
  console.error('  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... node scripts/seed-supabase-users.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUser(email, password, role, full_name = '') {
  console.log(`\n📝 Processing ${email}...`);
  
  // Check if user already exists
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return { error: listError };
  }

  const existingUser = existingUsers.users.find(u => u.email === email);
  
  if (existingUser) {
    console.log(`✓ User already exists (id: ${existingUser.id})`);
    
    // Ensure profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', existingUser.id)
      .single();
    
    if (!profile) {
      console.log('  Creating missing profile...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: existingUser.id,
          full_name: full_name || email.split('@')[0],
          role: role
        });
      
      if (insertError) {
        console.error('  ❌ Error creating profile:', insertError.message);
      } else {
        console.log('  ✓ Profile created');
      }
    } else {
      console.log('  ✓ Profile exists');
    }
    
    return { data: existingUser, existing: true };
  }

  // Create new user
  console.log('  Creating new user...');
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for dev
    user_metadata: { 
      role, 
      full_name: full_name || email.split('@')[0]
    }
  });

  if (error) {
    console.error('❌ Error creating user:', error.message);
    return { error };
  }

  console.log(`✓ User created (id: ${data.user.id})`);

  // Create profile
  if (data && data.user) {
    const userId = data.user.id;
    const profile = {
      id: userId,
      full_name: full_name || email.split('@')[0],
      role: role
    };
    
    console.log('  Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profile);
    
    if (profileError) {
      console.error('  ❌ Error creating profile:', profileError.message);
    } else {
      console.log('  ✓ Profile created');
    }
  }

  return { data };
}

async function verifyUsers() {
  console.log('\n🔍 Verifying created users...\n');
  
  const emails = ['owner@ppuk.test', 'buyer@ppuk.test'];
  
  for (const email of emails) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);
    
    if (user) {
      console.log(`✓ ${email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`  Role: ${user.user_metadata?.role || 'N/A'}`);
      
      // Check profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log(`  Profile: ${profile ? 'Exists' : 'Missing'}`);
    } else {
      console.log(`❌ ${email} - Not found`);
    }
  }
}

async function main() {
  console.log('🚀 PPUK Test User Seeding Script');
  console.log('================================\n');
  console.log(`Target: ${SUPABASE_URL}`);
  
  const users = [
    { 
      email: 'owner@ppuk.test', 
      password: 'password123', 
      role: 'owner', 
      full_name: 'Test Owner' 
    },
    { 
      email: 'buyer@ppuk.test', 
      password: 'password123', 
      role: 'buyer', 
      full_name: 'Test Buyer' 
    },
  ];

  console.log(`\nCreating ${users.length} test users...\n`);

  for (const u of users) {
    await createUser(u.email, u.password, u.role, u.full_name);
  }

  await verifyUsers();

  console.log('\n✅ Seeding complete!\n');
  console.log('Test credentials:');
  console.log('  Owner: owner@ppuk.test / password123');
  console.log('  Buyer: buyer@ppuk.test / password123\n');
  console.log('Next steps:');
  console.log('  1. Visit /login in your app');
  console.log('  2. Use the dev bypass or enter credentials manually');
  console.log('  3. Check /dashboard to verify login\n');
  
  process.exit(0);
}

main().catch(e => {
  console.error('\n💥 Fatal error:', e.message || e);
  process.exit(1);
});
