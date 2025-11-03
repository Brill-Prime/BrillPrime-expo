
/**
 * Manual Supabase Connection Test Script
 * Run this script to verify Supabase database operations
 * 
 * Usage: npx ts-node apps/scripts/test-supabase-connection.ts
 */

import { supabase } from '../config/supabase';
import { supabaseService } from '../services/supabaseService';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  error?: any;
}

const results: TestResult[] = [];

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Test 1: Check if Supabase client is initialized
  try {
    if (supabase) {
      results.push({
        test: 'Supabase Client Initialization',
        status: 'PASS',
        message: 'Supabase client is initialized',
      });
    } else {
      throw new Error('Supabase client is null');
    }
  } catch (error: any) {
    results.push({
      test: 'Supabase Client Initialization',
      status: 'FAIL',
      message: error.message,
      error,
    });
  }

  // Test 2: Test database query (read operation)
  try {
    const { data, error } = await supabase!
      .from('users')
      .select('id, email')
      .limit(1);

    if (error) throw error;

    results.push({
      test: 'Database Read Operation',
      status: 'PASS',
      message: `Successfully queried users table. Found ${data?.length || 0} records`,
    });
  } catch (error: any) {
    results.push({
      test: 'Database Read Operation',
      status: 'FAIL',
      message: error.message || 'Failed to query database',
      error,
    });
  }

  // Test 3: Test SupabaseService CRUD wrapper
  if (supabaseService) {
    try {
      const { data, error } = await supabaseService.find('users', {});

      if (error) throw error;

      results.push({
        test: 'SupabaseService Find Operation',
        status: 'PASS',
        message: `SupabaseService working correctly. Found ${data?.length || 0} users`,
      });
    } catch (error: any) {
      results.push({
        test: 'SupabaseService Find Operation',
        status: 'FAIL',
        message: error.message || 'SupabaseService failed',
        error,
      });
    }
  } else {
    results.push({
      test: 'SupabaseService Find Operation',
      status: 'FAIL',
      message: 'SupabaseService is not initialized',
    });
  }

  // Test 4: Test Realtime connection
  try {
    const channel = supabase!.channel('test-channel');
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Realtime connection timeout'));
      }, 5000);

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {})
        .subscribe((status) => {
          clearTimeout(timeout);
          if (status === 'SUBSCRIBED') {
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            reject(new Error('Channel subscription failed'));
          }
        });
    });

    await supabase!.removeChannel(channel);

    results.push({
      test: 'Realtime Connection',
      status: 'PASS',
      message: 'Realtime subscriptions working correctly',
    });
  } catch (error: any) {
    results.push({
      test: 'Realtime Connection',
      status: 'FAIL',
      message: error.message || 'Realtime connection failed',
      error,
    });
  }

  // Test 5: Test RLS policies (Row Level Security)
  try {
    // Try to query without authentication (should work for public tables)
    const { data, error } = await supabase!
      .from('merchants')
      .select('id, name')
      .limit(5);

    if (error && error.message.includes('JWT')) {
      results.push({
        test: 'Row Level Security (RLS)',
        status: 'PASS',
        message: 'RLS is properly configured - authentication required',
      });
    } else if (!error) {
      results.push({
        test: 'Row Level Security (RLS)',
        status: 'PASS',
        message: `RLS allows public read access. Found ${data?.length || 0} merchants`,
      });
    } else {
      throw error;
    }
  } catch (error: any) {
    results.push({
      test: 'Row Level Security (RLS)',
      status: 'FAIL',
      message: error.message || 'RLS test failed',
      error,
    });
  }

  // Print results
  console.log('\n📊 Test Results:\n');
  console.log('='.repeat(80));
  
  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`\n${index + 1}. ${icon} ${result.test}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.message}`);
    if (result.error) {
      console.log(`   Error Details: ${JSON.stringify(result.error, null, 2)}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed out of ${results.length} tests`);
  
  if (failCount === 0) {
    console.log('\n🎉 All tests passed! Supabase is configured correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error details above.\n');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run the tests
testSupabaseConnection().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
