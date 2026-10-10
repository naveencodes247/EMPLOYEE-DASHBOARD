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

async function testBrowserSignInFlow() {
  console.log('Testing browser sign-in flow for EMP03...');
  
  // 1. Resolve email
  const { data: resolvedEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'EMP03' });
  console.log('Resolved email for EMP03:', resolvedEmail);

  // 2. Sign in with password
  const empClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: authData, error: authErr } = await empClient.auth.signInWithPassword({
    email: resolvedEmail,
    password: process.env.EMPLOYEE_PASSWORD || process.env.EMPLOYEE_PASSWORD || ''
  });

  if (authErr) {
    console.error('Sign in failed:', authErr);
    return;
  }

  const user = authData.user;
  console.log('Auth successful. User ID:', user.id);

  // 3. App.tsx syncUserProfile logic
  const { data: profile, error: profErr } = await empClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  console.log('Profile loaded:', {
    id: profile.id,
    system_id: profile.system_id,
    full_name: profile.full_name,
    role: profile.role,
  });

  // 4. EmployeePortal loadPortalData logic
  // portalApi.getTasks({ assignedTo: profile.id })
  const { data: rawTasks, error: tErr } = await empClient
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

  if (tErr) {
    console.error('Task query error:', tErr);
    return;
  }

  console.log(`Raw tasks returned from Supabase for EMP03: ${rawTasks.length}`);
  for (const t of rawTasks) {
    console.log(`Task: "${t.title}" | assigned_to: ${t.assigned_to} | assignments: ${t.task_assignments?.length}`);
  }
}

testBrowserSignInFlow();
