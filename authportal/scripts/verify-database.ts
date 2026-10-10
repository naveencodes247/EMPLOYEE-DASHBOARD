import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jfhjlibbdypicynvhfgo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rXZE-M5YsVgzFsJLBH7nug_oDEfdE7w';

async function runVerification() {
  console.log('=== WORKSPHERE UNIT 5A DATABASE VERIFICATION ===\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(name: string, condition: boolean, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name} - ${detail || 'Assertion failed'}`);
    }
  }

  // TEST 1: Database Connectivity via Supabase REST API
  try {
    const { data, error } = await supabase.from('departments').select('*');
    assertTest(
      '1. Database connectivity via Supabase Client (HTTP/REST)',
      !error,
      error?.message
    );
  } catch (err: any) {
    assertTest('1. Database connectivity via Supabase Client', false, err.message);
  }

  // TEST 2: RLS blocks unauthorized access to user profiles
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    // An unauthenticated user should see 0 rows due to RLS
    assertTest(
      '2. RLS blocks unauthorized reading of profiles (anon role)',
      !error && Array.isArray(data) && data.length === 0,
      `Expected empty array, received: ${JSON.stringify(data)} error: ${error?.message}`
    );
  } catch (err: any) {
    assertTest('2. RLS blocks unauthorized reading of profiles', false, err.message);
  }

  // TEST 3: RLS blocks unauthorized insert into profiles
  try {
    const { data, error } = await supabase.from('profiles').insert({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'attacker@evil.com',
      full_name: 'Attacker',
      role: 'admin',
      account_status: 'active',
    } as any);

    assertTest(
      '3. RLS blocks unauthorized profile creation and privilege escalation (anon role)',
      Boolean(error),
      `Expected error, but insert succeeded: ${JSON.stringify(data)}`
    );
  } catch (err: any) {
    assertTest('3. RLS blocks unauthorized profile creation', true);
  }

  // TEST 4: RLS blocks unauthorized reading of audit logs
  try {
    const { data, error } = await supabase.from('audit_logs').select('*');
    assertTest(
      '4. RLS blocks unauthorized viewing of audit logs (anon role)',
      !error && Array.isArray(data) && data.length === 0,
      `Expected empty array, received: ${JSON.stringify(data)}`
    );
  } catch (err: any) {
    assertTest('4. RLS blocks unauthorized viewing of audit logs', false, err.message);
  }

  // TEST 5: RLS blocks unauthorized viewing of account approvals
  try {
    const { data, error } = await supabase.from('account_approvals').select('*');
    assertTest(
      '5. RLS blocks unauthorized viewing of approval records (anon role)',
      !error && Array.isArray(data) && data.length === 0,
      `Expected empty array, received: ${JSON.stringify(data)}`
    );
  } catch (err: any) {
    assertTest('5. RLS blocks unauthorized viewing of approval records', false, err.message);
  }

  // TEST 6: RLS blocks unauthorized updates to organizations
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name: 'Rogue Org', slug: 'rogue-org' });
    assertTest(
      '6. RLS blocks unauthorized organization creation/mutation (anon role)',
      Boolean(error),
      `Expected error, but insert succeeded: ${JSON.stringify(data)}`
    );
  } catch (err: any) {
    assertTest('6. RLS blocks unauthorized organization mutation', true);
  }

  console.log(`\nVerification Complete: ${passedTests}/${totalTests} tests passed.`);
}

runVerification().catch(console.error);
