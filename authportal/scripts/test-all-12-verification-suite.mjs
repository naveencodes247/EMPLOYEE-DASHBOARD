import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleLoginRequest } from '../server/loginHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const PASSWORDS = {
  admin: process.env.ADMIN_PASSWORD || '',
  manager: process.env.MANAGER_PASSWORD || '',
  employee: process.env.EMPLOYEE_PASSWORD || '',
};

const ACCOUNTS = [
  { id: 'EMP1', expectedRole: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP2', expectedRole: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP3', expectedRole: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP4', expectedRole: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP5', expectedRole: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP6', expectedRole: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP7', expectedRole: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP8', expectedRole: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP9', expectedRole: 'employee', pass: PASSWORDS.employee },
  { id: 'EMP10', expectedRole: 'employee', pass: PASSWORDS.employee },
  { id: 'MAN01', expectedRole: 'manager', pass: PASSWORDS.manager },
  { id: 'ADM01', expectedRole: 'admin', pass: PASSWORDS.admin },
];

async function runTestSuite() {
  console.log('========================================================================');
  console.log('COMPREHENSIVE 12-ACCOUNT AUTHENTICATION & DASHBOARD VERIFICATION SUITE');
  console.log('========================================================================\n');

  const results = [];

  for (const acc of ACCOUNTS) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`TESTING ACCOUNT: ${acc.id} (Expected Role: ${acc.expectedRole})`);
    console.log(`------------------------------------------------------------------------`);

    // 1. Test handleLoginRequest (Server /api/login endpoint)
    const loginRes = await handleLoginRequest({
      employeeId: acc.id,
      password: acc.pass,
      clientIp: '127.0.0.1',
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: ANON_KEY,
    });

    if (loginRes.status !== 200 || !loginRes.body.success || !loginRes.body.session) {
      console.error(`❌ [${acc.id}] Login endpoint failed:`, loginRes.body.error);
      results.push({ id: acc.id, status: 'FAILED', reason: loginRes.body.error });
      continue;
    }

    const { session, profile: loginProfile } = loginRes.body;
    console.log(`  ✓ Login endpoint succeeded: User=${loginProfile.full_name} (${loginProfile.system_id}) Role=${loginProfile.role}`);

    // 2. Hydrate client session (client-side Supabase SDK)
    const client = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await client.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    // 3. Test checkAccountStatus implementation (disambiguated departments join)
    const { data: statusProfile, error: statusErr } = await client
      .from('profiles')
      .select('role, account_status, system_id, department_id, departments!profiles_department_id_fkey(name)')
      .eq('id', session.user.id)
      .maybeSingle();

    if (statusErr || !statusProfile) {
      console.error(`❌ [${acc.id}] checkAccountStatus failed:`, statusErr?.message);
      results.push({ id: acc.id, status: 'FAILED', reason: 'checkAccountStatus query error' });
      continue;
    }

    const accountActive = statusProfile.account_status === 'active';
    console.log(`  ✓ checkAccountStatus: status=${statusProfile.account_status} role=${statusProfile.role} dept=${statusProfile.departments?.name}`);
    if (!accountActive) {
      console.error(`❌ [${acc.id}] Account is not active!`);
      results.push({ id: acc.id, status: 'FAILED', reason: 'Account inactive' });
      continue;
    }

    // 4. Test Dashboard Route Determination
    let targetView = 'employee';
    if (statusProfile.role === 'admin') targetView = 'admin';
    else if (statusProfile.role === 'manager') targetView = 'manager';

    if (targetView !== acc.expectedRole) {
      console.error(`❌ [${acc.id}] Role mismatch: expected ${acc.expectedRole}, got ${targetView}`);
      results.push({ id: acc.id, status: 'FAILED', reason: 'Role mismatch' });
      continue;
    }
    console.log(`  ✓ Dashboard Route: Successfully mapped to ${targetView.toUpperCase()} dashboard`);

    // 5. Test Role-Specific Permitted Data Retrieval
    if (targetView === 'employee') {
      const { data: myTasks, error: tErr } = await client
        .from('tasks')
        .select('id, title, status, task_assignments!inner(user_id, status, progress)')
        .eq('task_assignments.user_id', session.user.id);

      const { data: myReports, error: rErr } = await client
        .from('daily_reports')
        .select('id, description, status')
        .eq('employee_id', session.user.id);

      const { data: myAttendance, error: aErr } = await client
        .from('attendance_records')
        .select('id, status')
        .eq('employee_id', session.user.id);

      if (tErr) console.warn(`    ⚠️ Task query warning:`, tErr.message);
      console.log(`  ✓ Employee Data: Tasks=${myTasks?.length || 0}, Reports=${myReports?.length || 0}, Attendance=${myAttendance?.length || 0}`);
    } else if (targetView === 'manager') {
      const { data: allEmps } = await client
        .from('profiles')
        .select('id, system_id, full_name, role')
        .eq('role', 'employee');

      const { data: mgrTasks } = await client.from('tasks').select('id, title, status');
      const { data: mgrReports } = await client.from('daily_reports').select('id, status, description');

      console.log(`  ✓ Manager Data: Team Employees=${allEmps?.length || 0}, Tasks=${mgrTasks?.length || 0}, Reports for review=${mgrReports?.length || 0}`);
    } else if (targetView === 'admin') {
      // ADM01 Specific Requirements:
      // - Organization-wide employee visibility
      // - All task assignments
      // - All reports & image attachments
      // - Attendance records
      // - Activity audit logs
      const { data: allProfiles, error: profErr } = await client.from('profiles').select('*');
      const { data: orgTasks, error: tErr } = await client
        .from('tasks')
        .select('id, title, status, task_assignments(id, user_id, status, progress)');
      const { data: orgReports, error: rErr } = await client
        .from('daily_reports')
        .select('id, status, description, image_urls, report_attachments(*)');
      const { data: orgAttendance, error: aErr } = await client.from('attendance_records').select('*');
      const { data: orgAudit, error: alErr } = await client.from('audit_logs').select('*');

      console.log(`  ✓ Admin Organization Data:`);
      console.log(`    - Total Profiles in Directory: ${allProfiles?.length || 0}`);
      console.log(`    - Total Organizational Deliverables: ${orgTasks?.length || 0}`);
      console.log(`    - Work Reports (with attachments): ${orgReports?.length || 0}`);
      console.log(`    - Attendance & Verification Records: ${orgAttendance?.length || 0}`);
      console.log(`    - Audit Log Entries: ${orgAudit?.length || 0}`);

      if (profErr || tErr || rErr || aErr || alErr) {
        console.error(`❌ Admin query encountered errors:`, { profErr, tErr, rErr, aErr, alErr });
        results.push({ id: acc.id, status: 'FAILED', reason: 'Admin query error' });
        continue;
      }
    }

    // 6. Test Session Restoration / Page Refresh Simulation
    const restoredClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await restoredClient.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    const { data: restoredUser } = await restoredClient.auth.getUser();
    const { data: restoredProfile } = await restoredClient
      .from('profiles')
      .select('system_id, role, account_status')
      .eq('id', restoredUser.user?.id)
      .single();

    if (!restoredProfile || restoredProfile.account_status !== 'active') {
      console.error(`❌ [${acc.id}] Session restoration simulation failed!`);
      results.push({ id: acc.id, status: 'FAILED', reason: 'Session restore error' });
      continue;
    }
    console.log(`  ✓ Page Refresh / Session Restore: Preserved session for ${restoredProfile.system_id} (${restoredProfile.role})`);

    results.push({
      id: acc.id,
      systemId: statusProfile.system_id,
      name: loginProfile.full_name,
      role: targetView,
      status: 'PASSED',
    });
  }

  console.log('\n========================================================================');
  console.log('FINAL TEST RESULTS SUMMARY');
  console.log('========================================================================');
  console.table(results);

  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  console.log(`\nPASSED: ${passedCount} / ${ACCOUNTS.length}`);
  if (passedCount === ACCOUNTS.length) {
    console.log('🎉 ALL 12 ACCOUNTS FULLY VERIFIED AND PASSING!\n');
  } else {
    console.log('❌ SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runTestSuite();
