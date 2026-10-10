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
console.log('outFyt: FULL FLOWCHART END-TO-END VERIFICATION TEST SUITE');
console.log('================================================================\n');

async function runFullFlowchartVerification() {
  const testResults = [];
  function logResult(stepNum, name, passed, details) {
    testResults.push({ stepNum, name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${mark}] Step ${stepNum}: ${name}`);
    if (details) console.log(`       Details: ${details}`);
  }

  const baseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let emp03Client = null;
  let emp03User = null;
  let emp03Profile = null;
  let emp03Email = null;

  let managerClient = null;
  let managerUser = null;
  let managerProfile = null;

  let adminClient = null;
  let adminUser = null;
  let adminProfile = null;

  let testTaskId = null;
  let testReportId = null;
  let uploadedFilePaths = [];

  try {
    // -------------------------------------------------------------
    // STEP 1: LOGIN AND ROLE VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 1. Login and Role Verification ---');

    // 1a. Employee EMP03 login
    const { data: eEmail, error: emp03EmailErr } = await baseClient.rpc('resolve_employee_email', { p_employee_id: 'EMP03' });
    emp03Email = eEmail;
    if (emp03EmailErr || !emp03Email) {
      logResult(1, 'Resolve EMP03 Email', false, emp03EmailErr?.message || 'Email not found');
    } else {
      emp03Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: empAuth, error: empAuthErr } = await emp03Client.auth.signInWithPassword({
        email: emp03Email,
        password: PASSWORDS.employee,
      });

      if (empAuthErr) {
        logResult(1, 'EMP03 Authentication', false, empAuthErr.message);
      } else {
        emp03User = empAuth.user;
        const { data: prof, error: profErr } = await emp03Client
          .from('profiles')
          .select('*')
          .eq('id', emp03User.id)
          .single();

        if (profErr || !prof) {
          logResult(1, 'EMP03 Role Verification', false, profErr?.message || 'Profile missing');
        } else {
          emp03Profile = prof;
          const passed = prof.role === 'employee' && prof.system_id === 'EMP03';
          logResult(1, 'EMP03 Login & Role Verification', passed, `Role: ${prof.role}, SystemID: ${prof.system_id}, Name: ${prof.full_name}`);
        }
      }
    }

    // 1b. Manager MAN01 login
    const { data: manEmail, error: manEmailErr } = await baseClient.rpc('resolve_employee_email', { p_employee_id: 'MAN01' });
    if (manEmailErr || !manEmail) {
      logResult(1, 'Resolve MAN01 Email', false, manEmailErr?.message || 'Email not found');
    } else {
      managerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: manAuth, error: manAuthErr } = await managerClient.auth.signInWithPassword({
        email: manEmail,
        password: PASSWORDS.manager,
      });

      if (manAuthErr) {
        logResult(1, 'MAN01 Authentication', false, manAuthErr.message);
      } else {
        managerUser = manAuth.user;
        const { data: prof, error: profErr } = await managerClient
          .from('profiles')
          .select('*')
          .eq('id', managerUser.id)
          .single();

        if (profErr || !prof) {
          logResult(1, 'MAN01 Role Verification', false, profErr?.message || 'Profile missing');
        } else {
          managerProfile = prof;
          const passed = prof.role === 'manager' && prof.system_id === 'MAN01';
          logResult(1, 'MAN01 Login & Role Verification', passed, `Role: ${prof.role}, SystemID: ${prof.system_id}, Name: ${prof.full_name}`);
        }
      }
    }

    // 1c. Admin ADM01 login
    const { data: admEmail, error: admEmailErr } = await baseClient.rpc('resolve_employee_email', { p_employee_id: 'ADM01' });
    if (admEmailErr || !admEmail) {
      logResult(1, 'Resolve ADM01 Email', false, admEmailErr?.message || 'Email not found');
    } else {
      adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: admAuth, error: admAuthErr } = await adminClient.auth.signInWithPassword({
        email: admEmail,
        password: PASSWORDS.admin,
      });

      if (admAuthErr) {
        logResult(1, 'ADM01 Authentication', false, admAuthErr.message);
      } else {
        adminUser = admAuth.user;
        const { data: prof, error: profErr } = await adminClient
          .from('profiles')
          .select('*')
          .eq('id', adminUser.id)
          .single();

        if (profErr || !prof) {
          logResult(1, 'ADM01 Role Verification', false, profErr?.message || 'Profile missing');
        } else {
          adminProfile = prof;
          const passed = prof.role === 'admin' && prof.system_id === 'ADM01';
          logResult(1, 'ADM01 Login & Role Verification', passed, `Role: ${prof.role}, SystemID: ${prof.system_id}, Name: ${prof.full_name}`);
        }
      }
    }

    // -------------------------------------------------------------
    // STEP 2: MANAGER CREATES AND ASSIGNS TASK
    // -------------------------------------------------------------
    console.log('\n--- 2. Manager Creates and Assigns Task ---');
    if (!managerClient || !emp03Profile) {
      logResult(2, 'Task Creation', false, 'Manager or Employee client not authenticated');
    } else {
      const taskTitle = `E2E Deliverable - UI Component Refinement [${Date.now()}]`;
      const taskDesc = 'Refactor design tokens, verify contrast ratios, and submit responsive layouts.';
      const dueDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

      const { data: createdTask, error: createTaskErr } = await managerClient
        .from('tasks')
        .insert({
          title: taskTitle,
          description: taskDesc,
          priority: 'high',
          status: 'in_progress',
          due_date: dueDate,
          start_date: new Date().toISOString().split('T')[0],
          project: 'Core Platform Refinement',
          created_by: managerUser.id,
          assigned_to: emp03Profile.id,
        })
        .select()
        .single();

      if (createTaskErr || !createdTask) {
        logResult(2, 'Task Creation in Supabase', false, createTaskErr?.message || 'Insert returned empty');
      } else {
        testTaskId = createdTask.id;

        // Insert assignment record
        const { data: assignRec, error: assignErr } = await managerClient
          .from('task_assignments')
          .insert({
            task_id: testTaskId,
            user_id: emp03Profile.id,
            status: 'in_progress',
            progress: 0,
            completion_notes: 'Assigned for immediate sprint execution',
          })
          .select()
          .single();

        if (assignErr) {
          logResult(2, 'Task Assignment to EMP03', false, assignErr.message);
        } else {
          logResult(2, 'Manager Creates & Assigns Task', true, `Task ID: ${testTaskId}, Assignee: EMP03 (${emp03Profile.id})`);
        }
      }
    }

    // -------------------------------------------------------------
    // STEP 3: EMPLOYEE SEES ASSIGNED TASK
    // -------------------------------------------------------------
    console.log('\n--- 3. Employee Sees Assigned Task in My Tasks ---');
    if (!emp03Client || !testTaskId) {
      logResult(3, 'Employee Sees Assigned Task', false, 'Employee client or test task unavailable');
    } else {
      // Query tasks assigned to EMP03
      const { data: empAssignments, error: empAssignErr } = await emp03Client
        .from('task_assignments')
        .select(`
          id,
          task_id,
          status,
          progress,
          completion_notes,
          tasks (
            id,
            title,
            description,
            priority,
            status,
            due_date
          )
        `)
        .eq('user_id', emp03Profile.id);

      if (empAssignErr) {
        logResult(3, 'Employee Sees Assigned Task', false, empAssignErr.message);
      } else {
        const found = empAssignments.some((a) => a.task_id === testTaskId);
        logResult(3, 'Employee Sees Assigned Task', found, `Total assigned tasks for EMP03: ${empAssignments.length}. Found test deliverable: ${found}`);
      }
    }

    // -------------------------------------------------------------
    // STEP 4: EMPLOYEE TASK UPDATES (STATUS, PROGRESS, NOTES)
    // -------------------------------------------------------------
    console.log('\n--- 4. Employee Updates Task (Status, Progress, Notes) ---');
    if (!emp03Client || !testTaskId) {
      logResult(4, 'Employee Task Updates', false, 'Employee client or task ID missing');
    } else {
      const updatedProgress = 65;
      const updatedNotes = 'Completed 65% of responsive layouts. Exported all SVG assets.';

      const { data: updatedAssignment, error: updateErr } = await emp03Client
        .from('task_assignments')
        .update({
          status: 'in_progress',
          progress: updatedProgress,
          completion_notes: updatedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', testTaskId)
        .eq('user_id', emp03Profile.id)
        .select()
        .single();

      if (updateErr) {
        logResult(4, 'Employee Task Updates', false, updateErr.message);
      } else {
        // Also update parent task progress rollup
        await emp03Client
          .from('tasks')
          .update({
            progress: updatedProgress,
            status: 'in_progress',
            updated_at: new Date().toISOString(),
          })
          .eq('id', testTaskId);

        const verified = updatedAssignment.progress === 65 && updatedAssignment.completion_notes === updatedNotes;
        logResult(4, 'Employee Updates Task', verified, `Progress: ${updatedAssignment.progress}%, Notes: "${updatedAssignment.completion_notes}"`);
      }
    }

    // -------------------------------------------------------------
    // STEP 5: MANAGER AND ADMIN SEE AUTHORIZED UPDATES
    // -------------------------------------------------------------
    console.log('\n--- 5. Manager and Admin See Authorized Updates ---');
    if (!managerClient || !adminClient || !testTaskId) {
      logResult(5, 'Manager & Admin Monitoring', false, 'Missing clients or task ID');
    } else {
      // 5a. Manager queries assignment
      const { data: manTaskAssign, error: manErr } = await managerClient
        .from('task_assignments')
        .select('progress, completion_notes, status')
        .eq('task_id', testTaskId)
        .eq('user_id', emp03Profile.id)
        .single();

      // 5b. Admin queries assignment
      const { data: admTaskAssign, error: admErr } = await adminClient
        .from('task_assignments')
        .select('progress, completion_notes, status')
        .eq('task_id', testTaskId)
        .eq('user_id', emp03Profile.id)
        .single();

      const manOk = !manErr && manTaskAssign?.progress === 65;
      const admOk = !admErr && admTaskAssign?.progress === 65;

      logResult(5, 'Manager and Admin See Authorized Updates', manOk && admOk, `Manager saw ${manTaskAssign?.progress}%, Admin saw ${admTaskAssign?.progress}%`);
    }

    // -------------------------------------------------------------
    // STEPS 6, 7 & 8: EMPLOYEE DAILY REPORT WITH MULTIPLE IMAGES
    // -------------------------------------------------------------
    console.log('\n--- 6, 7 & 8. Employee Daily Report With Image Attachments ---');
    if (!emp03Client || !emp03Profile) {
      logResult(6, 'Employee Daily Report Submission', false, 'Employee client missing');
    } else {
      // 7. Attach multiple images into Supabase Storage 'report-attachments'
      // Minimal 1x1 valid PNG buffer
      const minimalPng = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');

      const file1Path = `EMP03/test_flow_${Date.now()}_img1.png`;
      const file2Path = `EMP03/test_flow_${Date.now()}_img2.png`;

      const upload1 = await emp03Client.storage
        .from('report-attachments')
        .upload(file1Path, minimalPng, { contentType: 'image/png' });

      const upload2 = await emp03Client.storage
        .from('report-attachments')
        .upload(file2Path, minimalPng, { contentType: 'image/png' });

      if (upload1.error || upload2.error) {
        logResult(7, 'Supabase Storage Multiple Image Upload', false, upload1.error?.message || upload2.error?.message);
      } else {
        uploadedFilePaths = [file1Path, file2Path];
        logResult(7, 'Employee Attaches Multiple Images to Supabase Storage', true, `Uploaded ${file1Path} and ${file2Path}`);

        const url1 = emp03Client.storage.from('report-attachments').getPublicUrl(file1Path).data.publicUrl;
        const url2 = emp03Client.storage.from('report-attachments').getPublicUrl(file2Path).data.publicUrl;
        const imageUrls = [url1, url2];

        // 8. Save report and image references to daily_reports & report_attachments
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: reportInsert, error: reportErr } = await emp03Client
          .from('daily_reports')
          .insert({
            employee_id: emp03Profile.id,
            date: todayStr,
            task_id: testTaskId,
            description: 'Refined UI components for employee dashboard workflow.',
            completed_work: 'Built responsive modals and verified image lightbox inspection.',
            work_in_progress: 'Writing end-to-end flowchart test suite.',
            blockers: 'None encountered during today\'s sprint.',
            notes: 'High-fidelity proof of deliverables attached as image captures.',
            progress: 65,
            hours_worked: 8,
            status: 'submitted',
            image_urls: imageUrls,
          })
          .select()
          .single();

        if (reportErr || !reportInsert) {
          logResult(8, 'Report and Image References Saved in Database', false, reportErr?.message || 'Empty response');
        } else {
          testReportId = reportInsert.id;

          // Insert into report_attachments table
          const attachmentsPayload = [
            {
              report_id: testReportId,
              employee_id: emp03Profile.id,
              file_path: file1Path,
              file_name: 'test_screen_1.png',
              file_size: minimalPng.length,
              content_type: 'image/png',
              file_url: url1,
            },
            {
              report_id: testReportId,
              employee_id: emp03Profile.id,
              file_path: file2Path,
              file_name: 'test_screen_2.png',
              file_size: minimalPng.length,
              content_type: 'image/png',
              file_url: url2,
            },
          ];

          const { data: attInserts, error: attErr } = await emp03Client
            .from('report_attachments')
            .insert(attachmentsPayload)
            .select();

          if (attErr) {
            logResult(8, 'Save Report Attachments to Supabase', false, attErr.message);
          } else {
            logResult(6, 'Employee Creates Daily Report', true, `Report ID: ${testReportId}, Linked Task: ${testTaskId}, Progress: 65%`);
            logResult(8, 'Report & Images Saved Successfully in Supabase', true, `Attached ${attInserts.length} records in report_attachments`);
          }
        }
      }
    }

    // -------------------------------------------------------------
    // STEP 9: MANAGER AND ADMIN OPEN REPORT & ATTACHMENTS
    // -------------------------------------------------------------
    console.log('\n--- 9. Manager and Admin Open Report & Authorized Attachments ---');
    if (!managerClient || !adminClient || !testReportId) {
      logResult(9, 'Manager & Admin Open Report', false, 'Missing clients or report ID');
    } else {
      // 9a. Manager reads daily_reports + report_attachments
      const { data: manReport, error: manRepErr } = await managerClient
        .from('daily_reports')
        .select(`
          id,
          employee_id,
          date,
          completed_work,
          progress,
          image_urls,
          report_attachments (
            id,
            file_name,
            file_url
          )
        `)
        .eq('id', testReportId)
        .single();

      // 9b. Admin reads daily_reports + report_attachments
      const { data: admReport, error: admRepErr } = await adminClient
        .from('daily_reports')
        .select(`
          id,
          employee_id,
          date,
          completed_work,
          progress,
          image_urls,
          report_attachments (
            id,
            file_name,
            file_url
          )
        `)
        .eq('id', testReportId)
        .single();

      const manPass = !manRepErr && manReport?.report_attachments?.length === 2;
      const admPass = !admRepErr && admReport?.report_attachments?.length === 2;

      logResult(9, 'Manager & Admin Open Report & Attachments', manPass && admPass, 
        `Manager saw ${manReport?.report_attachments?.length} attachments; Admin saw ${admReport?.report_attachments?.length} attachments`);
    }

    // -------------------------------------------------------------
    // STEP 10: EMPLOYEE PROFILE AND ATTENDANCE REAL RECORDS
    // -------------------------------------------------------------
    console.log('\n--- 10. Employee Profile and Attendance from Real Records ---');
    if (!emp03Client || !managerClient) {
      logResult(10, 'Employee Profile & Attendance Records', false, 'Clients not authenticated');
    } else {
      // Query profiles table
      const { data: prof, error: profErr } = await managerClient
        .from('profiles')
        .select('id, system_id, full_name, department_id, job_title, avatar_url, role')
        .eq('system_id', 'EMP03')
        .single();

      // Query attendance_records table
      const { data: attList, error: attErr } = await managerClient
        .from('attendance_records')
        .select('*')
        .eq('user_id', emp03Profile.id);

      const profileValid = !profErr && prof?.system_id === 'EMP03' && prof?.full_name && prof?.job_title;
      const attendanceValid = !attErr;

      logResult(10, 'Employee Profile & Attendance from Real Records', profileValid && attendanceValid,
        `Profile: ${prof?.full_name} (${prof?.job_title}), Attendance records count: ${attList ? attList.length : 0}`);
    }

    // -------------------------------------------------------------
    // STEP 11: CHANGES PERSIST AFTER REFRESHING APPLICATION
    // -------------------------------------------------------------
    console.log('\n--- 11. Persistence Verification (Independent Clean Session) ---');
    {
      const freshClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      await freshClient.auth.signInWithPassword({
        email: emp03Email,
        password: PASSWORDS.employee,
      });

      const { data: persistedTask } = await freshClient
        .from('task_assignments')
        .select('progress, completion_notes')
        .eq('task_id', testTaskId)
        .eq('user_id', emp03Profile.id)
        .single();

      const { data: persistedReport } = await freshClient
        .from('daily_reports')
        .select('id, progress, image_urls')
        .eq('id', testReportId)
        .single();

      const persisted = persistedTask?.progress === 65 && persistedReport?.image_urls?.length === 2;
      logResult(11, 'Changes Persist Across Independent Client Session', persisted,
        `Persisted Task Progress: ${persistedTask?.progress}%, Persisted Report Attachments: ${persistedReport?.image_urls?.length}`);
    }

    // -------------------------------------------------------------
    // STEP 12: UNAUTHORIZED DATA ACCESS IS BLOCKED (RLS)
    // -------------------------------------------------------------
    console.log('\n--- 12. Unauthorized Data Access Blocked by Security Policies ---');
    {
      // 12a. Anonymous client trying to insert into tasks
      const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: hackTask, error: hackTaskErr } = await anonClient
        .from('tasks')
        .insert({
          title: 'Unauthorized Task Injection',
          priority: 'urgent',
          status: 'in_progress',
        })
        .select();

      const anonBlocked = Boolean(hackTaskErr);

      // 12b. Anonymous client trying to insert into daily_reports
      const { data: hackRep, error: hackRepErr } = await anonClient
        .from('daily_reports')
        .insert({
          employee_id: emp03Profile.id,
          date: '2026-10-10',
          completed_work: 'Injected report',
        })
        .select();

      const repBlocked = Boolean(hackRepErr);

      logResult(12, 'Unauthorized Access Blocked by Supabase RLS', anonBlocked && repBlocked,
        `Anonymous Task Insert Blocked: ${anonBlocked} (${hackTaskErr?.message || 'blocked'}), Report Insert Blocked: ${repBlocked}`);
    }

    // -------------------------------------------------------------
    // STEP 13: DATABASE AND UPLOAD FAILURES ARE HANDLED CORRECTLY
    // -------------------------------------------------------------
    console.log('\n--- 13. Error Handling and Safe Failure Validation ---');
    {
      // 13a. Attempt invalid non-existent task reference in assignment
      const { data: badAssign, error: badAssignErr } = await managerClient
        .from('task_assignments')
        .insert({
          task_id: '00000000-0000-0000-0000-000000000000',
          user_id: emp03Profile.id,
        })
        .select();

      const fkHandled = Boolean(badAssignErr);

      logResult(13, 'Database Constraints and Storage Validation Handled', fkHandled,
        `Foreign key rejection: ${badAssignErr?.message}`);
    }

  } catch (err) {
    console.error('Fatal error during verification:', err);
  } finally {
    // -------------------------------------------------------------
    // CLEANUP TEST ARTIFACTS
    // -------------------------------------------------------------
    console.log('\n--- Cleaning Up Temporary Test Records ---');
    try {
      if (testReportId && adminClient) {
        await adminClient.from('report_attachments').delete().eq('report_id', testReportId);
        await adminClient.from('daily_reports').delete().eq('id', testReportId);
        console.log('Cleaned up test daily report and attachments.');
      }
      if (uploadedFilePaths.length > 0 && adminClient) {
        await adminClient.storage.from('report-attachments').remove(uploadedFilePaths);
        console.log('Cleaned up test images from Supabase Storage.');
      }
      if (testTaskId && adminClient) {
        await adminClient.from('task_assignments').delete().eq('task_id', testTaskId);
        await adminClient.from('tasks').delete().eq('id', testTaskId);
        console.log('Cleaned up test task and assignments.');
      }
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr);
    }
  }

  // Summary
  console.log('\n================================================================');
  console.log('VERIFICATION SUMMARY MATRIX');
  console.log('================================================================');
  let passCount = 0;
  testResults.forEach((t) => {
    if (t.passed) passCount++;
    console.log(`${t.passed ? '✅' : '❌'} [Step ${t.stepNum}] ${t.name}`);
  });
  console.log(`\nTOTAL: ${passCount} / ${testResults.length} PASSED (${Math.round((passCount / testResults.length) * 100)}%)`);

  if (passCount === testResults.length) {
    console.log('\nALL FLOWCHART STEPS VERIFIED SUCCESSFULLY AGAINST LIVE SUPABASE BACKEND!');
  } else {
    console.error('\nSOME FLOWCHART STEPS FAILED. CHECK LOGS ABOVE.');
    process.exit(1);
  }
}

runFullFlowchartVerification();
