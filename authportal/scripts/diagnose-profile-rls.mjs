/**
 * Diagnose RLS Policies on profiles and storage.objects
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

async function testRole(role, empId, password) {
  console.log(`\n========================================`);
  console.log(`DIAGNOSING ROLE: ${role} (${empId})`);
  console.log(`========================================`);

  const { data: email } = await supabase.rpc('resolve_employee_email', { p_employee_id: empId });
  console.log(`1. Resolved email: ${email}`);

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authErr || !authData.session) {
    console.error(`Auth failed:`, authErr);
    return;
  }

  const userId = authData.user.id;
  console.log(`2. Authenticated user UUID: ${userId}`);

  // Test A: Read profile
  const { data: profile, error: readErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  console.log(`3. Read profile:`, readErr ? `ERROR: ${readErr.message}` : `SUCCESS (system_id: ${profile.system_id})`);

  // Test B: Update profile fields (full_name, job_title)
  const { data: updateData, error: updateErr } = await supabase
    .from('profiles')
    .update({
      full_name: profile.full_name,
      job_title: profile.job_title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select();
  console.log(`4. Update profile (name, title):`, updateErr ? `ERROR: ${updateErr.message}` : `SUCCESS`);

  // Test C: Storage upload to 'avatars' bucket
  const dummyFile = Buffer.from('fake image content for testing');
  const filePath = `${userId}/test_avatar_${Date.now()}.png`;

  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(filePath, dummyFile, {
      contentType: 'image/png',
      upsert: true,
    });
  console.log(`5. Storage upload (${filePath}):`, uploadErr ? `ERROR: ${uploadErr.message}` : `SUCCESS (${uploadData?.path})`);

  // Test D: Update profile avatar_url
  if (!uploadErr) {
    const { data: pubUrl } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const { error: avatarUpdateErr } = await supabase
      .from('profiles')
      .update({
        avatar_url: pubUrl.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    console.log(`6. Profile avatar_url update:`, avatarUpdateErr ? `ERROR: ${avatarUpdateErr.message}` : `SUCCESS`);

    // Clean up uploaded test object
    await supabase.storage.from('avatars').remove([filePath]);
  }

  // Test E: What happens if an unauthenticated user or user trying to insert profile?
  const testNewId = '00000000-0000-0000-0000-000000000999';
  const { error: insertErr } = await supabase
    .from('profiles')
    .insert({
      id: testNewId,
      full_name: 'Test New User',
      email: 'test999@company.com',
      system_id: 'EMP999',
      role: 'employee',
      account_status: 'active',
    });
  console.log(`7. Insert non-owned profile:`, insertErr ? `EXPECTED RLS ERROR: ${insertErr.message}` : `UNEXPECTED SUCCESS`);

  // Test F: What if a user with no profile inserts their OWN profile?
  // Check with_check on profiles INSERT: "((app_security.is_admin()) OR (id = auth.uid()))"
  // So a user inserting their own profile (id = auth.uid()) should succeed!

  await supabase.auth.signOut();
}

async function main() {
  await testRole('Employee', 'EMP01', PASSWORDS.employee);
  await testRole('Manager', 'MAN01', PASSWORDS.manager);
  await testRole('Admin', 'ADM01', PASSWORDS.admin);
}

main().catch(console.error);
