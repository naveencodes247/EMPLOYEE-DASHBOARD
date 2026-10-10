/**
 * Phase 8 Automated Navigation & Access Control Verification
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let SUPABASE_URL = process.env.VITE_SUPABASE_URL;
let SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...vParts] = trimmed.split('=');
    const val = vParts.join('=').trim().replace(/^["']|["']$/g, '');
    if (k === 'VITE_SUPABASE_URL') SUPABASE_URL = val;
    if (k === 'VITE_SUPABASE_ANON_KEY') SUPABASE_KEY = val;
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PASSWORDS = {
  admin: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '',
  manager: process.env.MANAGER_PASSWORD || process.env.MANAGER_PASSWORD || '',
  employee: process.env.EMPLOYEE_PASSWORD || process.env.EMPLOYEE_PASSWORD || '',
};

let passed = 0;
let total = 0;

function report(condition, name, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${name} ${details ? '(' + details + ')' : ''}`);
  } else {
    console.error(`[FAIL] ${name} - ${details}`);
  }
}

async function run() {
  console.log('--- Phase 8 Backend & Authorization Verification ---');

  // Test 1: Admin ADM01 authentication
  const { data: adminEmail, error: rpcErr } = await supabase.rpc('resolve_employee_email', {
    p_employee_id: 'ADM01',
  });
  report(!rpcErr && adminEmail === 'naveenyadavexp@gmail.com', 'Admin ID ADM01 resolves to trusted admin email', adminEmail);

  const { data: adminAuth, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: PASSWORDS.admin,
  });
  report(!authErr && adminAuth.user?.id, 'Admin ADM01 signs in successfully with trusted credentials');

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, system_id, account_status')
    .eq('id', adminAuth.user.id)
    .single();
  report(adminProfile?.role === 'admin', 'Admin account role is verified as admin in PostgreSQL profiles', adminProfile?.role);

  // Test 2: Manager MAN01 authentication & role verification
  const { data: manEmail } = await supabase.rpc('resolve_employee_email', {
    p_employee_id: 'MAN01',
  });
  const { data: manAuth } = await supabase.auth.signInWithPassword({
    email: manEmail,
    password: PASSWORDS.manager,
  });
  const { data: manProfile } = await supabase
    .from('profiles')
    .select('role, system_id')
    .eq('id', manAuth.user.id)
    .single();
  report(manProfile?.role === 'manager' && manProfile?.role !== 'admin', 'Manager role is strictly manager and NOT admin');

  // Test 3: Employee EMP01 authentication & role verification
  const { data: empEmail } = await supabase.rpc('resolve_employee_email', {
    p_employee_id: 'EMP01',
  });
  const { data: empAuth } = await supabase.auth.signInWithPassword({
    email: empEmail,
    password: PASSWORDS.employee,
  });
  const { data: empProfile } = await supabase
    .from('profiles')
    .select('role, system_id')
    .eq('id', empAuth.user.id)
    .single();
  report(empProfile?.role === 'employee' && empProfile?.role !== 'admin', 'Employee role is strictly employee and NOT admin');

  // Sign out cleanly
  await supabase.auth.signOut();

  console.log(`\nSummary: ${passed}/${total} backend authorization checks passed.`);
}

run().catch(console.error);
