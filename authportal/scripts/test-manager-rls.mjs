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

async function testManagerAndEmpQuery() {
  const { data: manEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'MAN01' });
  const manClient = createClient(SUPABASE_URL, ANON_KEY);
  await manClient.auth.signInWithPassword({
    email: manEmail,
    password: process.env.MANAGER_PASSWORD || process.env.MANAGER_PASSWORD || ''
  });

  console.log('Manager logged in. Querying tasks...');
  const { data: mTasks, error: mErr } = await manClient.from('tasks').select('id, title, assigned_to');
  if (mErr) console.error('Manager tasks query error:', mErr);
  else console.log('Manager sees tasks:', mTasks);

  console.log('Manager querying task_assignments...');
  const { data: mAssign, error: aErr } = await manClient.from('task_assignments').select('id, task_id, user_id');
  if (aErr) console.error('Manager assignments error:', aErr);
  else console.log('Manager sees assignments:', mAssign);
}

testManagerAndEmpQuery();
