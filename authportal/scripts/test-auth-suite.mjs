/**
 * WorkSphere outFyt - Option A Comprehensive Authentication Test Suite
 * 
 * Tests:
 * 1. Valid credentials for Employee, Manager, and Admin
 * 2. Invalid password rejection and safe generic error messaging
 * 3. Invalid employee ID rejection
 * 4. Rate limiting protection (429 Too Many Requests)
 * 5. Role resolution from trusted Supabase records (profiles table)
 * 6. Direct authorization verification & session lifecycle
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 1. Read configuration from environment or .env.local
let SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...vParts] = trimmed.split('=');
    const val = vParts.join('=').trim().replace(/^["']|["']$/g, '');
    if (k === 'VITE_SUPABASE_URL' || k === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = val;
    if (k === 'VITE_SUPABASE_ANON_KEY' || k === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') SUPABASE_KEY = val;
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PASSWORDS = {
  admin: process.env.ADMIN_PASSWORD || process.env.INITIAL_PASSWORD || process.env.ADMIN_PASSWORD || '',
  manager: process.env.MANAGER_PASSWORD || process.env.INITIAL_PASSWORD || process.env.MANAGER_PASSWORD || '',
  employee: process.env.EMPLOYEE_PASSWORD || process.env.INITIAL_PASSWORD || process.env.EMPLOYEE_PASSWORD || '',
};

let testCount = 0;
let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  testCount++;
  if (condition) {
    passedCount++;
    console.log(`  [PASS] Test ${testCount}: ${testName} ${details ? '(' + details + ')' : ''}`);
  } else {
    failedCount++;
    console.error(`  [FAIL] Test ${testCount}: ${testName} ${details ? '- ' + details : ''}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('WorkSphere Option A: Employee ID + Password Login Test Suite');
  console.log('================================================================\n');

  // TEST SUITE 1: Valid Credentials Authentication (All Three Roles)
  console.log('--- TEST GROUP 1: Valid Credentials Authentication ---');
  
  const testAccounts = [
    { id: 'ADM01', role: 'admin', expectedTitle: 'Chief Executive & System Administrator', pw: PASSWORDS.admin },
    { id: 'MAN01', role: 'manager', expectedTitle: 'Engineering Lead', pw: PASSWORDS.manager },
    { id: 'EMP01', role: 'employee', expectedTitle: 'Senior Frontend Engineer', pw: PASSWORDS.employee },
    { id: 'EMP10', role: 'employee', expectedTitle: 'Client Success & Operations', pw: PASSWORDS.employee },
  ];

  for (const acc of testAccounts) {
    // 1. Resolve Employee ID to Email
    const { data: resolvedEmail, error: rpcErr } = await supabase.rpc('resolve_employee_email', {
      p_employee_id: acc.id,
    });
    assert(!rpcErr && !!resolvedEmail, `ID Resolution for ${acc.id}`, `Email: ${resolvedEmail}`);

    // 2. Sign in via Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password: acc.pw,
    });
    assert(!authErr && !!authData?.session?.access_token, `Supabase Auth verification for ${acc.id}`, `User UUID: ${authData?.user?.id}`);

    // 3. Verify Profile and Role in trusted PostgreSQL record
    if (authData?.user?.id) {
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      assert(!profErr && profile?.role === acc.role, `Trusted record role check for ${acc.id}`, `Expected: ${acc.role}, Got: ${profile?.role}`);
      assert(profile?.system_id === acc.id, `Profile system_id matches for ${acc.id}`);
      assert(profile?.account_status === 'active', `Profile status active for ${acc.id}`);

      // 4. Test authenticated session sign out
      const { error: signOutErr } = await supabase.auth.signOut();
      assert(!signOutErr, `Sign out session cleanup for ${acc.id}`);
    }
  }

  // TEST SUITE 2: Invalid Password Rejection (Safe error handling)
  console.log('\n--- TEST GROUP 2: Invalid Password Handling ---');
  {
    const { data: resolvedEmail } = await supabase.rpc('resolve_employee_email', {
      p_employee_id: 'EMP01',
    });

    const { data: failData, error: failErr } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password: 'DefinitelyIncorrectPassword123!',
    });

    assert(!!failErr && !failData?.session, 'Reject invalid password attempt', failErr?.message);
    assert(!failErr?.message?.includes('DefinitelyIncorrectPassword123!'), 'Ensure password is never echoed in error');
  }

  // TEST SUITE 3: Invalid Employee ID Rejection
  console.log('\n--- TEST GROUP 3: Invalid Employee ID Handling ---');
  {
    const { data: badEmail1 } = await supabase.rpc('resolve_employee_email', {
      p_employee_id: 'INVALID_ID_999',
    });
    assert(badEmail1 === null, 'Reject non-existent Employee ID (INVALID_ID_999)');

    const { data: badEmail2 } = await supabase.rpc('resolve_employee_email', {
      p_employee_id: 'EMP99',
    });
    assert(badEmail2 === null, 'Reject non-provisioned Employee ID (EMP99)');
  }

  // TEST SUITE 4: Server Endpoint Rate Limiting (POST /api/login)
  console.log('\n--- TEST GROUP 4: Server Endpoint Rate Limiting (POST /api/login) ---');
  {
    const testIp = '192.168.100.' + Math.floor(Math.random() * 200 + 10);
    const testEmployeeId = 'RATELIMIT_TEST_ID';
    let triggered429 = false;
    let attemptsToTrigger = 0;

    for (let i = 1; i <= 7; i++) {
      try {
        const response = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': testIp,
          },
          body: JSON.stringify({
            employeeId: testEmployeeId,
            password: 'BadPasswordAttempt' + i,
          }),
        });

        if (response.status === 429) {
          triggered429 = true;
          attemptsToTrigger = i;
          const body = await response.json();
          assert(body.retryAfterSeconds > 0, 'Rate limit response includes retryAfterSeconds', `${body.retryAfterSeconds}s`);
          break;
        }
      } catch (err) {
        console.warn('Dev server fetch warning:', err.message);
        break;
      }
    }

    assert(triggered429, `Rate limiter engaged HTTP 429 after threshold`, `Triggered at attempt #${attemptsToTrigger}`);
  }

  // TEST SUITE 5: Row Level Security & Data Boundaries
  console.log('\n--- TEST GROUP 5: Database RLS Enforcement & Boundaries ---');
  {
    // Authenticate as EMP01
    const { data: empAuth } = await supabase.auth.signInWithPassword({
      email: 'priya.sharma.8b685a1c@outfyt.co.in',
      password: PASSWORDS.employee,
    });

    const empClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${empAuth?.session?.access_token}`,
        },
      },
    });

    // An employee should see their profile
    const { data: empSelfProfile, error: selfErr } = await empClient
      .from('profiles')
      .select('id, system_id, role')
      .eq('id', empAuth.user.id)
      .single();

    assert(!selfErr && empSelfProfile?.system_id === 'EMP01', 'Employee can query own profile via RLS');

    await supabase.auth.signOut();
  }

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passedCount} passed, ${failedCount} failed, ${testCount} total`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite();
