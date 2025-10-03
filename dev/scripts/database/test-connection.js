#!/usr/bin/env node

// scripts/test-connection.js
// Test Supabase connection and basic functionality
// Usage: node scripts/test-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 PPUK Connection Test');
console.log('======================\n');

// Check environment variables
console.log('📋 Environment Check:');
console.log(`  SUPABASE_URL: ${SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`  SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`  SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}\n`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Please check your .env file\n');
  process.exit(1);
}

// Test client connection
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('🔌 Testing Supabase Connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase
      .from('properties')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Basic connection successful\n');
    
    // Test 2: Check table structure
    console.log('📊 Checking Database Schema...');
    
    const tables = ['profiles', 'properties', 'documents', 'property_photos', 'saved_properties'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: Accessible`);
      }
    }
    
    console.log('');
    
    // Test 3: Check RLS policies
    console.log('🔒 Testing Row Level Security...');
    
    // Try to access properties without auth (should work for public properties)
    const { data: publicProps, error: publicError } = await supabase
      .from('properties')
      .select('id, ppuk_reference, address_line_1')
      .eq('is_public', true)
      .limit(3);
    
    if (publicError) {
      console.log(`  ❌ Public properties access: ${publicError.message}`);
    } else {
      console.log(`  ✅ Public properties accessible (${publicProps?.length || 0} found)`);
    }
    
    // Test 4: Check for test data
    console.log('\n🌱 Checking Test Data...');
    
    const { data: testProps, error: testError } = await supabase
      .from('properties')
      .select('ppuk_reference, address_line_1, city, completion_percentage')
      .like('ppuk_reference', 'PPUK-DEV%')
      .limit(5);
    
    if (testError) {
      console.log(`  ❌ Test data check: ${testError.message}`);
    } else {
      console.log(`  ✅ Test properties found: ${testProps?.length || 0}`);
      if (testProps && testProps.length > 0) {
        console.log('  Sample properties:');
        testProps.forEach(prop => {
          console.log(`    - ${prop.ppuk_reference}: ${prop.address_line_1}, ${prop.city} (${prop.completion_percentage}%)`);
        });
      }
    }
    
    // Test 5: Check storage buckets
    console.log('\n📁 Checking Storage Buckets...');
    
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log(`  ❌ Storage access: ${bucketError.message}`);
    } else {
      console.log(`  ✅ Storage accessible (${buckets?.length || 0} buckets)`);
      if (buckets) {
        buckets.forEach(bucket => {
          console.log(`    - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
        });
      }
    }
    
    console.log('\n✅ Connection test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    return false;
  }
}

async function testServiceRole() {
  if (!SERVICE_ROLE_KEY) {
    console.log('\n⚠️  Service role key not provided - skipping admin tests');
    return;
  }
  
  console.log('\n🔑 Testing Service Role Access...');
  
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Test admin user listing
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.log(`  ❌ User listing: ${userError.message}`);
    } else {
      console.log(`  ✅ Admin access working (${users?.users?.length || 0} users)`);
      
      // Check for test users
      const testUsers = users?.users?.filter(u => 
        u.email?.includes('@ppuk.test') || u.email?.includes('@example.com')
      ) || [];
      
      if (testUsers.length > 0) {
        console.log('  Test users found:');
        testUsers.forEach(user => {
          console.log(`    - ${user.email} (${user.user_metadata?.role || 'no role'})`);
        });
      }
    }
    
  } catch (error) {
    console.log(`  ❌ Service role test: ${error.message}`);
  }
}

async function main() {
  const success = await testConnection();
  await testServiceRole();
  
  console.log('\n📋 Summary:');
  if (success) {
    console.log('✅ Database connection and basic functionality working');
    console.log('✅ Ready for development and testing');
    console.log('\nNext steps:');
    console.log('  1. Run seeding scripts to populate test data');
    console.log('  2. Test authentication flow');
    console.log('  3. Verify file upload/download functionality');
  } else {
    console.log('❌ Issues detected - check configuration');
    console.log('\nTroubleshooting:');
    console.log('  1. Verify .env file has correct Supabase credentials');
    console.log('  2. Check Supabase project is active');
    console.log('  3. Ensure database migrations have been applied');
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error.message);
  process.exit(1);
});
