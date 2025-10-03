/**
 * Test script for Property Passport UK Edge Functions
 * Tests all API endpoints with mock data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data
const testProperty = {
  propertyId: 'test-property-123',
  postcode: 'SW1A 1AA',
  address: '10 Downing Street, London',
  uprn: '100023336956'
};

const testHMLRProperty = {
  ...testProperty,
  titleNumber: 'TT123456'
};

const testFloodProperty = {
  ...testProperty,
  easting: 530000,
  northing: 180000
};

// Test results
const results = {
  epc: { success: false, error: null, response: null },
  hmlr: { success: false, error: null, response: null },
  flood: { success: false, error: null, response: null }
};

/**
 * Test EPC API
 */
async function testEPCAPI() {
  console.log('🧪 Testing EPC API...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api-epc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testProperty)
    });

    const data = await response.json();
    
    if (response.ok) {
      results.epc.success = true;
      results.epc.response = data;
      console.log('✅ EPC API test passed');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      results.epc.error = data.error || `HTTP ${response.status}`;
      console.log('❌ EPC API test failed:', results.epc.error);
    }
  } catch (error) {
    results.epc.error = error.message;
    console.log('❌ EPC API test failed:', error.message);
  }
}

/**
 * Test HMLR API
 */
async function testHMLRAPI() {
  console.log('🧪 Testing HMLR API...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api-hmlr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testHMLRProperty)
    });

    const data = await response.json();
    
    if (response.ok) {
      results.hmlr.success = true;
      results.hmlr.response = data;
      console.log('✅ HMLR API test passed');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      results.hmlr.error = data.error || `HTTP ${response.status}`;
      console.log('❌ HMLR API test failed:', results.hmlr.error);
    }
  } catch (error) {
    results.hmlr.error = error.message;
    console.log('❌ HMLR API test failed:', error.message);
  }
}

/**
 * Test Flood Risk API
 */
async function testFloodAPI() {
  console.log('🧪 Testing Flood Risk API...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api-flood`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testFloodProperty)
    });

    const data = await response.json();
    
    if (response.ok) {
      results.flood.success = true;
      results.flood.response = data;
      console.log('✅ Flood Risk API test passed');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      results.flood.error = data.error || `HTTP ${response.status}`;
      console.log('❌ Flood Risk API test failed:', results.flood.error);
    }
  } catch (error) {
    results.flood.error = error.message;
    console.log('❌ Flood Risk API test failed:', error.message);
  }
}

/**
 * Test validation errors
 */
async function testValidationErrors() {
  console.log('🧪 Testing validation errors...');
  
  const invalidRequests = [
    { name: 'Missing postcode', data: { propertyId: 'test' } },
    { name: 'Invalid postcode', data: { propertyId: 'test', postcode: 'INVALID' } },
    { name: 'Missing propertyId', data: { postcode: 'SW1A 1AA' } }
  ];

  for (const test of invalidRequests) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/api-epc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(test.data)
      });

      const data = await response.json();
      
      if (response.status === 400) {
        console.log(`✅ Validation test passed for: ${test.name}`);
      } else {
        console.log(`❌ Validation test failed for: ${test.name} (expected 400, got ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ Validation test failed for: ${test.name} - ${error.message}`);
    }
  }
}

/**
 * Test CORS preflight
 */
async function testCORS() {
  console.log('🧪 Testing CORS preflight...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api-epc`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    if (response.ok) {
      console.log('✅ CORS preflight test passed');
    } else {
      console.log('❌ CORS preflight test failed:', response.status);
    }
  } catch (error) {
    console.log('❌ CORS preflight test failed:', error.message);
  }
}

/**
 * Generate test report
 */
function generateReport() {
  console.log('\n📊 Test Report');
  console.log('==============');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  console.log('\nDetailed Results:');
  Object.entries(results).forEach(([api, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${api.toUpperCase()}: ${result.success ? 'PASS' : 'FAIL'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  if (failedTests > 0) {
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Edge Functions are deployed: ./scripts/deploy-edge-functions.sh');
    console.log('   2. Check function logs: supabase functions logs api-epc');
    console.log('   3. Verify environment variables are set');
    console.log('   4. Check Supabase project status: supabase status');
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Edge Functions tests...');
  console.log(`📍 Testing against: ${SUPABASE_URL}`);
  console.log('');
  
  // Run all tests
  await testCORS();
  await testEPCAPI();
  await testHMLRAPI();
  await testFloodAPI();
  await testValidationErrors();
  
  // Generate report
  generateReport();
  
  // Exit with appropriate code
  const hasFailures = Object.values(results).some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
