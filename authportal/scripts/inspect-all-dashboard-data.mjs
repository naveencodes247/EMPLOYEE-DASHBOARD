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

async function inspectAll() {
  const { data: adminEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'ADM01' });
  const adminClient = createClient(SUPABASE_URL, ANON_KEY);
  await adminClient.auth.signInWithPassword({
    email: adminEmail,
    password: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || ''
  });

  console.log('=== 1. TASKS ===');
  const { data: tasks, error: tErr } = await adminClient
    .from('tasks')
    .select('id, title, status, progress, due_date, assigned_to, created_by, created_at')
    .order('created_at', { ascending: false });
  if (tErr) console.error(tErr);
  else console.table(tasks);

  console.log('\n=== 2. DAILY REPORTS ===');
  const { data: reports, error: rErr } = await adminClient
    .from('daily_reports')
    .select('id, employee_id, completed_work, work_in_progress, hours_worked, created_at')
    .order('created_at', { ascending: false });
  if (rErr) console.error(rErr);
  else console.table(reports);

  console.log('\n=== 3. ATTENDANCE RECORDS ===');
  const { data: attendance, error: aErr } = await adminClient
    .from('attendance_records')
    .select('id, user_id, status, check_in_time, check_out_time, work_date, hours_worked')
    .order('created_at', { ascending: false });
  if (aErr) console.error(aErr);
  else console.table(attendance);

  console.log('\n=== 4. CALENDAR EVENTS ===');
  const { data: events, error: cErr } = await adminClient
    .from('calendar_events')
    .select('id, title, event_date, start_time, type, project')
    .order('created_at', { ascending: false });
  if (cErr) console.error(cErr);
  else console.table(events);

  console.log('\n=== 5. ACCOUNT APPROVALS ===');
  const { data: approvals, error: apErr } = await adminClient
    .from('account_approvals')
    .select('id, applicant_email, applicant_name, requested_role, status, created_at')
    .order('created_at', { ascending: false });
  if (apErr) console.error(apErr);
  else console.table(approvals);

  console.log('\n=== 6. AUDIT LOGS ===');
  const { data: audit, error: auErr } = await adminClient
    .from('audit_logs')
    .select('id, action, performed_by, severity, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  if (auErr) console.error(auErr);
  else console.table(audit);
}

inspectAll();
