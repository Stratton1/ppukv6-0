#!/usr/bin/env node

// scripts/verify-storage-and-media.js
// Verifies Supabase storage buckets, media, and documents data

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 PPUK Storage & Media Verification');
console.log('===================================\n');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const results = {
  buckets: {
    'property-photos': { exists: false, public: false },
    'property-documents': { exists: false, public: false }
  },
  mediaCount: 0,
  documentsCount: 0,
  overallStatus: 'FAIL'
};

async function verifyStorageBuckets() {
  console.log('📦 Verifying Storage Buckets...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;

    for (const bucket of buckets) {
      if (results.buckets[bucket.name]) {
        results.buckets[bucket.name].exists = true;
        results.buckets[bucket.name].public = bucket.public;
        console.log(`  ✅ Bucket '${bucket.name}' exists (Public: ${bucket.public})`);
      }
    }

    // Check for missing buckets
    Object.entries(results.buckets).forEach(([name, status]) => {
      if (!status.exists) {
        console.log(`  ❌ Bucket '${name}' not found`);
      }
    });

  } catch (error) {
    console.error('  ❌ Error listing buckets:', error.message);
  }
}

async function verifyMediaData() {
  console.log('\n📊 Verifying Media Data...');
  try {
    const { count, error } = await supabase
      .from('media')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.log('  ⚠️  Media table not found or no access:', error.message);
      results.mediaCount = 0;
    } else {
      results.mediaCount = count;
      console.log(`  ✅ Media records: ${count}`);
    }

    // Show recent media
    const { data: recentMedia, error: mediaError } = await supabase
      .from('media')
      .select('id, property_id, type, url, caption, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!mediaError && recentMedia && recentMedia.length > 0) {
      console.log('  📋 Recent media:');
      recentMedia.forEach((item, index) => {
        console.log(`    ${index + 1}. ${item.type} - ${item.caption || 'No caption'} (${new Date(item.created_at).toLocaleDateString()})`);
      });
    }

  } catch (error) {
    console.error('  ❌ Error checking media:', error.message);
  }
}

async function verifyDocumentsData() {
  console.log('\n📄 Verifying Documents Data...');
  try {
    const { count, error } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true });
    
    if (error) throw error;
    
    results.documentsCount = count;
    console.log(`  ✅ Documents: ${count}`);

    // Show recent documents
    const { data: recentDocs, error: docsError } = await supabase
      .from('documents')
      .select('id, property_id, file_name, mime_type, file_size_bytes, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!docsError && recentDocs && recentDocs.length > 0) {
      console.log('  📋 Recent documents:');
      recentDocs.forEach((doc, index) => {
        const size = doc.file_size_bytes ? `${(doc.file_size_bytes / 1024).toFixed(1)} KB` : 'Unknown size';
        console.log(`    ${index + 1}. ${doc.file_name} (${size}) - ${new Date(doc.created_at).toLocaleDateString()}`);
      });
    }

  } catch (error) {
    console.error('  ❌ Error checking documents:', error.message);
  }
}

async function testSignedUrl() {
  console.log('\n🔗 Testing Signed URL Generation...');
  try {
    // Get a document to test with
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('file_url')
      .limit(1);

    if (docsError || !docs || docs.length === 0) {
      console.log('  ⚠️  No documents found to test signed URL generation');
      return;
    }

    const doc = docs[0];
    // Extract path from URL
    const url = new URL(doc.file_url);
    const path = url.pathname.split('/').slice(3).join('/'); // Remove /storage/v1/object/public/property-documents/
    
    const { data, error } = await supabase.storage
      .from('property-documents')
      .createSignedUrl(path, 3600);
    
    if (error) {
      console.log('  ❌ Signed URL generation failed:', error.message);
    } else {
      console.log('  ✅ Signed URL generation successful');
      console.log(`  🔗 Test URL: ${data.signedUrl.substring(0, 50)}...`);
    }

  } catch (error) {
    console.error('  ❌ Error testing signed URL:', error.message);
  }
}

function generateReport() {
  console.log('\n📊 Verification Report');
  console.log('======================');
  
  const allBucketsExist = Object.values(results.buckets).every(b => b.exists);
  const hasData = results.mediaCount > 0 || results.documentsCount > 0;
  
  console.log(`Storage Buckets: ${allBucketsExist ? '✅' : '❌'}`);
  console.log(`  property-photos: ${results.buckets['property-photos'].exists ? '✅' : '❌'} (${results.buckets['property-photos'].public ? 'Public' : 'Private'})`);
  console.log(`  property-documents: ${results.buckets['property-documents'].exists ? '✅' : '❌'} (${results.buckets['property-documents'].public ? 'Public' : 'Private'})`);
  
  console.log(`\nData Records:`);
  console.log(`  Media (photos): ${results.mediaCount}`);
  console.log(`  Documents: ${results.documentsCount}`);
  
  if (allBucketsExist && hasData) {
    results.overallStatus = 'PASS';
    console.log('\n🎉 Overall Status: ✅ PASS');
    console.log('   All storage buckets exist and data is present.');
  } else if (allBucketsExist && !hasData) {
    results.overallStatus = 'PARTIAL';
    console.log('\n⚠️  Overall Status: ⚠️  PARTIAL PASS');
    console.log('   Storage buckets exist but no data found.');
    console.log('   Try uploading test files via the debug page.');
  } else {
    results.overallStatus = 'FAIL';
    console.log('\n❌ Overall Status: ❌ FAIL');
    console.log('   Storage buckets missing or other issues detected.');
  }
  
  console.log('\n🔧 Next Steps:');
  if (results.overallStatus === 'FAIL') {
    console.log('   1. Run the bucket migration SQL in Supabase SQL Editor');
    console.log('   2. Check your environment variables');
    console.log('   3. Verify Supabase project is accessible');
  } else if (results.overallStatus === 'PARTIAL') {
    console.log('   1. Navigate to /debug/storage in your app');
    console.log('   2. Upload test photos and documents');
    console.log('   3. Re-run this verification script');
  } else {
    console.log('   1. Everything looks good! 🎉');
    console.log('   2. You can now test the full upload workflow');
  }
}

async function main() {
  await verifyStorageBuckets();
  await verifyMediaData();
  await verifyDocumentsData();
  await testSignedUrl();
  generateReport();
  
  // Exit with appropriate code
  process.exit(results.overallStatus === 'PASS' ? 0 : 1);
}

main().catch(error => {
  console.error('\n💥 Fatal error during verification:', error.message);
  process.exit(1);
});