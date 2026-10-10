import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('ANON_KEY:', ANON_KEY?.slice(0, 15) + '...');

const client = createClient(SUPABASE_URL, ANON_KEY);

const PASSWORDS = {
  admin: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '',
  manager: process.env.MANAGER_PASSWORD || process.env.MANAGER_PASSWORD || '',
  employee: process.env.EMPLOYEE_PASSWORD || process.env.EMPLOYEE_PASSWORD || '',
};

const accountsToTest = [
  { id: 'EMP1', role: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP2', role: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP3', role: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP4', role: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP5', role: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP6', role: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP7', role: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP8', role: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP9', role: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP10', role: 'employee', pass: PASSWORDS.employee },
  { id: 'MAN01', role: 'manager', pass: PASSWORDS.manager },
  { id: 'ADM01', role: 'admin', pass: PASSWORDS.admin },
];

async function checkAll() {
  console.log('\n=============================================================');
  console.log('DIAGNOSING ALL 12 ACCOUNTS (EMP1–EMP10, MAN01, ADM01)');
  console.log('=============================================================\n');

  // Also query all profiles in public.profiles
  const { data: allProfiles, error: profErr } = await client
    .from('profiles')
    .select('id, system_id, full_name, email, role, account_status');

  console.log(`Found ${allProfiles?.length || 0} total profiles in database (error: ${profErr?.message || 'none'}):`);
  if (allProfiles) {
    allProfiles.forEach(p => {
      console.log(`  - [${p.system_id}] ${p.full_name} <${p.email}> role=${p.role} status=${p.account_status} (id: ${p.id})`);
    });
  }

  console.log('\n--- Testing RPC resolve_employee_email & signInWithPassword ---');

  for (const acc of accountsToTest) {
    // 1. Resolve email
    const { data: resolvedEmail, error: rpcErr } = await client.rpc('resolve_employee_email', {
      p_employee_id: acc.id,
    });

    if (rpcErr || !resolvedEmail) {
      console.log(`❌ [${acc.id}] resolve_employee_email FAILED:`, rpcErr?.message || 'Returned null');
      continue;
    }

    // 2. Sign In
    const testClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authErr } = await testClient.auth.signInWithPassword({
      email: resolvedEmail,
      password: acc.pass,
    });

    if (authErr || !authData.user) {
      console.log(`❌ [${acc.id}] Auth signIn FAILED with email "${resolvedEmail}":`, authErr?.message);
      continue;
    }

    // 3. Query profile as the authenticated user
    const { data: userProfile, error: uProfErr } = await testClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (uProfErr || !userProfile) {
      console.log(`⚠️ [${acc.id}] Auth succeeded, but profile query FAILED:`, uProfErr?.message);
    } else {
      console.log(`✅ [${acc.id}] SUCCESS: ${userProfile.full_name} (${userProfile.system_id}) role=${userProfile.role} email=${userProfile.email}`);
    }
  }
}

checkAll();
