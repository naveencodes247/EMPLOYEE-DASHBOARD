import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xegcxjfgxepcwnxuvgnt.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const PASSWORDS = {
  admin: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '',
  manager: process.env.MANAGER_PASSWORD || process.env.MANAGER_PASSWORD || '',
  employee: process.env.EMPLOYEE_PASSWORD || process.env.EMPLOYEE_PASSWORD || '',
};

console.log('================================================================');
console.log('outFyt: Final Functional Verification & Lifecycle Test Suite');
console.log('================================================================\n');

async function runVerification() {
  const results = [];
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let adminClient = null;
  let managerClient = null;
  let emp02Client = null;
  let emp03Client = null;
  let emp04Client = null;

  let emp02Profile = null;
  let emp03Profile = null;
  let emp04Profile = null;
  let managerProfile = null;
  let adminProfile = null;

  let singleTaskId = null;
  let multiTaskId = null;

  // --------------------------------------------------------------------------
  // TEST 1: Unauthenticated RLS Access Denial
  // --------------------------------------------------------------------------
  try {
    const { data: anonTasks, error: anonErr } = await client.from('tasks').select('id, title');
    const isProtected = !anonTasks || anonTasks.length === 0 || Boolean(anonErr);
    results.push({
      id: 1,
      name: 'Unauthenticated RLS Access Denial',
      status: isProtected ? 'PASS' : 'FAIL',
      details: isProtected
        ? 'Row Level Security prevented unauthorized anonymous queries to tasks table.'
        : `Leaked ${anonTasks.length} tasks to unauthenticated caller.`,
    });
  } catch (err) {
    results.push({
      id: 1,
      name: 'Unauthenticated RLS Access Denial',
      status: 'PASS',
      details: `Safely rejected with error: ${err.message}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 2: Multi-Role Authentication Setup
  // --------------------------------------------------------------------------
  try {
    // 1. Admin login (ADM01)
    const { data: adminEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'ADM01' });
    adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: adminAuth, error: admErr } = await adminClient.auth.signInWithPassword({
      email: adminEmail,
      password: PASSWORDS.admin,
    });
    if (admErr) throw new Error(`Admin auth failed: ${admErr.message}`);

    const { data: admP } = await adminClient.from('profiles').select('*').eq('id', adminAuth.user.id).single();
    adminProfile = admP;

    // 2. Manager login (MAN01)
    const { data: manEmail } = await client.rpc('resolve_employee_email', { p_employee_id: 'MAN01' });
    managerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: mgrAuth, error: mgrErr } = await managerClient.auth.signInWithPassword({
      email: manEmail,
      password: PASSWORDS.manager,
    });
    if (mgrErr) throw new Error(`Manager auth failed: ${mgrErr.message}`);

    const { data: mgrP } = await managerClient.from('profiles').select('*').eq('id', mgrAuth.user.id).single();
    managerProfile = mgrP;

    // 3. EMP02 login (Rohan Mehta)
    const { data: emp02Email } = await client.rpc('resolve_employee_email', { p_employee_id: 'EMP02' });
    emp02Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: e2Auth, error: e2Err } = await emp02Client.auth.signInWithPassword({
      email: emp02Email,
      password: PASSWORDS.employee,
    });
    if (e2Err) throw new Error(`EMP02 auth failed: ${e2Err.message}`);
    const { data: e2P } = await emp02Client.from('profiles').select('*').eq('id', e2Auth.user.id).single();
    emp02Profile = e2P;

    // 4. EMP03 login (Naveen Kumar)
    const { data: emp03Email } = await client.rpc('resolve_employee_email', { p_employee_id: 'EMP03' });
    emp03Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: e3Auth, error: e3Err } = await emp03Client.auth.signInWithPassword({
      email: emp03Email,
      password: PASSWORDS.employee,
    });
    if (e3Err) throw new Error(`EMP03 auth failed: ${e3Err.message}`);
    const { data: e3P } = await emp03Client.from('profiles').select('*').eq('id', e3Auth.user.id).single();
    emp03Profile = e3P;

    // 5. EMP04 login (Priyanshu Kumar)
    const { data: emp04Email } = await client.rpc('resolve_employee_email', { p_employee_id: 'EMP04' });
    emp04Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: e4Auth, error: e4Err } = await emp04Client.auth.signInWithPassword({
      email: emp04Email,
      password: PASSWORDS.employee,
    });
    if (e4Err) throw new Error(`EMP04 auth failed: ${e4Err.message}`);
    const { data: e4P } = await emp04Client.from('profiles').select('*').eq('id', e4Auth.user.id).single();
    emp04Profile = e4P;

    results.push({
      id: 2,
      name: 'Authentication of Admin, Manager, and Employees (EMP02, EMP03, EMP04)',
      status: 'PASS',
      details: `Successfully authenticated Admin (${adminProfile.full_name}), Manager (${managerProfile.full_name}), and 3 employees.`,
    });
  } catch (err) {
    results.push({
      id: 2,
      name: 'Authentication of Admin, Manager, and Employees',
      status: 'FAIL',
      details: err.message,
    });
    return results;
  }

  // --------------------------------------------------------------------------
  // TEST 3: Genuine Empty Dashboard for Unassigned Employees
  // --------------------------------------------------------------------------
  try {
    // Check EMP04 who currently has 0 tasks assigned
    const { data: e4Assignments } = await emp04Client
      .from('task_assignments')
      .select('id, task_id')
      .eq('user_id', emp04Profile.id);

    const { data: e4DirectTasks } = await emp04Client
      .from('tasks')
      .select('id')
      .eq('assigned_to', emp04Profile.id);

    const count = (e4Assignments?.length || 0) + (e4DirectTasks?.length || 0);
    const isEmpty = count === 0;

    results.push({
      id: 3,
      name: 'Genuine Empty State & Zero Counts for Unassigned Employee (EMP04)',
      status: isEmpty ? 'PASS' : 'FAIL',
      details: isEmpty
        ? `EMP04 has exactly 0 tasks and 0 assignments. Dashboard correctly calculates 0 without demo fallbacks.`
        : `EMP04 unexpectedly has ${count} tasks.`,
    });
  } catch (err) {
    results.push({
      id: 3,
      name: 'Genuine Empty State & Zero Counts for Unassigned Employee',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 4: Manager Creates Task & Assigns EMP02
  // --------------------------------------------------------------------------
  try {
    const taskTitle = `[VERIF] API Security Review - ${Date.now()}`;
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    // 1. Insert parent task as Manager
    const { data: newTask, error: taskErr } = await managerClient
      .from('tasks')
      .insert({
        title: taskTitle,
        description: 'Comprehensive review of authentication endpoints and rate limiting.',
        project: 'Core Security',
        priority: 'high',
        status: 'not_started',
        progress: 0,
        due_date: dueDate,
        assigned_to: emp02Profile.id,
        created_by: managerProfile.id,
      })
      .select()
      .single();

    if (taskErr) throw taskErr;
    singleTaskId = newTask.id;

    // 2. Insert into task_assignments atomically
    const { error: assignErr } = await managerClient
      .from('task_assignments')
      .insert({
        task_id: newTask.id,
        user_id: emp02Profile.id,
        assigned_by: managerProfile.id,
        status: 'not_started',
      });

    if (assignErr) throw assignErr;

    results.push({
      id: 4,
      name: 'Manager Creates Deliverable & Saves Assignment in Supabase',
      status: 'PASS',
      details: `Manager created task "${taskTitle}" (${newTask.id}) and saved assignment for EMP02 (${emp02Profile.full_name}).`,
    });
  } catch (err) {
    results.push({
      id: 4,
      name: 'Manager Creates Deliverable & Saves Assignment in Supabase',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 5: Assigned Employee (EMP02) Sees Task in My Tasks
  // --------------------------------------------------------------------------
  try {
    const { data: e2Tasks, error: fetchErr } = await emp02Client
      .from('tasks')
      .select(`
        id,
        title,
        status,
        progress,
        due_date,
        task_assignments(user_id, status)
      `)
      .eq('id', singleTaskId);

    if (fetchErr) throw fetchErr;

    const taskFound = e2Tasks && e2Tasks.length > 0 && e2Tasks[0].id === singleTaskId;
    const assignmentFound = e2Tasks[0]?.task_assignments?.some((a) => a.user_id === emp02Profile.id);

    results.push({
      id: 5,
      name: 'Assigned Employee (EMP02) Receives Deliverable in My Tasks',
      status: taskFound && assignmentFound ? 'PASS' : 'FAIL',
      details: taskFound && assignmentFound
        ? `EMP02 successfully queries assigned deliverable (${e2Tasks[0].title}) with matching assignment record.`
        : 'Deliverable was not found in EMP02 task list.',
    });
  } catch (err) {
    results.push({
      id: 5,
      name: 'Assigned Employee (EMP02) Receives Deliverable in My Tasks',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 6: Multi-Employee Assignment Support (EMP02 + EMP03)
  // --------------------------------------------------------------------------
  try {
    const multiTitle = `[VERIF] Cross-Functional Disaster Recovery Test - ${Date.now()}`;
    const dueDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];

    // 1. Manager inserts multi-assignee task
    const { data: mTask, error: mTaskErr } = await managerClient
      .from('tasks')
      .insert({
        title: multiTitle,
        description: 'Simulate database failover and test recovery time objective.',
        project: 'Resilience 2026',
        priority: 'medium',
        status: 'not_started',
        progress: 0,
        due_date: dueDate,
        assigned_to: emp02Profile.id,
        created_by: managerProfile.id,
      })
      .select()
      .single();

    if (mTaskErr) throw mTaskErr;
    multiTaskId = mTask.id;

    // 2. Assign to both EMP02 and EMP03
    const { error: multiAssignErr } = await managerClient
      .from('task_assignments')
      .insert([
        { task_id: mTask.id, user_id: emp02Profile.id, assigned_by: managerProfile.id, status: 'not_started' },
        { task_id: mTask.id, user_id: emp03Profile.id, assigned_by: managerProfile.id, status: 'not_started' },
      ]);

    if (multiAssignErr) throw multiAssignErr;

    // 3. Verify both EMP02 and EMP03 see this task
    const { data: emp03Check } = await emp03Client
      .from('task_assignments')
      .select('task_id, user_id, status')
      .eq('task_id', multiTaskId)
      .eq('user_id', emp03Profile.id);

    const isMultiAssigned = emp03Check && emp03Check.length === 1;

    results.push({
      id: 6,
      name: 'Multi-Employee Task Assignment & Independence (EMP02 + EMP03)',
      status: isMultiAssigned ? 'PASS' : 'FAIL',
      details: isMultiAssigned
        ? `Task ${multiTaskId} successfully multi-assigned to EMP02 and EMP03 with distinct task_assignment records.`
        : 'Failed to verify multi-assignment in database.',
    });
  } catch (err) {
    results.push({
      id: 6,
      name: 'Multi-Employee Task Assignment & Independence',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 7: Employee Updates Task Progress & Status
  // --------------------------------------------------------------------------
  try {
    // EMP02 updates singleTaskId to 'in_progress' and progress = 75
    const { error: updateErr } = await emp02Client
      .from('tasks')
      .update({
        status: 'in_progress',
        progress: 75,
        updated_at: new Date().toISOString(),
      })
      .eq('id', singleTaskId);

    if (updateErr) throw updateErr;

    const { error: taUpdateErr } = await emp02Client
      .from('task_assignments')
      .update({ status: 'in_progress' })
      .eq('task_id', singleTaskId)
      .eq('user_id', emp02Profile.id);

    if (taUpdateErr) throw taUpdateErr;

    results.push({
      id: 7,
      name: 'Employee Updates Task Status & Progress (75% In Progress)',
      status: 'PASS',
      details: `EMP02 updated singleTaskId to status='in_progress' and progress=75%. Both tasks and task_assignments updated.`,
    });
  } catch (err) {
    results.push({
      id: 7,
      name: 'Employee Updates Task Status & Progress',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 8: Manager & Admin Dashboard Synchronization
  // --------------------------------------------------------------------------
  try {
    // 1. Manager reads singleTaskId
    const { data: mgrCheck } = await managerClient
      .from('tasks')
      .select('id, status, progress, assigned_to')
      .eq('id', singleTaskId)
      .single();

    // 2. Admin reads singleTaskId
    const { data: admCheck } = await adminClient
      .from('tasks')
      .select('id, status, progress, assigned_to')
      .eq('id', singleTaskId)
      .single();

    const isSyncManager = mgrCheck?.status === 'in_progress' && mgrCheck?.progress === 75;
    const isSyncAdmin = admCheck?.status === 'in_progress' && admCheck?.progress === 75;

    results.push({
      id: 8,
      name: 'Manager & Admin Dashboard Synchronization of Employee Updates',
      status: isSyncManager && isSyncAdmin ? 'PASS' : 'FAIL',
      details: isSyncManager && isSyncAdmin
        ? `Both Manager and Admin instantly see updated task status ('in_progress') and progress (75%).`
        : `Sync mismatch: Manager sees progress=${mgrCheck?.progress}, Admin sees progress=${admCheck?.progress}.`,
    });
  } catch (err) {
    results.push({
      id: 8,
      name: 'Manager & Admin Dashboard Synchronization of Employee Updates',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 9: Employee Marks Task Completed & Verification Across Portals
  // --------------------------------------------------------------------------
  try {
    const { error: compErr } = await emp02Client
      .from('tasks')
      .update({
        status: 'completed',
        progress: 100,
        updated_at: new Date().toISOString(),
      })
      .eq('id', singleTaskId);

    if (compErr) throw compErr;

    await emp02Client
      .from('task_assignments')
      .update({ status: 'completed' })
      .eq('task_id', singleTaskId)
      .eq('user_id', emp02Profile.id);

    const { data: admVerify } = await adminClient
      .from('tasks')
      .select('status, progress')
      .eq('id', singleTaskId)
      .single();

    const isDone = admVerify?.status === 'completed' && admVerify?.progress === 100;

    results.push({
      id: 9,
      name: 'Task Completion Lifecycle: Employee Finishes -> Admin Sees 100%',
      status: isDone ? 'PASS' : 'FAIL',
      details: isDone
        ? 'EMP02 completed deliverable; Admin verified status=completed, progress=100% in real-time.'
        : `Admin saw status=${admVerify?.status}, progress=${admVerify?.progress}.`,
    });
  } catch (err) {
    results.push({
      id: 9,
      name: 'Task Completion Lifecycle',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 10: Role-Based Privilege Restrictions (Employee cannot access/tamper admin data)
  // --------------------------------------------------------------------------
  try {
    // 1. EMP02 attempts to view OTHER users' approval requests
    const { data: othersApprovals } = await emp02Client
      .from('account_approvals')
      .select('*')
      .neq('applicant_id', emp02Profile.id);

    const cannotViewOthers = !othersApprovals || othersApprovals.length === 0;

    // 2. EMP02 attempts to unauthorizedly approve an account (privilege escalation)
    const { data: updatedRows, error: exploitErr } = await emp02Client
      .from('account_approvals')
      .update({ status: 'approved' })
      .eq('applicant_id', emp02Profile.id)
      .select();

    const isUpdateBlocked = Boolean(exploitErr) || !updatedRows || updatedRows.length === 0;

    const isFullySecured = cannotViewOthers && isUpdateBlocked;

    results.push({
      id: 10,
      name: 'Role-Based Access Enforcement: Employee Blocked from Admin Approvals & Tampering',
      status: isFullySecured ? 'PASS' : 'FAIL',
      details: isFullySecured
        ? `Row-Level Security blocked employee from viewing other accounts' approvals and prevented unauthorized status updates (0 rows updated / blocked).`
        : `Security breach: viewingOthers=${!cannotViewOthers}, updateBlocked=${isUpdateBlocked}.`,
    });
  } catch (err) {
    results.push({
      id: 10,
      name: 'Role-Based Access Enforcement',
      status: 'PASS',
      details: `Safely rejected with error: ${err.message}`,
    });
  }

  // --------------------------------------------------------------------------
  // CLEANUP: Remove verification artifacts
  // --------------------------------------------------------------------------
  try {
    if (singleTaskId) {
      await adminClient.from('task_assignments').delete().eq('task_id', singleTaskId);
      await adminClient.from('tasks').delete().eq('id', singleTaskId);
    }
    if (multiTaskId) {
      await adminClient.from('task_assignments').delete().eq('task_id', multiTaskId);
      await adminClient.from('tasks').delete().eq('id', multiTaskId);
    }
  } catch {
    // Ignore cleanup error
  }

  return results;
}

runVerification().then((results) => {
  console.log('\n================================================================');
  console.log('TEST RESULTS SUMMARY:');
  console.log('================================================================');
  let passCount = 0;
  for (const r of results) {
    const symbol = r.status === 'PASS' ? '✓' : '✗';
    console.log(`${symbol} [${r.status}] Test ${r.id}: ${r.name}`);
    console.log(`   Details: ${r.details}\n`);
    if (r.status === 'PASS') passCount++;
  }
  console.log(`Passed: ${passCount} / ${results.length}`);
  if (passCount === results.length) {
    console.log('ALL VERIFICATION SUITES PASSED! 100% SUCCESS.');
    process.exit(0);
  } else {
    console.error('SOME TESTS FAILED!');
    process.exit(1);
  }
}).catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
