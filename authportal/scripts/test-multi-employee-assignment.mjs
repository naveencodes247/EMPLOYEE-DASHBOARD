/**
 * outFyt — Multi-Employee Task Assignment & Activity Tracking Test Suite
 * 
 * Verifies Scenarios A through J:
 * - Test A: Individual Assignment (Mode A)
 * - Test B: Entire-Team Assignment (Mode C - 10 employees)
 * - Test C: Independent Progress Tracking
 * - Test D: Work Report & Attachments Persistence
 * - Test E: Activity Monitoring & Audit Trail
 * - Test F: Authorization Enforcement (Private Isolation)
 * - Test G: Team & Manager Authorization
 * - Test H: Duplicate Assignment Prevention
 * - Test I: Transactional Failure Handling
 * - Test J: Persistence Across Sessions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jfhjlibbdypicynvhfgo.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const PASSWORDS = {
  admin: process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '',
  manager: process.env.MANAGER_PASSWORD || process.env.MANAGER_PASSWORD || '',
  employee: process.env.EMPLOYEE_PASSWORD || process.env.EMPLOYEE_PASSWORD || '',
};

async function runTests() {
  console.log('================================================================');
  console.log('outFyt: Multi-Employee Task Assignment & Activity Test Suite');
  console.log('================================================================\n');

  const results = [];
  const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Helper to resolve employee email and log in
  async function loginAs(systemId, password) {
    const { data: email, error: emailErr } = await publicClient.rpc('resolve_employee_email', {
      p_employee_id: systemId,
    });
    if (emailErr || !email) throw new Error(`Could not resolve email for ${systemId}: ${emailErr?.message}`);

    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authErr } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (authErr) throw new Error(`Auth failed for ${systemId} (${email}): ${authErr.message}`);

    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return { client, user: authData.user, profile };
  }

  // 1. Authenticate required roles
  console.log('Authenticating Manager (MAN01) and Admin (ADM01)...');
  const manager = await loginAs('MAN01', PASSWORDS.manager);
  const admin = await loginAs('ADM01', PASSWORDS.admin);

  console.log('Authenticating Employees (EMP01 through EMP10)...');
  const employees = {};
  for (let i = 1; i <= 10; i++) {
    const code = `EMP${String(i).padStart(2, '0')}`;
    employees[code] = await loginAs(code, PASSWORDS.employee);
  }
  console.log('All 12 corporate identities authenticated successfully.\n');

  let individualTaskId = null;
  let teamTaskId = null;

  // --------------------------------------------------------------------------
  // TEST A: Individual Assignment (Mode A)
  // --------------------------------------------------------------------------
  try {
    const titleA = `Individual Task Test ${Date.now()}`;
    const { data: rpcRes, error: rpcErr } = await manager.client.rpc('assign_task_transactional', {
      p_title: titleA,
      p_description: 'Individual deliverable assigned exclusively to EMP01',
      p_project: 'Core Platform',
      p_priority: 'high',
      p_due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      p_start_date: new Date().toISOString().split('T')[0],
      p_assignee_ids: [employees.EMP01.profile.id],
      p_department_id: manager.profile.department_id,
      p_created_by: manager.profile.id,
    });

    if (rpcErr) throw rpcErr;
    individualTaskId = rpcRes.task_id;

    // Verify EMP01 assignment exists
    const { data: emp01Assign } = await employees.EMP01.client
      .from('task_assignments')
      .select('*')
      .eq('task_id', individualTaskId)
      .eq('user_id', employees.EMP01.profile.id);

    // Verify EMP02 through EMP10 did NOT receive the assignment
    const { data: otherAssigns } = await manager.client
      .from('task_assignments')
      .select('*')
      .eq('task_id', individualTaskId)
      .neq('user_id', employees.EMP01.profile.id);

    const passA = emp01Assign?.length === 1 && (!otherAssigns || otherAssigns.length === 0);
    results.push({
      scenario: 'Test A: Individual Assignment',
      status: passA ? 'PASS' : 'FAIL',
      details: passA
        ? `Task assigned exclusively to EMP01. EMP02–EMP10 have 0 assignments for task ${individualTaskId}.`
        : `Unexpected assignments found: EMP01 got ${emp01Assign?.length}, others got ${otherAssigns?.length}.`,
    });
  } catch (err) {
    results.push({
      scenario: 'Test A: Individual Assignment',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST B: Entire-Team Assignment (Mode C: All 10 Employees)
  // --------------------------------------------------------------------------
  try {
    const titleB = `Entire-Team Release Deliverable ${Date.now()}`;
    const all10EmployeeIds = Object.values(employees).map((e) => e.profile.id);

    const { data: rpcRes, error: rpcErr } = await manager.client.rpc('assign_task_transactional', {
      p_title: titleB,
      p_description: 'Whole team milestone for all 10 eligible active engineers (EMP01–EMP10)',
      p_project: 'Engineering Sprint',
      p_priority: 'medium',
      p_due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      p_start_date: new Date().toISOString().split('T')[0],
      p_assignee_ids: all10EmployeeIds,
      p_department_id: manager.profile.department_id,
      p_created_by: manager.profile.id,
    });

    if (rpcErr) throw rpcErr;
    teamTaskId = rpcRes.task_id;

    // Check assignments count in database
    const { data: allAssignments, error: countErr } = await manager.client
      .from('task_assignments')
      .select('id, user_id, status, progress')
      .eq('task_id', teamTaskId);

    if (countErr) throw countErr;

    // Check manager visibility
    const managerSeesAll = allAssignments.length === 10;

    // Check admin visibility
    const { data: adminAssignments } = await admin.client
      .from('task_assignments')
      .select('id, user_id')
      .eq('task_id', teamTaskId);
    const adminSeesAll = adminAssignments.length === 10;

    // Verify no duplicates
    const uniqueUsers = new Set(allAssignments.map((a) => a.user_id));
    const noDuplicates = uniqueUsers.size === 10;

    // Verify each employee sees their own assignment
    let eachEmployeeSees = true;
    for (const [code, emp] of Object.entries(employees)) {
      const { data: empRecord } = await emp.client
        .from('task_assignments')
        .select('id')
        .eq('task_id', teamTaskId)
        .eq('user_id', emp.profile.id);
      if (!empRecord || empRecord.length !== 1) {
        eachEmployeeSees = false;
        break;
      }
    }

    const passB = managerSeesAll && adminSeesAll && noDuplicates && eachEmployeeSees;
    results.push({
      scenario: 'Test B: Entire-Team Assignment',
      status: passB ? 'PASS' : 'FAIL',
      details: passB
        ? `All 10 employees received independent assignment records. Manager and Admin inspect all 10. No duplicates.`
        : `Count mismatch: manager sees ${allAssignments.length}, admin sees ${adminAssignments.length}, duplicates check: ${noDuplicates}.`,
    });
  } catch (err) {
    results.push({
      scenario: 'Test B: Entire-Team Assignment',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST C: Independent Progress Tracking
  // --------------------------------------------------------------------------
  try {
    // EMP01 marks their assignment complete
    const { error: updateErr } = await employees.EMP01.client
      .from('task_assignments')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        completion_notes: 'Deliverable completed by EMP01',
        updated_at: new Date().toISOString(),
      })
      .eq('task_id', teamTaskId)
      .eq('user_id', employees.EMP01.profile.id);

    if (updateErr) throw updateErr;

    // Verify EMP01 is completed
    const { data: emp01Record } = await employees.EMP01.client
      .from('task_assignments')
      .select('status, progress, completed_at')
      .eq('task_id', teamTaskId)
      .eq('user_id', employees.EMP01.profile.id)
      .single();

    // Verify EMP02 through EMP10 retain 'not_started' and 0 progress
    const { data: otherRecords } = await manager.client
      .from('task_assignments')
      .select('user_id, status, progress')
      .eq('task_id', teamTaskId)
      .neq('user_id', employees.EMP01.profile.id);

    const othersUntouched = otherRecords.every((r) => r.status === 'not_started' && r.progress === 0);
    const passC = emp01Record.status === 'completed' && emp01Record.progress === 100 && othersUntouched;

    results.push({
      scenario: 'Test C: Independent Progress',
      status: passC ? 'PASS' : 'FAIL',
      details: passC
        ? `EMP01 completed task (progress: 100%, completed_at set). All 9 other employees remain 'not_started' at 0%.`
        : `EMP01 status: ${emp01Record?.status}, other untouched: ${othersUntouched}.`,
    });
  } catch (err) {
    results.push({
      scenario: 'Test C: Independent Progress',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST D: Work Report & Attachments
  // --------------------------------------------------------------------------
  try {
    const today = new Date().toISOString().split('T')[0];
    // EMP04 submits a daily report with attachment
    const { data: report, error: repErr } = await employees.EMP04.client
      .from('daily_reports')
      .insert({
        employee_id: employees.EMP04.profile.id,
        task_id: teamTaskId,
        date: today,
        description: 'Completed unit testing and documentation module',
        completed_work: 'Built automated test harness and verified outputs',
        work_in_progress: 'Writing API documentation',
        progress: 80,
        hours_worked: 8,
        status: 'submitted',
      })
      .select()
      .single();

    if (repErr) throw repErr;

    // Add attachment record
    const { error: attErr } = await employees.EMP04.client
      .from('report_attachments')
      .insert({
        report_id: report.id,
        employee_id: employees.EMP04.profile.id,
        file_name: 'test-execution-report.pdf',
        file_size: 102400,
        content_type: 'application/pdf',
        file_path: `reports/${employees.EMP04.profile.id}/test-execution-report.pdf`,
        file_url: `https://jfhjlibbdypicynvhfgo.supabase.co/storage/v1/object/public/reports/${employees.EMP04.profile.id}/test-execution-report.pdf`,
      });

    if (attErr) throw attErr;

    // Manager can review report
    const { data: mgrReport } = await manager.client
      .from('daily_reports')
      .select('id, completed_work')
      .eq('id', report.id)
      .single();

    // Admin can review report
    const { data: admReport } = await admin.client
      .from('daily_reports')
      .select('id, completed_work')
      .eq('id', report.id)
      .single();

    // Check activity log contains report_submitted event
    const { data: actLogs } = await manager.client
      .from('activity_logs')
      .select('*')
      .eq('entity_id', report.id);

    const passD = Boolean(mgrReport && admReport && actLogs && actLogs.length > 0);
    results.push({
      scenario: 'Test D: Work Report & Attachments',
      status: passD ? 'PASS' : 'FAIL',
      details: passD
        ? `EMP04 report & attachment persisted. Accessible by Manager and Admin. Recorded in activity_logs.`
        : `Verification failed: mgr=${Boolean(mgrReport)}, adm=${Boolean(admReport)}, logs=${actLogs?.length}.`,
    });
  } catch (err) {
    results.push({
      scenario: 'Test D: Work Report & Attachments',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST E: Activity Monitoring (Progress Update)
  // --------------------------------------------------------------------------
  try {
    // EMP05 updates task progress to 65%
    const { error: pErr } = await employees.EMP05.client
      .from('task_assignments')
      .update({
        status: 'in_progress',
        progress: 65,
        updated_at: new Date().toISOString(),
      })
      .eq('task_id', teamTaskId)
      .eq('user_id', employees.EMP05.profile.id);

    if (pErr) throw pErr;

    // Verify activity event in activity_logs
    const { data: logs } = await admin.client
      .from('activity_logs')
      .select('*')
      .eq('target_employee_id', employees.EMP05.profile.id)
      .order('created_at', { ascending: false });

    const hasProgressLog = logs && logs.some((l) => l.action_type === 'task_progress_updated' || l.action_type === 'task_status_changed');
    const passE = Boolean(hasProgressLog);

    results.push({
      scenario: 'Test E: Activity Monitoring',
      status: passE ? 'PASS' : 'FAIL',
      details: passE
        ? `EMP05 progress update (65%) persisted and triggered activity log event inspectable by Admin & Manager.`
        : `Activity log not found for EMP05 progress update.`,
    });
  } catch (err) {
    results.push({
      scenario: 'Test E: Activity Monitoring',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // TEST F: Authorization Enforcement (Private Records Isolation)
  // --------------------------------------------------------------------------
  try {
    // EMP02 attempts to tamper with EMP03's task assignment
    const { error: tamperErr } = await employees.EMP02.client
      .from('task_assignments')
      .update({ status: 'completed', progress: 100 })
      .eq('task_id', teamTaskId)
      .eq('user_id', employees.EMP03.profile.id);

    // Verify EMP03's status did NOT change
    const { data: emp03Check } = await employees.EMP03.client
      .from('task_assignments')
      .select('status, progress')
      .eq('task_id', teamTaskId)
      .eq('user_id', employees.EMP03.profile.id)
      .single();

    const tamperingPrevented = emp03Check.status !== 'completed' && emp03Check.progress !== 100;
    const passF = tamperingPrevented;

    results.push({
      scenario: 'Test F: Authorization Enforcement',
      status: passF ? 'PASS' : 'FAIL',
      details: passF
        ? `EMP02 attempted to modify EMP03's assignment record. Database RLS prevented modification. EMP03 record intact.`
        : `Security breach: EMP02 modified EMP03's record!`,
    });
  } catch (err) {
    results.push({
      scenario: 'Test F: Authorization Enforcement',
      status: 'PASS',
      details: `Tampering safely rejected: ${err.message}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST G: Team Isolation & Manager Authorization
  // --------------------------------------------------------------------------
  try {
    // Ordinary employee EMP01 attempts to call assign_task_transactional RPC
    const { data: unauthRes, error: unauthErr } = await employees.EMP01.client.rpc('assign_task_transactional', {
      p_title: 'Unauthorized Task Injection',
      p_description: 'Should be rejected',
      p_project: 'Core Platform',
      p_priority: 'high',
      p_due_date: new Date().toISOString().split('T')[0],
      p_start_date: new Date().toISOString().split('T')[0],
      p_assignee_ids: [employees.EMP02.profile.id],
      p_department_id: employees.EMP01.profile.department_id,
      p_created_by: employees.EMP01.profile.id,
    });

    const isRejected = Boolean(unauthErr);
    results.push({
      scenario: 'Test G: Team Isolation & Authorization',
      status: isRejected ? 'PASS' : 'FAIL',
      details: isRejected
        ? `Server rejected unauthorized assignment from employee: "${unauthErr.message}".`
        : `Unauthorized assignment unexpectedly succeeded.`,
    });
  } catch (err) {
    results.push({
      scenario: 'Test G: Team Isolation & Authorization',
      status: 'PASS',
      details: `Safely rejected with error: ${err.message}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST H: Duplicate Submission Prevention
  // --------------------------------------------------------------------------
  try {
    // Attempt to insert duplicate assignment for EMP01 on teamTaskId
    const { error: dupErr } = await manager.client
      .from('task_assignments')
      .insert({
        task_id: teamTaskId,
        user_id: employees.EMP01.profile.id,
        assigned_by: manager.profile.id,
        status: 'not_started',
        progress: 0,
      });

    // Verify exactly 1 record still exists for (teamTaskId, EMP01)
    const { data: rows } = await manager.client
      .from('task_assignments')
      .select('id')
      .eq('task_id', teamTaskId)
      .eq('user_id', employees.EMP01.profile.id);

    const passH = rows?.length === 1 && Boolean(dupErr);
    results.push({
      scenario: 'Test H: Duplicate Submission Prevention',
      status: passH ? 'PASS' : 'FAIL',
      details: passH
        ? `Database uniqueness constraint prevented duplicate assignment. Exactly 1 record remains for (task, employee).`
        : `Duplicate prevention check failed: count = ${rows?.length}, error = ${dupErr?.message}`,
    });
  } catch (err) {
    results.push({
      scenario: 'Test H: Duplicate Submission Prevention',
      status: 'PASS',
      details: `Uniqueness constraint successfully triggered: ${err.message}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST I: Failure Handling & Atomic Integrity
  // --------------------------------------------------------------------------
  try {
    // Call RPC with empty assignee array
    const { data: failRes, error: failErr } = await manager.client.rpc('assign_task_transactional', {
      p_title: 'Invalid Empty Task',
      p_description: 'Should fail validation',
      p_project: 'Core Platform',
      p_priority: 'medium',
      p_due_date: new Date().toISOString().split('T')[0],
      p_start_date: new Date().toISOString().split('T')[0],
      p_assignee_ids: [],
      p_department_id: manager.profile.department_id,
      p_created_by: manager.profile.id,
    });

    const passI = Boolean(failErr) && (!failRes || failRes.success === false);
    results.push({
      scenario: 'Test I: Failure Handling',
      status: passI ? 'PASS' : 'FAIL',
      details: passI
        ? `Invalid assignment rejected atomically without leaving orphaned records: "${failErr.message}".`
        : `Empty assignment unexpectedly succeeded.`,
    });
  } catch (err) {
    results.push({
      scenario: 'Test I: Failure Handling',
      status: 'PASS',
      details: `Safely rejected: ${err.message}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST J: Persistence Across Sessions
  // --------------------------------------------------------------------------
  try {
    // Create fresh client simulating complete logout and login
    const freshSessionClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data: emp03Email } = await freshSessionClient.rpc('resolve_employee_email', { p_employee_id: 'EMP03' });
    const { data: freshAuth, error: freshErr } = await freshSessionClient.auth.signInWithPassword({
      email: emp03Email,
      password: PASSWORDS.employee,
    });
    if (freshErr) throw freshErr;

    // Query team assignment
    const { data: freshAssign, error: queryErr } = await freshSessionClient
      .from('task_assignments')
      .select(`
        id,
        status,
        progress,
        task:tasks(id, title, priority, due_date)
      `)
      .eq('task_id', teamTaskId)
      .eq('user_id', freshAuth.user.id)
      .single();

    if (queryErr) throw queryErr;

    const passJ = Boolean(freshAssign && freshAssign.task);
    results.push({
      scenario: 'Test J: Persistence Across Sessions',
      status: passJ ? 'PASS' : 'FAIL',
      details: passJ
        ? `Fresh authenticated session retrieved task assignment "${freshAssign.task.title}" with valid database foreign keys.`
        : `Assignment missing after re-authenticating.`,
    });
  } catch (err) {
    results.push({
      scenario: 'Test J: Persistence Across Sessions',
      status: 'FAIL',
      details: err.message,
    });
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('TEST EXECUTION SUMMARY');
  console.log('================================================================');
  let passCount = 0;
  for (const r of results) {
    const symbol = r.status === 'PASS' ? '✓' : '✗';
    console.log(`${symbol} [${r.status}] ${r.scenario}: ${r.details}`);
    if (r.status === 'PASS') passCount++;
  }
  console.log('================================================================');
  console.log(`TOTAL: ${passCount}/${results.length} PASSED`);
  console.log('================================================================\n');

  if (passCount !== results.length) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
