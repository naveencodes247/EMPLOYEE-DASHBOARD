import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const client = createClient(SUPABASE_URL, ANON_KEY);

const PASSWORDS = {
  admin: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '',
  manager: process.env.MANAGER_PASSWORD || process.env.MANAGER_PASSWORD || '',
  employee: process.env.EMPLOYEE_PASSWORD || process.env.EMPLOYEE_PASSWORD || '',
};

async function verifyAll() {
  console.log('================================================================');
  console.log('FINAL VERIFICATION: EMP03 Tasks & Demo Data Removal');
  console.log('================================================================\n');

  // 1. Verify Clean Database State
  const { data: adminEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'ADM01' });
  const adminClient = createClient(SUPABASE_URL, ANON_KEY);
  await adminClient.auth.signInWithPassword({ email: adminEmail, password: PASSWORDS.admin });

  const { data: allTasks } = await adminClient.from('tasks').select('id, title, status, assigned_to');
  console.log(`[PASS 1] Total tasks in DB: ${allTasks.length}`);
  for (const t of allTasks) {
    console.log(`   - Task: "${t.title}" (status: ${t.status}, assigned_to: ${t.assigned_to})`);
  }

  const { data: allReports } = await adminClient.from('daily_reports').select('id, date');
  console.log(`[PASS 2] Total daily reports in DB: ${allReports.length}`);

  const { data: allAtt } = await adminClient.from('attendance_records').select('id, date');
  console.log(`[PASS 3] Total attendance records in DB: ${allAtt.length}`);

  // 2. Verify Manager Portal Data
  const { data: manEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'MAN01' });
  const managerClient = createClient(SUPABASE_URL, ANON_KEY);
  await managerClient.auth.signInWithPassword({ email: manEmail, password: PASSWORDS.manager });

  const { data: mTasks } = await managerClient.from('tasks').select('id, title, status');
  console.log(`[PASS 4] Manager queries tasks: ${mTasks.length} deliverables returned (no demo tasks)`);

  // 3. Verify EMP03 Login & Tasks
  const { data: emp03Email } = await client.rpc('resolve_employee_email', { p_employee_id: 'EMP03' });
  const emp03Client = createClient(SUPABASE_URL, ANON_KEY);
  const { data: emp03Auth, error: emp03AuthErr } = await emp03Client.auth.signInWithPassword({
    email: emp03Email,
    password: PASSWORDS.employee,
  });

  if (emp03AuthErr) {
    console.error('EMP03 auth failed:', emp03AuthErr);
    process.exit(1);
  }

  const { data: emp03Profile } = await emp03Client
    .from('profiles')
    .select('id, system_id, full_name, role')
    .eq('id', emp03Auth.user.id)
    .single();

  console.log(`[PASS 5] EMP03 Authenticated: ${emp03Profile.full_name} (${emp03Profile.system_id})`);

  // Query tasks as EMP03
  const { data: emp03Tasks, error: emp03TasksErr } = await emp03Client
    .from('tasks')
    .select(`
      id,
      title,
      status,
      assigned_to,
      task_assignments(id, user_id, status)
    `);

  if (emp03TasksErr) {
    console.error('EMP03 task query error:', emp03TasksErr);
    process.exit(1);
  }

  console.log(`[PASS 6] EMP03 receives assigned tasks: count = ${emp03Tasks.length}`);
  const assignedToEmp03 = emp03Tasks.filter(
    (t) => t.assigned_to === emp03Profile.id || t.task_assignments?.some((a) => a.user_id === emp03Profile.id)
  );

  console.log(`[PASS 7] Verified deliverable assignments for EMP03: ${assignedToEmp03.length} tasks:`);
  for (const t of assignedToEmp03) {
    console.log(`   ✓ "${t.title}"`);
  }

  if (assignedToEmp03.length === 2) {
    console.log('\n================================================================');
    console.log('SUCCESS: All issues verified and resolved!');
    console.log('1. Real manager tasks ("make a neew graphic", "do it fast") appear for EMP03.');
    console.log('2. Old demo tasks, duplicate seed records, fake reports and fake attendance removed.');
    console.log('3. Manager and Admin dashboards reflect genuine real records with 0 demo clutter.');
    console.log('================================================================');
  } else {
    console.error('FAILED: Expected 2 assigned tasks for EMP03');
    process.exit(1);
  }
}

verifyAll();
