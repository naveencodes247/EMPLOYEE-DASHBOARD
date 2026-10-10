import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL);

const adminClient = SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnose() {
  const clientToUse = adminClient || anonClient;

  // 1. Check all profiles
  console.log('\n--- PROFILES ---');
  const { data: profiles, error: pErr } = await clientToUse
    .from('profiles')
    .select('id, system_id, full_name, email, role')
    .order('system_id');
  if (pErr) console.error('Profiles err:', pErr);
  else console.table(profiles);

  const emp03 = profiles?.find(p => p.system_id === 'EMP03');
  console.log('EMP03 profile:', emp03);

  // 2. Check all tasks
  console.log('\n--- TASKS IN DATABASE ---');
  const { data: tasks, error: tErr } = await clientToUse
    .from('tasks')
    .select(`
      id,
      title,
      status,
      assigned_to,
      created_by,
      created_at,
      task_assignments(id, user_id, status)
    `)
    .order('created_at', { ascending: false });
  if (tErr) console.error('Tasks err:', tErr);
  else console.log(JSON.stringify(tasks, null, 2));

  // 3. Test logging in as EMP03
  console.log('\n--- TESTING EMP03 LOGIN & TASK QUERY VIA RLS ---');
  const password = process.env.EMPLOYEE_PASSWORD || process.env.EMPLOYEE_PASSWORD || '';
  
  // Resolve email
  const { data: emp03Email } = await anonClient.rpc('resolve_employee_email', { p_employee_id: 'EMP03' });
  console.log('Resolved email for EMP03:', emp03Email);

  const emp03Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authErr } = await emp03Client.auth.signInWithPassword({
    email: emp03Email,
    password: password
  });

  if (authErr) {
    console.error('EMP03 auth failed:', authErr);
  } else {
    console.log('EMP03 authenticated successfully! User ID:', authData.user.id);

    // Query tasks as EMP03
    const { data: empTasks, error: empTasksErr } = await emp03Client
      .from('tasks')
      .select(`
        id,
        title,
        status,
        assigned_to,
        task_assignments(id, user_id, status)
      `);
    console.log('Query tasks as EMP03 returned:');
    if (empTasksErr) console.error('empTasksErr:', empTasksErr);
    else console.log(JSON.stringify(empTasks, null, 2));

    // Also test getTasks exact query as done in portalApi
    console.log('\n--- Testing portalApi exact query as EMP03 ---');
    const { data: portalTasks, error: portalErr } = await emp03Client
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        progress,
        due_date,
        start_date,
        assigned_to,
        department_id,
        created_at,
        updated_at,
        created_by,
        creator:profiles!created_by(id, system_id, full_name, job_title),
        assignee:profiles!assigned_to(id, system_id, full_name, job_title, avatar_url),
        task_assignments(
          id,
          user_id,
          status,
          assigned_at,
          profile:profiles!user_id(id, system_id, full_name, email, job_title, avatar_url)
        )
      `)
      .order('due_date', { ascending: true });

    if (portalErr) console.error('portalErr:', portalErr);
    else console.log('portalTasks count:', portalTasks?.length, JSON.stringify(portalTasks, null, 2));
  }
}

diagnose();
