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

async function cleanOldDemoData() {
  const { data: adminEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'ADM01' });
  const adminClient = createClient(SUPABASE_URL, ANON_KEY);
  const { error: authErr } = await adminClient.auth.signInWithPassword({
    email: adminEmail,
    password: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || ''
  });
  if (authErr) {
    console.error('Admin auth error:', authErr);
    process.exit(1);
  }

  console.log('Logged in as Admin. Proceeding with demo and old data cleanup...');

  // 1. Task IDs to PRESERVE: only real manager-created tasks for EMP03
  const preserveTaskIds = [
    'f1c7c6a2-7d47-48ac-839e-61c971b35890', // "make a neew graphic"
    'c8fed363-8973-4181-8825-0fb8c9782580', // "do it fast"
  ];

  // Fetch all tasks not in preserveTaskIds
  const { data: oldTasks, error: fetchErr } = await adminClient
    .from('tasks')
    .select('id, title')
    .not('id', 'in', `(${preserveTaskIds.join(',')})`);

  if (fetchErr) {
    console.error('Error fetching old tasks:', fetchErr);
  } else {
    console.log(`Found ${oldTasks.length} old/demo tasks to remove:`, oldTasks.map(t => t.title));
    const idsToDelete = oldTasks.map(t => t.id);

    if (idsToDelete.length > 0) {
      // Delete task_assignments first
      const { error: delAssignErr } = await adminClient
        .from('task_assignments')
        .delete()
        .in('task_id', idsToDelete);
      if (delAssignErr) console.error('Error deleting task_assignments:', delAssignErr);
      else console.log('Deleted old task_assignments.');

      // Delete tasks
      const { error: delTasksErr } = await adminClient
        .from('tasks')
        .delete()
        .in('id', idsToDelete);
      if (delTasksErr) console.error('Error deleting tasks:', delTasksErr);
      else console.log('Successfully deleted old demo tasks.');
    }
  }

  // 2. Remove old demo daily reports from 2026-10-09
  const { data: oldReports } = await adminClient
    .from('daily_reports')
    .select('id, date, completed_work')
    .eq('date', '2026-10-09');

  if (oldReports && oldReports.length > 0) {
    console.log(`Found ${oldReports.length} old demo daily reports to remove.`);
    const { error: delRepErr } = await adminClient
      .from('daily_reports')
      .delete()
      .in('id', oldReports.map(r => r.id));
    if (delRepErr) console.error('Error deleting daily reports:', delRepErr);
    else console.log('Successfully deleted old demo daily reports.');
  }

  // 3. Remove old demo attendance records from 2026-10-09
  const { data: oldAtt } = await adminClient
    .from('attendance_records')
    .select('id, date')
    .eq('date', '2026-10-09');

  if (oldAtt && oldAtt.length > 0) {
    console.log(`Found ${oldAtt.length} old demo attendance records to remove.`);
    const { error: delAttErr } = await adminClient
      .from('attendance_records')
      .delete()
      .in('id', oldAtt.map(a => a.id));
    if (delAttErr) console.error('Error deleting attendance records:', delAttErr);
    else console.log('Successfully deleted old demo attendance records.');
  }

  // 4. Remove old demo calendar events from 2026-10-09
  const { data: oldCal } = await adminClient
    .from('calendar_events')
    .select('id, title, date')
    .eq('date', '2026-10-09');

  if (oldCal && oldCal.length > 0) {
    console.log(`Found ${oldCal.length} old demo calendar events to remove.`);
    const { error: delCalErr } = await adminClient
      .from('calendar_events')
      .delete()
      .in('id', oldCal.map(c => c.id));
    if (delCalErr) console.error('Error deleting calendar events:', delCalErr);
    else console.log('Successfully deleted old demo calendar events.');
  }

  console.log('\n--- VERIFICATION OF REMAINING TASKS ---');
  const { data: remainingTasks } = await adminClient
    .from('tasks')
    .select('id, title, status, assigned_to');
  console.table(remainingTasks);
}

cleanOldDemoData();
