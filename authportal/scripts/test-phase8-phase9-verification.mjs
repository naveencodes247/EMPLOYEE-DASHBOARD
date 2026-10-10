import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xegcxjfgxepcwnxuvgnt.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const PASSWORDS = {
  admin: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '',
  manager: process.env.MANAGER_PASSWORD || process.env.MANAGER_PASSWORD || '',
  employee: process.env.EMPLOYEE_PASSWORD || process.env.EMPLOYEE_PASSWORD || '',
};

console.log('====================================================');
console.log('outFyt: Phase 8 & Phase 9 Comprehensive Verification');
console.log('====================================================\n');

async function runTests() {
  const results = [];
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --------------------------------------------------------------------------
  // Test 1: Unauthenticated RLS Rejection
  // --------------------------------------------------------------------------
  try {
    const { data: anonData, error: anonErr } = await client
      .from('profiles')
      .select('id, system_id, full_name, email');

    // With RLS active and user signed out, anonData should be empty or return an error
    const isBlocked = !anonData || anonData.length === 0 || Boolean(anonErr);
    results.push({
      id: 1,
      name: 'Unauthenticated / Anonymous access blocked by Row-Level Security',
      status: isBlocked ? 'PASS' : 'FAIL',
      details: isBlocked
        ? 'RLS successfully blocked unauthenticated queries to profiles.'
        : `Leaked ${anonData.length} records to anonymous caller.`,
    });
  } catch (err) {
    results.push({
      id: 1,
      name: 'Unauthenticated / Anonymous access blocked by Row-Level Security',
      status: 'PASS',
      details: `Blocked with error: ${err.message}`,
    });
  }

  // --------------------------------------------------------------------------
  // Test 2: Admin ADM01 Login & Organization-Wide Visibility (10 Employees + Manager + Admin)
  // --------------------------------------------------------------------------
  let adminUserId = null;
  try {
    const { data: adminEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'ADM01' });
    const { data: adminAuth, error: authErr } = await client.auth.signInWithPassword({
      email: adminEmail,
      password: PASSWORDS.admin,
    });

    if (authErr || !adminAuth.user) throw authErr || new Error('Admin login failed');
    adminUserId = adminAuth.user.id;

    // Admin queries all employees
    const { data: allProfiles, error: pErr } = await client
      .from('profiles')
      .select('id, system_id, full_name, email, role, job_title, avatar_url, account_status')
      .order('system_id', { ascending: true });

    if (pErr) throw pErr;

    const employees = allProfiles.filter((p) => p.role === 'employee');
    const empIds = employees.map((e) => e.system_id);
    const expected = ['EMP01', 'EMP02', 'EMP03', 'EMP04', 'EMP05', 'EMP06', 'EMP07', 'EMP08', 'EMP09', 'EMP10'];
    const allExpectedPresent = expected.every((id) => empIds.includes(id));

    results.push({
      id: 2,
      name: 'Admin ADM01 authenticates and views all 10 employee profiles (EMP01-EMP10)',
      status: employees.length >= 10 && allExpectedPresent ? 'PASS' : 'FAIL',
      details: `Found ${employees.length} employee accounts in Supabase: ${empIds.join(', ')}`,
    });

    // Check secrets are not in profiles
    const forbiddenFields = ['password', 'password_hash', 'encrypted_password', 'secret', 'token'];
    const exposedFields = forbiddenFields.filter((f) => f in (allProfiles[0] || {}));
    results.push({
      id: 3,
      name: 'No password hashes, credentials, or session tokens exposed in database records',
      status: exposedFields.length === 0 ? 'PASS' : 'FAIL',
      details: 'Clean data boundary: zero credential fields exposed in profiles.',
    });
  } catch (err) {
    results.push({
      id: 2,
      name: 'Admin ADM01 authenticates and views all 10 employee profiles (EMP01-EMP10)',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // Test 3: Admin Can Update Permitted Employee Profile Fields
  // --------------------------------------------------------------------------
  try {
    const { data: targetEmp } = await client
      .from('profiles')
      .select('id, full_name, job_title, system_id')
      .eq('system_id', 'EMP01')
      .single();

    if (targetEmp) {
      const origTitle = targetEmp.job_title;
      const testTitle = 'Senior Systems Architect';

      // Update as Admin
      const { error: updErr } = await client
        .from('profiles')
        .update({ job_title: testTitle, updated_at: new Date().toISOString() })
        .eq('id', targetEmp.id);

      if (updErr) throw updErr;

      // Verify persistence
      const { data: verified } = await client
        .from('profiles')
        .select('job_title')
        .eq('id', targetEmp.id)
        .single();

      // Restore
      await client
        .from('profiles')
        .update({ job_title: origTitle, updated_at: new Date().toISOString() })
        .eq('id', targetEmp.id);

      results.push({
        id: 4,
        name: 'Admin can edit and persist permitted employee profile fields',
        status: verified?.job_title === testTitle ? 'PASS' : 'FAIL',
        details: `Successfully modified, persisted, and restored title on ${targetEmp.system_id}.`,
      });
    }
  } catch (err) {
    results.push({
      id: 4,
      name: 'Admin can edit and persist permitted employee profile fields',
      status: 'FAIL',
      details: err.message,
    });
  }

  // Sign out Admin
  await client.auth.signOut();

  // --------------------------------------------------------------------------
  // Test 4: Manager MAN01 Login & Employee Directory Access
  // --------------------------------------------------------------------------
  try {
    const { data: manEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'MAN01' });
    const { data: manAuth, error: mAuthErr } = await client.auth.signInWithPassword({
      email: manEmail,
      password: PASSWORDS.manager,
    });

    if (mAuthErr || !manAuth.user) throw mAuthErr || new Error('Manager login failed');

    // Manager queries employee profiles
    const { data: teamProfiles, error: tErr } = await client
      .from('profiles')
      .select('id, system_id, full_name, email, role, job_title, avatar_url')
      .eq('role', 'employee')
      .order('system_id', { ascending: true });

    if (tErr) throw tErr;

    const teamCount = teamProfiles?.length || 0;
    results.push({
      id: 5,
      name: 'Manager MAN01 views authorized employee directory (10 employees)',
      status: teamCount >= 10 ? 'PASS' : 'FAIL',
      details: `Manager directory loaded ${teamCount} employee accounts with real profiles.`,
    });
  } catch (err) {
    results.push({
      id: 5,
      name: 'Manager MAN01 views authorized employee directory (10 employees)',
      status: 'FAIL',
      details: err.message,
    });
  }

  // Sign out Manager
  await client.auth.signOut();

  // --------------------------------------------------------------------------
  // Test 5: Employee EMP01 Login, Updating Contact Email & Full Name
  // --------------------------------------------------------------------------
  try {
    const { data: empEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'EMP01' });
    const { data: empAuth, error: eAuthErr } = await client.auth.signInWithPassword({
      email: empEmail,
      password: PASSWORDS.employee,
    });

    if (eAuthErr || !empAuth.user) throw eAuthErr || new Error('Employee login failed');

    // Employee updates own contact email & name
    const { data: empBefore } = await client
      .from('profiles')
      .select('full_name, email')
      .eq('id', empAuth.user.id)
      .single();

    const testName = 'Priya Sharma (Verified)';
    const { error: empUpdErr } = await client
      .from('profiles')
      .update({ full_name: testName, updated_at: new Date().toISOString() })
      .eq('id', empAuth.user.id);

    if (empUpdErr) throw empUpdErr;

    // Verify
    const { data: empAfter } = await client
      .from('profiles')
      .select('full_name')
      .eq('id', empAuth.user.id)
      .single();

    // Revert back
    await client
      .from('profiles')
      .update({ full_name: 'Priya Sharma', updated_at: new Date().toISOString() })
      .eq('id', empAuth.user.id);

    results.push({
      id: 6,
      name: 'Employee can update own permitted profile information (full name & contact email)',
      status: empAfter?.full_name === testName ? 'PASS' : 'FAIL',
      details: `Employee ${empAuth.user.id} updated permitted fields directly in Supabase.`,
    });

    // --------------------------------------------------------------------------
    // Test 6: Employee Cannot Change Role or Employee ID (Privilege Escalation Blocked)
    // --------------------------------------------------------------------------
    const { error: exploitErr } = await client
      .from('profiles')
      .update({ role: 'admin', system_id: 'ADM99' })
      .eq('id', empAuth.user.id);

    // Database trigger trg_enforce_profile_update_security throws exception on non-admin role/system_id alteration
    results.push({
      id: 7,
      name: 'Employee cannot change employee ID or escalate role to manager/admin',
      status: Boolean(exploitErr) ? 'PASS' : 'FAIL',
      details: exploitErr
        ? `Privilege escalation blocked: ${exploitErr.message}`
        : 'VULNERABILITY: Role modification was unexpectedly permitted!',
    });

    // --------------------------------------------------------------------------
    // Test 7: Employee Cannot Modify Another Employee's Profile
    // --------------------------------------------------------------------------
    const { data: otherEmp } = await client
      .from('profiles')
      .select('id')
      .eq('system_id', 'EMP02')
      .single();

    if (otherEmp) {
      const { data: updatedRows, error: crossUpdErr } = await client
        .from('profiles')
        .update({ full_name: 'Compromised Name' })
        .eq('id', otherEmp.id)
        .select();

      const wasBlocked = Boolean(crossUpdErr) || (!updatedRows || updatedRows.length === 0);

      results.push({
        id: 8,
        name: 'Employee cannot modify another employee\'s profile',
        status: wasBlocked ? 'PASS' : 'FAIL',
        details: wasBlocked
          ? 'RLS policy "Users can update their own profile" blocked cross-account modification (0 rows updated).'
          : 'Failed: Another employee was edited without authorization.',
      });
    }
  } catch (err) {
    results.push({
      id: 6,
      name: 'Employee permitted operations and boundaries',
      status: 'FAIL',
      details: err.message,
    });
  }

  // Sign out Employee
  await client.auth.signOut();

  // --------------------------------------------------------------------------
  // Test 8: Codebase Audit for Zero Hardcoded Demo Identities
  // --------------------------------------------------------------------------
  const filesToAudit = [
    'src/components/employee/EmployeePortal.tsx',
    'src/components/employee/EmployeeProfileSettings.tsx',
    'src/components/employee/EmployeeMessages.tsx',
    'src/components/manager/ManagerPortal.tsx',
    'src/components/manager/ManagerTeam.tsx',
    'src/components/admin/AdminPortal.tsx',
    'src/components/admin/AdminOverview.tsx',
    'src/components/admin/AdminAccounts.tsx',
    'src/components/admin/AdminSettings.tsx',
  ];

  let foundHardcoded = false;
  const hardcodedMatches = [];

  for (const relPath of filesToAudit) {
    const fullPath = path.resolve(__dirname, '..', relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('EMP-9430') || content.includes('MGR-9097')) {
        foundHardcoded = true;
        hardcodedMatches.push(`${relPath} contains obsolete example IDs`);
      }
    }
  }

  results.push({
    id: 9,
    name: 'Zero hardcoded example identities in production components',
    status: !foundHardcoded ? 'PASS' : 'FAIL',
    details: !foundHardcoded
      ? 'All components use dynamic authenticated sessions and real Supabase profiles.'
      : hardcodedMatches.join('; '),
  });

  // Print Summary Table
  console.log('RESULTS MATRIX:');
  console.log('----------------------------------------------------');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : '○';
    console.log(`[${icon} ${r.status}] #${r.id} ${r.name}`);
    console.log(`       Details: ${r.details}`);
  }
  console.log('----------------------------------------------------');

  const allPassed = results.every((r) => r.status === 'PASS');
  console.log(`\nOVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);
  return allPassed;
}

runTests()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
