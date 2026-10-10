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

async function testManagerWorkDetails() {
  const { data: manEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'MAN01' });
  const manClient = createClient(SUPABASE_URL, ANON_KEY);
  await manClient.auth.signInWithPassword({
    email: manEmail,
    password: process.env.MANAGER_PASSWORD || process.env.MANAGER_PASSWORD || ''
  });

  const emp03Id = '1fbe36e0-1b45-4f3f-b699-6de1d5e1ab5f';

  // 1. Emulate getTasks
  const { data: tasks, error: tErr } = await manClient
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

  console.log('Tasks raw count:', tasks?.length);
  if (tErr) console.error(tErr);

  // 2. Format
  let formatted = (tasks || []).map((t) => {
    const rawAssignments = t.task_assignments || [];
    let assigneesList = rawAssignments
      .filter((a) => a.profile)
      .map((a) => ({
        id: a.profile.id,
        employeeId: a.profile.system_id,
        fullName: a.profile.full_name,
        email: a.profile.email,
        jobTitle: a.profile.job_title,
        avatarUrl: a.profile.avatar_url,
        status: a.status,
      }));

    if (assigneesList.length === 0 && t.assignee) {
      assigneesList.push({
        id: t.assignee.id,
        employeeId: t.assignee.system_id,
        fullName: t.assignee.full_name,
        jobTitle: t.assignee.job_title,
        avatarUrl: t.assignee.avatar_url,
        status: t.status,
      });
    }

    const primaryAssignee = assigneesList[0];
    return {
      id: t.id,
      title: t.title,
      assignedToEmployeeId: primaryAssignee?.id || t.assigned_to,
      assignees: assigneesList,
    };
  });

  console.log('Formatted tasks:', formatted);

  // Test filter with emp03Id
  const filteredUuid = formatted.filter(
    (t) =>
      t.assignedToEmployeeId === emp03Id ||
      (t.assignees && t.assignees.some((a) => a.id === emp03Id || a.employeeId === 'EMP03'))
  );
  console.log('Filtered by UUID:', filteredUuid.length, filteredUuid.map(t => t.title));

  // Test filter with 'EMP03'
  const filteredSys = formatted.filter(
    (t) =>
      t.assignedToEmployeeId === 'EMP03' ||
      (t.assignees && t.assignees.some((a) => a.id === 'EMP03' || a.employeeId === 'EMP03'))
  );
  console.log('Filtered by EMP03 system_id:', filteredSys.length, filteredSys.map(t => t.title));
}

testManagerWorkDetails();
