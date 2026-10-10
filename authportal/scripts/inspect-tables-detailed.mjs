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

async function inspectTables() {
  const { data: adminEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'ADM01' });
  const adminClient = createClient(SUPABASE_URL, ANON_KEY);
  await adminClient.auth.signInWithPassword({
    email: adminEmail,
    password: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || ''
  });

  console.log('=== DAILY REPORTS SELECT * ===');
  const { data: reports, error: rErr } = await adminClient.from('daily_reports').select('*');
  if (rErr) console.error(rErr);
  else console.log('Daily reports rows:', reports?.length, reports);

  console.log('\n=== ATTENDANCE RECORDS SELECT * ===');
  const { data: att, error: aErr } = await adminClient.from('attendance_records').select('*');
  if (aErr) console.error(aErr);
  else console.log('Attendance records rows:', att?.length, att);

  console.log('\n=== CALENDAR EVENTS SELECT * ===');
  const { data: cal, error: cErr } = await adminClient.from('calendar_events').select('*');
  if (cErr) console.error(cErr);
  else console.log('Calendar events rows:', cal?.length, cal);

  console.log('\n=== WORK NOTIFICATIONS SELECT * ===');
  const { data: notif, error: nErr } = await adminClient.from('work_notifications').select('*');
  if (nErr) console.error(nErr);
  else console.log('Work notifications rows:', notif?.length, notif);
}

inspectTables();
