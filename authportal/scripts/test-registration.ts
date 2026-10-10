import { createClient } from '@supabase/supabase-js';
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validateDepartment,
  validateJobTitle,
  fetchAvailableDepartments,
  authService,
} from '../src/services/auth';

const SUPABASE_URL = 'https://jfhjlibbdypicynvhfgo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rXZE-M5YsVgzFsJLBH7nug_oDEfdE7w';

async function runRegistrationTests() {
  console.log('========================================================');
  console.log('   outFyt.co.in — UNIT 5B REGISTRATION TEST SUITE       ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title: string, condition: boolean, detail?: string) {
    if (condition) {
      passed++;
      console.log(`[PASS] ${title}`);
    } else {
      failed++;
      console.error(`[FAIL] ${title} — ${detail || 'Assertion failed'}`);
    }
  }

  // -----------------------------------------------------------------
  // 1. Client-Side Input Validation Tests
  // -----------------------------------------------------------------
  console.log('--- 1. Validation Logic Verification ---');
  assert('1.1 Email validator flags invalid email format', validateEmail('invalid-email') !== null);
  assert('1.2 Email validator accepts valid outFyt email', validateEmail('priya.sharma@outfyt.co.in') === null);
  assert('1.3 Password validator enforces 8+ characters', validatePassword('Pass1') !== null);
  assert('1.4 Password validator enforces uppercase requirement', validatePassword('pass12345') !== null);
  assert('1.5 Password validator enforces numbers requirement', validatePassword('PasswordNoNum') !== null);
  assert('1.6 Password validator accepts strong password', validatePassword('Outfyt#Secure2026') === null);
  assert('1.7 Full Name validator enforces minimum length', validateFullName('A') !== null);
  assert('1.8 Department validator requires selection', validateDepartment('') !== null);
  assert('1.9 Job Title validator requires 2+ chars', validateJobTitle('X') !== null);

  // -----------------------------------------------------------------
  // 2. Department Master Data Availability
  // -----------------------------------------------------------------
  console.log('\n--- 2. Department Data Availability ---');
  const departments = await fetchAvailableDepartments();
  assert('2.1 Available departments fetched from Supabase', departments.length >= 6);
  const engDept = departments.find((d) => d.code === 'ENG');
  assert('2.2 Engineering department present', Boolean(engDept));
  const dsnDept = departments.find((d) => d.code === 'DSN');
  assert('2.3 UI/UX Design department present', Boolean(dsnDept));

  // -----------------------------------------------------------------
  // 3. Zero-Trust Security: Role Escalation Prevention
  // -----------------------------------------------------------------
  console.log('\n--- 3. Zero-Trust Role Escalation Prevention ---');
  const timestamp = Date.now();
  const hackerEmail = `intruder.${timestamp}@outfyt.co.in`;
  const exploitAttempt = await authService.signUp({
    fullName: 'Malicious Actor',
    email: hackerEmail,
    password: 'AttackPassword123!',
    confirmPassword: 'AttackPassword123!',
    requestedRole: 'admin' as any,
    department: 'Security & Infrastructure',
    jobTitle: 'Super Admin Exploit',
  });

  assert(
    '3.1 Client-side sanitization forces role to employee/manager (never admin)',
    exploitAttempt.userRole !== ('admin' as any)
  );

  // -----------------------------------------------------------------
  // 4. Duplicate Account Protection Handling
  // -----------------------------------------------------------------
  console.log('\n--- 4. Duplicate Registration Handling ---');
  const duplicateAttempt = await authService.signUp({
    fullName: 'Duplicate Applicant',
    email: 'admin.f915e1ec@outfyt.co.in',
    password: 'Password1234!',
    confirmPassword: 'Password1234!',
    requestedRole: 'employee',
    department: 'Product Engineering',
    jobTitle: 'Software Engineer',
  });

  assert(
    '4.1 Duplicate email gracefully detected and handled',
    !duplicateAttempt.success || duplicateAttempt.error !== undefined
  );

  // -----------------------------------------------------------------
  // 5. Database Profile & Approval Verification
  // -----------------------------------------------------------------
  console.log('\n--- 5. Database Foundation Integration Verification ---');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Verify organizations table has outFyt.co.in
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('name, domain')
    .limit(1)
    .single();

  assert('5.1 Organization configured as outFyt.co.in', !orgError && orgData?.name === 'outFyt.co.in');
  assert('5.2 Organization domain is outfyt.co.in', orgData?.domain === 'outfyt.co.in');

  // Verify RLS protects profiles from unauthorized read
  const { data: anonProfiles } = await supabase.from('profiles').select('*');
  assert('5.3 RLS protects employee profiles from anonymous extraction', Array.isArray(anonProfiles) && anonProfiles.length === 0);

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRegistrationTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
