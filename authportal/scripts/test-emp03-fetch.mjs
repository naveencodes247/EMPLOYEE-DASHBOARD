import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
  const { data: emp03Email } = await client.rpc('resolve_employee_email', { p_employee_id: 'EMP03' });
  const emp03Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await emp03Client.auth.signInWithPassword({
    email: emp03Email,
    password: process.env.EMPLOYEE_PASSWORD || process.env.EMPLOYEE_PASSWORD || ''
  });

  // Query as EMP03
  const { data: profile } = await emp03Client.from('profiles').select('*').eq('email', emp03Email).single();
  console.log('EMP03 Profile:', { id: profile.id, system_id: profile.system_id });

  // Emulate portalApi.getTasks
  async function getTasks(supabaseInstance, filter) {
    let query = supabaseInstance
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

    const { data, error } = await query;
    if (error) {
      console.error('getTasks query error:', error);
      return [];
    }

    let formatted = (data || []).map((t) => {
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

    if (filter?.assignedTo) {
      formatted = formatted.filter(
        (t) =>
          t.assignedToEmployeeId === filter.assignedTo ||
          (t.assignees &&
            t.assignees.some(
              (a) => a.id === filter.assignedTo || a.employeeId === filter.assignedTo
            ))
      );
    }
    return formatted;
  }

  const tasksByUuid = await getTasks(emp03Client, { assignedTo: profile.id });
  console.log('Tasks with filter.assignedTo = profile.id (UUID):', tasksByUuid.length, tasksByUuid.map(t => t.title));

  const tasksBySystemId = await getTasks(emp03Client, { assignedTo: profile.system_id });
  console.log('Tasks with filter.assignedTo = profile.system_id (EMP03):', tasksBySystemId.length, tasksBySystemId.map(t => t.title));

  // Now emulate getEmployeeWorkDetails:
  console.log('\n--- Checking getEmployeeWorkDetails logic ---');
  const allTasks = await getTasks(emp03Client, { assignedTo: profile.id });
  const employeeTasksUuid = allTasks.filter(
    (t) => t.assignedToEmployeeId === profile.id || t.assignedToEmployeeId === profile.system_id
  );
  console.log('employeeTasks in getEmployeeWorkDetails (passed profile.id):', employeeTasksUuid.length);

  const allTasksSysId = await getTasks(emp03Client, { assignedTo: profile.system_id });
  const employeeTasksSysId = allTasksSysId.filter(
    (t) => t.assignedToEmployeeId === profile.system_id || t.assignedToEmployeeId === profile.id
  );
  console.log('employeeTasks in getEmployeeWorkDetails (passed profile.system_id):', employeeTasksSysId.length);
}

testFetch();
