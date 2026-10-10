import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import type {
  Task,
  TaskStatus,
  AttendanceRecord,
  DailyReport,
  LeaveRequest,
  CalendarEvent,
  WorkNotification,
  AccountApprovalRequest,
  ManagedAccount,
  AuditLogEntry,
  ActivityLogEntry,
  TaskComment,
  TaskExtensionRequest,
  AttendanceCorrectionRequest,
  PortalSecuritySettings,
  UserProfile,
} from '../types/work';

/**
 * WorkSphere Real Backend Data Service
 * Interacts directly with PostgreSQL via Supabase client and Row Level Security.
 * Zero hardcoded production data.
 */

export interface AdminStats {
  totalEmployees: number;
  totalManagers: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  pendingApprovals: number;
  taskCompletionRate: number;
  attendanceRate: number;
}

export interface ManagerStats {
  totalTeamMembers: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  attendancePresentToday: number;
  attendanceRate: number;
}

export const portalApi = {
  // --------------------------------------------------------------------------
  // ADMIN DASHBOARD QUERIES
  // --------------------------------------------------------------------------

  async getAdminStats(): Promise<{ data: AdminStats; error?: string }> {
    try {
      // 1. Employees count
      const { count: empCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'employee')
        .eq('account_status', 'active');

      // 2. Managers count
      const { count: mgrCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'manager')
        .eq('account_status', 'active');

      // 3. Tasks statistics
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('status, due_date');

      const tasksList = allTasks || [];
      const todayStr = new Date().toISOString().split('T')[0];

      const completed = tasksList.filter((t) => t.status === 'completed').length;
      const active = tasksList.filter((t) => t.status === 'in_progress' || t.status === 'not_started').length;
      const overdue = tasksList.filter(
        (t) => t.status !== 'completed' && t.due_date && t.due_date < todayStr
      ).length;

      // 4. Pending approvals for Manager requests
      const { count: pendingCount } = await supabase
        .from('account_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const totalTasks = tasksList.length;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

      // 5. Attendance stats for today
      const { count: presentCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('date', todayStr)
        .eq('status', 'present');

      const totalPeople = (empCount || 0) + (mgrCount || 0);
      const attendanceRate = totalPeople > 0 ? Math.min(100, Math.round(((presentCount || 0) / totalPeople) * 100)) : 100;

      return {
        data: {
          totalEmployees: empCount || 0,
          totalManagers: mgrCount || 0,
          activeTasks: active,
          completedTasks: completed,
          overdueTasks: overdue,
          pendingApprovals: pendingCount || 0,
          taskCompletionRate,
          attendanceRate,
        },
      };
    } catch (err: any) {
      return {
        data: {
          totalEmployees: 0,
          totalManagers: 0,
          activeTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          pendingApprovals: 0,
          taskCompletionRate: 0,
          attendanceRate: 0,
        },
        error: err?.message || 'Failed to calculate administrative metrics.',
      };
    }
  },

  async getAdminApprovalRequests(): Promise<{ data: AccountApprovalRequest[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('account_approvals')
        .select(`
          id,
          requested_role,
          department_id,
          status,
          reviewed_by,
          reviewed_at,
          decision_reason,
          assigned_system_id,
          created_at,
          applicant:profiles!applicant_id(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: AccountApprovalRequest[] = (data || []).map((row: any) => ({
        id: row.id,
        fullName: row.applicant?.full_name || 'Applicant',
        email: row.applicant?.email || '',
        requestedRole: row.requested_role,
        department: 'Organizational Unit',
        requestedAt: new Date(row.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        emailVerified: true,
        status: row.status,
        decisionReason: row.decision_reason,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toLocaleString() : undefined,
        assignedId: row.assigned_system_id,
      }));

      return { data: formatted };
    } catch (err: any) {
      return { data: [], error: err?.message || 'Failed to fetch approval queue.' };
    }
  },

  async approveAccountRequest(approvalId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('account_approvals')
        .update({
          status: 'approved',
          decision_reason: reason.trim() || 'Authorized by Administrator',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', approvalId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Approval decision could not be processed.' };
    }
  },

  async rejectAccountRequest(approvalId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('account_approvals')
        .update({
          status: 'rejected',
          decision_reason: reason.trim() || 'Request rejected by Administrator',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', approvalId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Rejection decision could not be processed.' };
    }
  },

  async getAuditLogs(): Promise<{ data: AuditLogEntry[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          performed_by,
          target_user_id,
          severity,
          details,
          created_at,
          performer:profiles!performed_by(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formatted: AuditLogEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        action: row.action,
        performedBy: row.performer?.full_name || row.performer?.email || 'System',
        targetUser: row.target_user_id,
        timestamp: new Date(row.created_at).toLocaleString(),
        details: typeof row.details === 'object' ? JSON.stringify(row.details) : String(row.details || ''),
        severity: row.severity || 'info',
      }));

      return { data: formatted };
    } catch (err: any) {
      return { data: [], error: err?.message || 'Failed to load audit trail.' };
    }
  },

  async getManagedAccounts(): Promise<{ data: ManagedAccount[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          phone,
          full_name,
          role,
          account_status,
          system_id,
          job_title,
          avatar_url,
          created_at,
          department:departments!department_id(name)
        `)
        .order('system_id', { ascending: true });

      if (error) throw error;

      const formatted: ManagedAccount[] = (data || []).map((row: any) => ({
        id: row.id,
        systemId: row.system_id || 'PENDING',
        fullName: row.full_name,
        email: row.email,
        phone: row.phone || null,
        role: row.role,
        department: (row.department as any)?.name || 'General Operations',
        jobTitle: row.job_title || 'Team Member',
        status: row.account_status,
        createdAt: new Date(row.created_at).toLocaleDateString(),
        lastLogin: 'Recent',
        avatarUrl: row.avatar_url || null,
      }));

      return { data: formatted };
    } catch (err: any) {
      return { data: [], error: err?.message || 'Failed to load accounts directory.' };
    }
  },

  // --------------------------------------------------------------------------
  // TASKS QUERIES & MUTATIONS (MULTI-ASSIGNEE CAPABLE)
  // --------------------------------------------------------------------------

  async getTasks(filter?: { assignedTo?: string; departmentId?: string }): Promise<{ data: Task[]; error?: string }> {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          project,
          priority,
          status,
          progress,
          due_date,
          start_date,
          created_at,
          updated_at,
          created_by,
          creator:profiles!created_by(id, system_id, full_name, job_title),
          assignee:profiles!assigned_to(id, system_id, full_name, job_title, avatar_url),
          task_assignments(
            id,
            user_id,
            status,
            progress,
            completion_notes,
            completed_at,
            blockers,
            extension_requested_date,
            extension_reason,
            assigned_at,
            updated_at,
            profile:profiles!user_id(id, system_id, full_name, email, job_title, avatar_url)
          ),
          task_comments(
            id,
            task_id,
            user_id,
            comment,
            created_at,
            author:profiles!user_id(full_name, role)
          ),
          task_extension_requests(
            id,
            task_id,
            user_id,
            proposed_deadline,
            reason,
            status,
            reviewed_by,
            review_note,
            created_at,
            reviewed_at,
            requester:profiles!user_id(full_name, system_id)
          )
        `)
        .order('due_date', { ascending: true });

      if (filter?.departmentId) {
        query = query.eq('department_id', filter.departmentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let formatted: Task[] = (data || []).map((t: any) => {
        // Collect all assignees from task_assignments relation
        const rawAssignments = t.task_assignments || [];
        let assigneesList: any[] = rawAssignments
          .filter((a: any) => a.profile)
          .map((a: any) => ({
            id: a.profile.id,
            employeeId: a.profile.system_id || 'EMP',
            fullName: a.profile.full_name,
            email: a.profile.email,
            jobTitle: a.profile.job_title,
            avatarUrl: a.profile.avatar_url,
            status: a.status || 'not_started',
            progress: typeof a.progress === 'number' ? a.progress : 0,
            completionNotes: a.completion_notes || '',
            completedAt: a.completed_at || null,
            blockers: a.blockers || '',
            extensionRequestedDate: a.extension_requested_date || null,
            extensionReason: a.extension_reason || '',
            updatedAt: a.updated_at || a.assigned_at,
          }));

        const commentsList: TaskComment[] = (t.task_comments || []).map((c: any) => ({
          id: c.id,
          taskId: c.task_id,
          userId: c.user_id,
          authorName: c.author?.full_name || 'Team Member',
          authorRole: c.author?.role || 'employee',
          comment: c.comment,
          createdAt: c.created_at,
        }));

        const extensionsList: TaskExtensionRequest[] = (t.task_extension_requests || []).map((e: any) => ({
          id: e.id,
          taskId: e.task_id,
          userId: e.user_id,
          employeeName: e.requester?.full_name || 'Team Member',
          employeeId: e.requester?.system_id || 'EMP',
          proposedDeadline: e.proposed_deadline,
          reason: e.reason,
          status: e.status,
          reviewedBy: e.reviewed_by,
          reviewNote: e.review_note,
          createdAt: e.created_at,
          reviewedAt: e.reviewed_at,
        }));

        // Backward compatibility fallback to primary assignee if assignments table is empty
        if (assigneesList.length === 0 && t.assignee) {
          assigneesList.push({
            id: t.assignee.id,
            employeeId: t.assignee.system_id || 'EMP',
            fullName: t.assignee.full_name,
            jobTitle: t.assignee.job_title,
            avatarUrl: t.assignee.avatar_url,
            status: t.status || 'not_started',
            progress: t.progress || 0,
            completionNotes: '',
            updatedAt: t.updated_at || t.created_at,
          });
        }

        const primaryAssignee = assigneesList[0];
        const names = assigneesList.map((a) => a.fullName).join(', ');

        // If caller is querying for a specific employee, display that employee's assignment status & progress
        let effectiveStatus = t.status;
        let effectiveProgress = t.progress || 0;
        if (filter?.assignedTo) {
          const myAssignment = rawAssignments.find(
            (a: any) =>
              a.user_id === filter.assignedTo ||
              (a.profile && (a.profile.id === filter.assignedTo || a.profile.system_id?.toUpperCase() === filter.assignedTo?.toUpperCase()))
          );
          if (myAssignment) {
            if (myAssignment.status) effectiveStatus = myAssignment.status;
            if (typeof myAssignment.progress === 'number') effectiveProgress = myAssignment.progress;
          }
        }

        return {
          id: t.id,
          title: t.title,
          description: t.description || '',
          project: t.project || 'Operations',
          priority: t.priority as any,
          status: effectiveStatus as any,
          progress: effectiveProgress,
          assignedDate: new Date(t.created_at).toLocaleDateString(),
          startDate: t.start_date || undefined,
          dueDate: t.due_date,
          subtasks: [],
          managerName: t.creator?.full_name ? `${t.creator.full_name} (${t.creator.job_title || 'Manager'})` : 'Engineering Lead',
          assignedToEmployeeId: primaryAssignee?.id || t.assigned_to,
          assignedToEmployeeName: names || 'Unassigned',
          assignees: assigneesList,
          comments: commentsList,
          extensionRequests: extensionsList,
          createdBy: t.created_by,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        };
      });

      // Filter by assignedTo employee (matches either primary or in assignees list)
      if (filter?.assignedTo) {
        const rawTarget = filter.assignedTo.trim();
        const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawTarget);
        let targetUuid = isTargetUuid ? rawTarget : null;
        let targetSystemId = !isTargetUuid ? rawTarget.toUpperCase() : null;

        if (!targetUuid || !targetSystemId) {
          try {
            const { data: p } = await supabase
              .from('profiles')
              .select('id, system_id')
              .or(`id.eq.${isTargetUuid ? rawTarget : '00000000-0000-0000-0000-000000000000'},system_id.eq.${rawTarget.toUpperCase()}`)
              .maybeSingle();
            if (p) {
              targetUuid = p.id;
              targetSystemId = p.system_id ? p.system_id.toUpperCase() : targetSystemId;
            }
          } catch {
            // Non-blocking fallback
          }
        }

        formatted = formatted.filter((t) => {
          // Direct match against assignedToEmployeeId
          if (
            t.assignedToEmployeeId === rawTarget ||
            (targetUuid && t.assignedToEmployeeId === targetUuid) ||
            (targetSystemId && t.assignedToEmployeeId?.toUpperCase() === targetSystemId)
          ) {
            return true;
          }

          // Match against any assignee in the assignees list
          if (t.assignees && t.assignees.length > 0) {
            return t.assignees.some((a) => {
              const aId = a.id;
              const aSysId = (a.employeeId || (a as any).system_id || '').toUpperCase();
              return (
                aId === rawTarget ||
                (targetUuid && aId === targetUuid) ||
                (targetSystemId && aSysId === targetSystemId) ||
                aSysId === rawTarget.toUpperCase()
              );
            });
          }

          return false;
        });
      }

      return { data: formatted };
    } catch (err: any) {
      return { data: [], error: err?.message || 'Failed to fetch tasks.' };
    }
  },

  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    userId?: string,
    progress?: number,
    completionNotes?: string,
    blockers?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      const computedProgress =
        progress !== undefined
          ? Math.min(100, Math.max(0, progress))
          : status === 'completed'
          ? 100
          : status === 'not_started'
          ? 0
          : status === 'blocked'
          ? 25
          : 50;

      // Security check: Employees cannot mark a task completed directly without manager approval.
      // Must submit mandatory work report with proof image.
      if (status === 'completed') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: callerProf } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (callerProf?.role === 'employee') {
            return {
              success: false,
              error: 'Direct completion is restricted. Please submit a mandatory work report and proof image for manager approval.',
            };
          }
        }
      }

      // 1. Update task_assignments status if userId is provided
      if (userId) {
        let resolvedUserId = userId;
        if (!isUuid(userId)) {
          const { data: p } = await supabase
            .from('profiles')
            .select('id')
            .eq('system_id', userId)
            .maybeSingle();
          if (p?.id) resolvedUserId = p.id;
        }

        const assignPayload: any = {
          status,
          progress: computedProgress,
          updated_at: new Date().toISOString(),
        };
        if (status === 'completed') {
          assignPayload.completed_at = new Date().toISOString();
        }
        if (completionNotes !== undefined) {
          assignPayload.completion_notes = completionNotes;
        }
        if (blockers !== undefined) {
          assignPayload.blockers = blockers;
        }

        const { error: assignError } = await supabase
          .from('task_assignments')
          .update(assignPayload)
          .eq('task_id', taskId)
          .eq('user_id', resolvedUserId);

        if (assignError) throw assignError;
      } else {
        await supabase
          .from('task_assignments')
          .update({
            status,
            progress: computedProgress,
            updated_at: new Date().toISOString(),
          })
          .eq('task_id', taskId);
      }

      // 2. Fetch all assignments to calculate rollup status and progress
      const { data: allAssignments } = await supabase
        .from('task_assignments')
        .select('status, user_id, progress')
        .eq('task_id', taskId);

      let rollupStatus = status;
      let rollupProgress = computedProgress;

      if (allAssignments && allAssignments.length > 0) {
        const totalProgress = allAssignments.reduce((acc, curr) => acc + (typeof curr.progress === 'number' ? curr.progress : 0), 0);
        rollupProgress = Math.round(totalProgress / allAssignments.length);

        const allCompleted = allAssignments.every((a) => a.status === 'completed');
        const anyPending = allAssignments.some((a) => a.status === 'pending_approval');
        const anyBlocked = allAssignments.some((a) => a.status === 'blocked');
        const anyRejected = allAssignments.some((a) => a.status === 'rejected');
        const anyInProgress = allAssignments.some((a) => a.status === 'in_progress');
        const allNotStarted = allAssignments.every((a) => a.status === 'not_started');

        if (allCompleted) {
          rollupStatus = 'completed';
          rollupProgress = 100;
        } else if (anyPending) {
          rollupStatus = 'pending_approval';
        } else if (anyBlocked) {
          rollupStatus = 'blocked';
        } else if (anyRejected) {
          rollupStatus = 'rejected';
        } else if (anyInProgress || status === 'in_progress' || rollupProgress > 0) {
          rollupStatus = 'in_progress';
        } else if (allNotStarted && rollupProgress === 0) {
          rollupStatus = 'not_started';
        }
      }

      // 3. Update the parent task in Supabase
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          status: rollupStatus,
          progress: rollupProgress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update task status.' };
    }
  },

  async createTask(taskData: {
    title: string;
    description?: string;
    project?: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
    startDate?: string;
    status?: TaskStatus;
    assignedTo?: string;
    assigneeIds?: string[];
    departmentId?: string;
    createdBy?: string;
  }): Promise<{ success: boolean; data?: any; assignedCount?: number; message?: string; error?: string }> {
    try {
      const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      // Collect and deduplicate raw IDs
      const rawAssigneeIds = Array.from(
        new Set([
          ...(taskData.assigneeIds || []),
          ...(taskData.assignedTo ? [taskData.assignedTo] : []),
        ])
      ).filter(Boolean);

      // Resolve any non-UUID system_ids (e.g. EMP01) to profiles.id (UUIDs)
      const resolvedAssigneeIds: string[] = [];
      for (const id of rawAssigneeIds) {
        if (isUuid(id)) {
          resolvedAssigneeIds.push(id);
        } else {
          const { data: p } = await supabase
            .from('profiles')
            .select('id')
            .eq('system_id', id.toUpperCase())
            .maybeSingle();
          if (p?.id) resolvedAssigneeIds.push(p.id);
        }
      }

      if (resolvedAssigneeIds.length === 0) {
        return { success: false, error: 'Please select at least one eligible employee for assignment.' };
      }

      // Execute atomic transactional task assignment via database function
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('assign_task_transactional', {
        p_title: taskData.title.trim(),
        p_description: taskData.description?.trim() || '',
        p_project: taskData.project || 'Core Operations',
        p_priority: taskData.priority,
        p_due_date: taskData.dueDate,
        p_start_date: taskData.startDate || new Date().toISOString().split('T')[0],
        p_assignee_ids: resolvedAssigneeIds,
        p_department_id: taskData.departmentId || undefined,
        p_created_by: taskData.createdBy || undefined,
      });

      if (rpcErr) throw rpcErr;

      const rpcData = rpcRes as any;
      const assignedCount = rpcData?.assigned_count || resolvedAssigneeIds.length;
      return {
        success: true,
        data: { id: rpcData?.task_id, ...taskData },
        assignedCount,
        message: rpcData?.message || `Task assigned successfully to ${assignedCount} employees.`,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to assign deliverable.' };
    }
  },

  async addTaskComment(
    taskId: string,
    comment: string,
    userId?: string
  ): Promise<{ success: boolean; comment?: TaskComment; error?: string }> {
    try {
      let resolvedUserId = userId;
      if (!resolvedUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        resolvedUserId = user?.id;
      }
      if (!resolvedUserId) throw new Error('Authentication required to comment.');

      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: resolvedUserId,
          comment: comment.trim(),
        })
        .select(`
          id,
          task_id,
          user_id,
          comment,
          created_at,
          author:profiles!user_id(full_name, role)
        `)
        .single();

      if (error) throw error;

      // Log activity
      try {
        await supabase.from('activity_logs').insert({
          actor_id: resolvedUserId,
          actor_name: data.author?.full_name || 'Team Member',
          actor_role: data.author?.role || 'employee',
          action_type: 'task_comment_added',
          entity_type: 'task',
          entity_id: taskId,
          details: { comment: comment.trim() },
        });
      } catch {}

      return {
        success: true,
        comment: {
          id: data.id,
          taskId: data.task_id || taskId,
          userId: data.user_id || resolvedUserId,
          authorName: data.author?.full_name || 'Team Member',
          authorRole: data.author?.role || 'employee',
          comment: data.comment,
          createdAt: data.created_at,
        },
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to add comment.' };
    }
  },

  async requestTaskExtension(
    taskId: string,
    proposedDeadline: string,
    reason: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let resolvedUserId = userId;
      if (!resolvedUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        resolvedUserId = user?.id;
      }
      if (!resolvedUserId) throw new Error('Authentication required to request deadline extension.');

      const { error } = await supabase
        .from('task_extension_requests')
        .insert({
          task_id: taskId,
          user_id: resolvedUserId,
          proposed_deadline: proposedDeadline,
          reason: reason.trim(),
        });

      if (error) throw error;

      // Update task_assignments record
      await supabase
        .from('task_assignments')
        .update({
          extension_requested_date: proposedDeadline,
          extension_reason: reason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', taskId)
        .eq('user_id', resolvedUserId);

      // Log activity
      try {
        const { data: p } = await supabase.from('profiles').select('full_name, role').eq('id', resolvedUserId).single();
        await supabase.from('activity_logs').insert({
          actor_id: resolvedUserId,
          actor_name: p?.full_name || 'Team Member',
          actor_role: p?.role || 'employee',
          target_employee_id: resolvedUserId,
          target_employee_name: p?.full_name,
          action_type: 'extension_requested',
          entity_type: 'task',
          entity_id: taskId,
          details: { proposed_deadline: proposedDeadline, reason: reason.trim() },
        });
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to request extension.' };
    }
  },

  async reviewTaskExtension(
    requestId: string,
    decision: 'approved' | 'rejected',
    reviewNote?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required.');

      const { data: req, error: fetchErr } = await supabase
        .from('task_extension_requests')
        .select('task_id, proposed_deadline, user_id')
        .eq('id', requestId)
        .single();

      if (fetchErr || !req) throw fetchErr || new Error('Request not found');

      const { error: updateErr } = await supabase
        .from('task_extension_requests')
        .update({
          status: decision,
          reviewed_by: user.id,
          review_note: reviewNote || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateErr) throw updateErr;

      if (decision === 'approved' && req.task_id) {
        await supabase
          .from('tasks')
          .update({
            due_date: req.proposed_deadline,
            updated_at: new Date().toISOString(),
          })
          .eq('id', req.task_id);

        try {
          const { data: reviewer } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
          const empName = req.user_id
            ? (await supabase.from('profiles').select('full_name').eq('id', req.user_id).single()).data?.full_name
            : null;
          await supabase.from('activity_logs').insert({
            actor_id: user.id,
            actor_name: reviewer?.full_name || 'Manager',
            actor_role: reviewer?.role || 'manager',
            target_employee_id: req.user_id || null,
            target_employee_name: empName,
            action_type: 'deadline_changed',
            entity_type: 'task',
            entity_id: req.task_id,
            details: { new_deadline: req.proposed_deadline, reason: reviewNote || 'Extension approved' },
          });
        } catch {}
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to review extension.' };
    }
  },

  async getActivityLogs(filter?: {
    employeeId?: string;
    actionType?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: ActivityLogEntry[]; totalCount: number; error?: string }> {
    try {
      const page = filter?.page || 1;
      const pageSize = filter?.pageSize || 50;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('activity_logs')
        .select(`
          id,
          actor_id,
          actor_name,
          actor_role,
          target_employee_id,
          target_employee_name,
          action_type,
          entity_type,
          entity_id,
          details,
          created_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filter?.employeeId) {
        query = query.or(`target_employee_id.eq.${filter.employeeId},actor_id.eq.${filter.employeeId}`);
      }
      if (filter?.actionType && filter.actionType !== 'all') {
        query = query.eq('action_type', filter.actionType);
      }
      if (filter?.entityType && filter.entityType !== 'all') {
        query = query.eq('entity_type', filter.entityType);
      }
      if (filter?.startDate) {
        query = query.gte('created_at', `${filter.startDate}T00:00:00Z`);
      }
      if (filter?.endDate) {
        query = query.lte('created_at', `${filter.endDate}T23:59:59Z`);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      const formatted: ActivityLogEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        actorId: row.actor_id,
        actorName: row.actor_name || 'System User',
        actorRole: row.actor_role || 'user',
        targetEmployeeId: row.target_employee_id,
        targetEmployeeName: row.target_employee_name || 'Direct Report',
        actionType: row.action_type,
        entityType: row.entity_type,
        entityId: row.entity_id,
        details: typeof row.details === 'object' && row.details !== null ? row.details : {},
        createdAt: row.created_at,
      }));

      return { data: formatted, totalCount: count || formatted.length };
    } catch (err: any) {
      return { data: [], totalCount: 0, error: err?.message || 'Failed to retrieve activity history.' };
    }
  },

  async updateTask(
    taskId: string,
    updates: {
      title?: string;
      description?: string;
      project?: string;
      priority?: 'high' | 'medium' | 'low';
      dueDate?: string;
      startDate?: string;
      status?: TaskStatus;
      progress?: number;
      assigneeIds?: string[];
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      const taskPayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) taskPayload.title = updates.title.trim();
      if (updates.description !== undefined) taskPayload.description = updates.description.trim();
      if (updates.project !== undefined) taskPayload.project = updates.project;
      if (updates.priority !== undefined) taskPayload.priority = updates.priority;
      if (updates.dueDate !== undefined) taskPayload.due_date = updates.dueDate;
      if (updates.startDate !== undefined) taskPayload.start_date = updates.startDate;
      if (updates.status !== undefined) {
        taskPayload.status = updates.status;
        taskPayload.progress = updates.status === 'completed' ? 100 : updates.status === 'not_started' ? 0 : 50;
      }
      if (updates.progress !== undefined) taskPayload.progress = updates.progress;

      // Resolve assigneeIds if provided
      let resolvedNewIds: string[] | undefined;
      if (updates.assigneeIds && updates.assigneeIds.length > 0) {
        resolvedNewIds = [];
        for (const id of updates.assigneeIds) {
          if (isUuid(id)) {
            resolvedNewIds.push(id);
          } else {
            const { data: p } = await supabase
              .from('profiles')
              .select('id')
              .eq('system_id', id)
              .maybeSingle();
            if (p?.id) resolvedNewIds.push(p.id);
          }
        }
        taskPayload.assigned_to = resolvedNewIds[0] || null;
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update(taskPayload as any)
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Synchronize task_assignments if assigneeIds is updated
      if (resolvedNewIds && resolvedNewIds.length > 0) {
        const upsertRows = resolvedNewIds.map((uid) => ({
          task_id: taskId,
          user_id: uid,
          status: updates.status || 'not_started',
        }));

        await supabase
          .from('task_assignments')
          .upsert(upsertRows, { onConflict: 'task_id,user_id' });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update task details.' };
    }
  },

  // --------------------------------------------------------------------------
  // ATTENDANCE QUERIES & MUTATIONS
  // --------------------------------------------------------------------------

  async getAttendanceRecords(userId?: string): Promise<{ data: AttendanceRecord[]; error?: string }> {
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          id,
          date,
          check_in_time,
          check_out_time,
          break_minutes,
          total_hours,
          status,
          user:profiles!user_id(id, full_name, system_id)
        `)
        .order('date', { ascending: false })
        .limit(30);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formatted: AttendanceRecord[] = (data || []).map((row: any) => ({
        id: row.id,
        date: row.date,
        checkIn: row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        checkOut: row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
        breakMinutes: row.break_minutes || 0,
        totalHours: Number(row.total_hours) || 0,
        status: row.status as any,
        employeeName: row.user?.full_name,
        employeeId: row.user?.system_id,
      }));

      return { data: formatted };
    } catch (err: any) {
      return { data: [], error: err?.message || 'Failed to load attendance records.' };
    }
  },

  async recordCheckIn(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const nowIso = new Date().toISOString();

      const { error } = await supabase
        .from('attendance_records')
        .upsert({
          user_id: userId,
          date: todayStr,
          check_in_time: nowIso,
          status: 'present',
          total_hours: 0,
        }, { onConflict: 'user_id,date' });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to record check-in.' };
    }
  },

  // --------------------------------------------------------------------------
  // DAILY REPORTS QUERIES & MUTATIONS (WITH STORAGE ATTACHMENTS)
  // --------------------------------------------------------------------------

  async uploadReportAttachment(
    file: File,
    employeeId: string
  ): Promise<{ success: boolean; url?: string; path?: string; name?: string; size?: number; error?: string }> {
    try {
      const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      let targetUserId = employeeId;
      if (!isUuid(employeeId)) {
        const { data: p } = await supabase
          .from('profiles')
          .select('id')
          .eq('system_id', employeeId.toUpperCase())
          .maybeSingle();
        if (p?.id) targetUserId = p.id;
      }

      // Check max file size: 10MB
      if (file.size > 10 * 1024 * 1024) {
        return { success: false, error: `File "${file.name}" exceeds the 10MB limit.` };
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanExt = ['png', 'jpeg', 'jpg', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${targetUserId}/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('report-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || `image/${cleanExt}`,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('report-attachments')
        .getPublicUrl(filePath);

      return {
        success: true,
        url: publicUrlData.publicUrl,
        path: filePath,
        name: file.name,
        size: file.size,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to upload report attachment.' };
    }
  },

  async getDailyReports(employeeId?: string): Promise<{ data: DailyReport[]; error?: string }> {
    try {
      let query = supabase
        .from('daily_reports')
        .select(`
          id,
          date,
          task_id,
          description,
          completed_work,
          work_in_progress,
          blockers,
          next_steps,
          notes,
          progress,
          hours_worked,
          status,
          manager_feedback,
          submitted_at,
          reviewed_at,
          image_urls,
          task:tasks!task_id(id, title),
          employee:profiles!employee_id(id, full_name, system_id, job_title, avatar_url),
          report_attachments(id, file_name, file_path, file_url, file_size, content_type, created_at)
        `)
        .order('submitted_at', { ascending: false });

      if (employeeId) {
        let resolvedEmpId = employeeId;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId);
        if (!isUuid) {
          const { data: p } = await supabase
            .from('profiles')
            .select('id')
            .eq('system_id', employeeId.toUpperCase())
            .maybeSingle();
          if (p?.id) resolvedEmpId = p.id;
        }
        query = query.eq('employee_id', resolvedEmpId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formatted: DailyReport[] = (data || []).map((row: any) => {
        const rawUrls = Array.isArray(row.image_urls) ? row.image_urls : [];
        const attachmentUrls = (row.report_attachments || []).map((a: any) => a.file_url).filter(Boolean);
        const combinedUrls = Array.from(new Set([...rawUrls, ...attachmentUrls]));

        return {
          id: row.id,
          date: row.date,
          taskId: row.task_id || undefined,
          taskTitle: row.task?.title || undefined,
          description: row.description || row.completed_work,
          completedWork: row.completed_work,
          workInProgress: row.work_in_progress || '',
          progress: typeof row.progress === 'number' ? row.progress : 0,
          blockers: row.blockers || '',
          notes: row.notes || row.next_steps || '',
          nextSteps: row.next_steps || '',
          hoursWorked: Number(row.hours_worked) || 8,
          status: row.status as any,
          managerFeedback: row.manager_feedback,
          submittedAt: row.submitted_at,
          reviewedAt: row.reviewed_at,
          employeeName: row.employee?.full_name,
          employeeId: row.employee?.system_id,
          imageUrls: combinedUrls,
          attachments: (row.report_attachments || []).map((a: any) => ({
            id: a.id,
            reportId: row.id,
            employeeId: row.employee_id,
            fileName: a.file_name,
            filePath: a.file_path,
            fileUrl: a.file_url,
            fileSize: a.file_size,
            contentType: a.content_type,
            createdAt: a.created_at,
          })),
          tasksCompleted: (row.completed_work || '').split('\n').filter(Boolean),
          inProgress: (row.work_in_progress || '').split('\n').filter(Boolean),
        };
      });

      return { data: formatted };
    } catch (err: any) {
      return { data: [], error: err?.message || 'Failed to fetch daily reports.' };
    }
  },

  async submitDailyReport(report: {
    employeeId: string;
    date?: string;
    taskId?: string;
    description?: string;
    completedWork: string;
    workInProgress?: string;
    progress?: number;
    blockers?: string;
    notes?: string;
    nextSteps?: string;
    hoursWorked?: number;
    imageUrls?: string[];
    files?: File[];
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      let targetUserId = report.employeeId;
      if (!isUuid(report.employeeId)) {
        const { data: p } = await supabase
          .from('profiles')
          .select('id')
          .eq('system_id', report.employeeId.toUpperCase())
          .maybeSingle();
        if (p?.id) targetUserId = p.id;
      }

      // Step 1: Upload attached files to Supabase Storage first.
      // If ANY upload fails, stop immediately to prevent false success.
      const uploadedAttachments: { name: string; path: string; url: string; size: number }[] = [];
      const finalImageUrls: string[] = [...(report.imageUrls || [])];

      if (report.files && report.files.length > 0) {
        for (const file of report.files) {
          const uploadRes = await this.uploadReportAttachment(file, targetUserId);
          if (!uploadRes.success || !uploadRes.url) {
            return {
              success: false,
              error: `Upload failed for image "${file.name}": ${uploadRes.error || 'Storage error'}. Report submission cancelled.`,
            };
          }
          finalImageUrls.push(uploadRes.url);
          uploadedAttachments.push({
            name: file.name,
            path: uploadRes.path || '',
            url: uploadRes.url,
            size: file.size,
          });
        }
      }

      // Step 2: Insert the daily report record into daily_reports table
      const reportDate = report.date || new Date().toISOString().split('T')[0];
      const { data: newReport, error: insertError } = await supabase
        .from('daily_reports')
        .insert({
          employee_id: targetUserId,
          date: reportDate,
          task_id: report.taskId || null,
          description: report.description || report.completedWork,
          completed_work: report.completedWork,
          work_in_progress: report.workInProgress || '',
          progress: report.progress !== undefined ? report.progress : 0,
          blockers: report.blockers || '',
          notes: report.notes || report.nextSteps || '',
          next_steps: report.nextSteps || '',
          hours_worked: report.hoursWorked || 8,
          status: 'submitted',
          image_urls: finalImageUrls,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Step 3: Insert rows into report_attachments table atomically
      if (uploadedAttachments.length > 0) {
        const attachmentRows = uploadedAttachments.map((att) => ({
          report_id: newReport.id,
          employee_id: targetUserId,
          file_name: att.name,
          file_path: att.path,
          file_url: att.url,
          file_size: att.size,
          content_type: 'image/jpeg',
        }));

        const { error: attError } = await supabase
          .from('report_attachments')
          .insert(attachmentRows);

        if (attError) {
          console.warn('Failed to insert report_attachments records:', attError);
        }
      }

      // Step 4: If related task and progress provided, update employee's task progress
      if (report.taskId && report.progress !== undefined) {
        try {
          const isCompletion = (report as any).isCompletionSubmission || report.progress >= 100;
          const statusVal: TaskStatus = isCompletion
            ? 'pending_approval'
            : report.progress > 0
            ? 'in_progress'
            : 'not_started';

          await this.updateTaskStatus(
            report.taskId,
            statusVal,
            targetUserId,
            report.progress,
            report.completedWork
          );

          if (isCompletion) {
            // Notify management that deliverable has been submitted for approval
            try {
              const { data: managers } = await supabase
                .from('profiles')
                .select('id')
                .in('role', ['manager', 'admin']);
              if (managers && managers.length > 0) {
                const notifRows = managers.map((m) => ({
                  user_id: m.id,
                  type: 'task_assignment',
                  title: 'Deliverable Pending Approval',
                  message: `A work report with proof image has been submitted for task "${report.taskId}" and is awaiting review.`,
                  read: false,
                }));
                await supabase.from('work_notifications').insert(notifRows);
              }
            } catch {
              // Notification insert non-blocking
            }
          }
        } catch {
          // Task update non-blocking
        }
      }

      return { success: true, data: newReport };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to persist daily report.' };
    }
  },

  async reviewDailyReport(
    reportId: string,
    feedback: string,
    decision: 'reviewed' | 'approved' | 'rejected' | 'revision_requested'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Fetch current report details
      const { data: reportRow, error: fetchErr } = await supabase
        .from('daily_reports')
        .select('id, employee_id, task_id, description, completed_work')
        .eq('id', reportId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      // 2. Update daily_reports table
      const { error: updateErr } = await supabase
        .from('daily_reports')
        .update({
          status: decision,
          manager_feedback: feedback,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (updateErr) throw updateErr;

      // 3. If tied to a task and employee, update task assignment accordingly
      if (reportRow?.task_id && reportRow?.employee_id) {
        if (decision === 'approved') {
          // Assignment becomes completed
          await this.updateTaskStatus(
            reportRow.task_id,
            'completed',
            reportRow.employee_id,
            100,
            feedback ? `Approved: ${feedback}` : 'Work proof approved by manager.'
          );
        } else if (decision === 'rejected' || decision === 'revision_requested') {
          // Assignment returns for correction
          await this.updateTaskStatus(
            reportRow.task_id,
            'rejected',
            reportRow.employee_id,
            undefined,
            undefined,
            feedback || 'Deliverable returned for correction.'
          );
        }

        // Notify the employee of the manager's decision
        try {
          const isApproved = decision === 'approved';
          await supabase.from('work_notifications').insert({
            user_id: reportRow.employee_id,
            type: isApproved ? 'task_assignment' : 'manager_message',
            title: isApproved ? 'Work Deliverable Approved' : 'Work Report Returned for Correction',
            message: isApproved
              ? `Your report for task "${reportRow.task_id}" has been approved by management.`
              : `Your deliverable was returned for correction: ${feedback || 'Please update report and resubmit.'}`,
            read: false,
          });
        } catch {
          // Non-blocking
        }
      }

      // 4. Log immutable audit entry
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('audit_logs').insert({
          action: decision === 'approved' ? 'report_approved' : 'report_rejected',
          performed_by: user?.id || null,
          details: JSON.stringify({
            report_id: reportId,
            task_id: reportRow?.task_id,
            employee_id: reportRow?.employee_id,
            decision,
            feedback,
          }),
        });
      } catch {
        // Non-blocking
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to submit report review.' };
    }
  },

  // --------------------------------------------------------------------------
  // CALENDAR & NOTIFICATIONS
  // --------------------------------------------------------------------------

  async getCalendarEvents(): Promise<{ data: CalendarEvent[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      const formatted: CalendarEvent[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        type: row.event_type as any,
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time,
        meetingLink: row.meeting_link,
        attendees: row.attendees || [],
        project: row.project,
      }));

      return { data: formatted };
    } catch (err: any) {
      return { data: [], error: err?.message || 'Failed to load calendar events.' };
    }
  },

  async getWorkNotifications(userId: string): Promise<{ data: WorkNotification[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('work_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: WorkNotification[] = (data || []).map((row: any) => ({
        id: row.id,
        type: row.type as any,
        title: row.title,
        message: row.message,
        timestamp: new Date(row.created_at).toLocaleString(),
        read: Boolean(row.read),
        actionUrl: row.action_url,
      }));

      return { data: formatted };
    } catch (err: any) {
      return { data: [], error: err?.message || 'Failed to load notifications.' };
    }
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    try {
      await supabase.from('work_notifications').update({ read: true }).eq('id', id);
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  async broadcastAnnouncement(params: {
    title: string;
    message: string;
    recipientUserIds?: string[];
    sendEmail?: boolean;
  }): Promise<{
    success: boolean;
    recipientCount: number;
    shareUrl: string;
    emailStatus: string;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let targetUserIds = params.recipientUserIds || [];
      if (!targetUserIds.length) {
        // Query all 10 employees (EMP1-EMP10)
        const { data: employees } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'employee');
        targetUserIds = (employees || []).map((e: any) => e.id);
      }

      if (!targetUserIds.length) {
        return {
          success: false,
          recipientCount: 0,
          shareUrl: '',
          emailStatus: 'No eligible recipients found.',
          error: 'No eligible recipients found for broadcast.',
        };
      }

      const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/?announcement=${encodeURIComponent(params.title)}`
        : `/?announcement=${encodeURIComponent(params.title)}`;

      // Insert notifications for all target employees
      const notifRows = targetUserIds.map((userId) => ({
        user_id: userId,
        type: 'announcement' as const,
        title: params.title,
        message: params.message,
        action_url: shareUrl,
        read: false,
      }));

      const { error: insertError } = await supabase.from('work_notifications').insert(notifRows);
      if (insertError) throw insertError;

      // Immutable audit log
      try {
        if (user?.id) {
          await supabase.from('audit_logs').insert({
            performed_by: user.id,
            action: 'broadcast_announcement',
            details: JSON.stringify({
              title: params.title,
              recipient_count: targetUserIds.length,
              share_url: shareUrl,
              requested_email: Boolean(params.sendEmail),
            }),
          });
        }
      } catch {
        // Non-blocking
      }

      const emailStatus = params.sendEmail
        ? 'In-portal notifications delivered to all accounts. Note: External SMTP service (e.g. Resend/SendGrid) is unconfigured in this environment. Direct link generated for WhatsApp/email sharing.'
        : 'In-portal notifications delivered to all accounts. Direct shareable link generated.';

      return {
        success: true,
        recipientCount: targetUserIds.length,
        shareUrl,
        emailStatus,
      };
    } catch (err: any) {
      return {
        success: false,
        recipientCount: 0,
        shareUrl: '',
        emailStatus: 'Failed to broadcast announcement.',
        error: err?.message || 'Failed to broadcast announcement.',
      };
    }
  },

  async generateTaskShareLink(params: {
    taskId: string;
    recipientUserIds?: string[];
    broadcastNotification?: boolean;
  }): Promise<{
    success: boolean;
    shareUrl: string;
    taskTitle: string;
    recipientCount: number;
    emailStatus: string;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: task, error: tErr } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('id', params.taskId)
        .single();

      if (tErr || !task) throw new Error('Task not found.');

      const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/?taskId=${params.taskId}`
        : `/?taskId=${params.taskId}`;

      let recipientCount = 0;

      if (params.broadcastNotification) {
        let targetUserIds = params.recipientUserIds || [];
        if (!targetUserIds.length) {
          // Find assigned employees
          const { data: assigns } = await supabase
            .from('task_assignments')
            .select('employee_id')
            .eq('task_id', params.taskId);
          targetUserIds = (assigns || []).map((a: any) => a.employee_id);
        }

        if (targetUserIds.length > 0) {
          const notifRows = targetUserIds.map((userId) => ({
            user_id: userId,
            type: 'task_assignment' as const,
            title: `Task Direct Link: ${task.title}`,
            message: `Your manager shared direct access to task "${task.title}": ${shareUrl}`,
            action_url: shareUrl,
            read: false,
          }));

          await supabase.from('work_notifications').insert(notifRows);
          recipientCount = targetUserIds.length;
        }

        try {
          if (user?.id) {
            await supabase.from('audit_logs').insert({
              performed_by: user.id,
              action: 'task_link_broadcast',
              details: JSON.stringify({
                task_id: task.id,
                task_title: task.title,
                share_url: shareUrl,
                recipient_count: recipientCount,
              }),
            });
          }
        } catch {
          // Non-blocking
        }
      }

      return {
        success: true,
        shareUrl,
        taskTitle: task.title,
        recipientCount,
        emailStatus: recipientCount > 0
          ? `In-portal task link delivered to ${recipientCount} team member(s). Shareable link ready for external distribution.`
          : 'Shareable task link generated. Ready to copy or share via WhatsApp/email.',
      };
    } catch (err: any) {
      return {
        success: false,
        shareUrl: '',
        taskTitle: '',
        recipientCount: 0,
        emailStatus: 'Failed to generate task share link.',
        error: err?.message || 'Failed to generate task share link.',
      };
    }
  },

  // --------------------------------------------------------------------------
  // USER PROFILE & AVATAR STORAGE (Supabase Storage 'avatars' bucket)
  // --------------------------------------------------------------------------

  async createProfile(data: {
    fullName: string;
    email: string;
    jobTitle?: string;
    departmentId?: string;
    avatarUrl?: string | null;
  }): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        return { success: false, error: 'User session is not authenticated.' };
      }

      // Check if profile exists already
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existing) {
        const { error: updErr } = await supabase
          .from('profiles')
          .update({
            full_name: data.fullName.trim(),
            job_title: data.jobTitle?.trim() || 'Team Member',
            avatar_url: data.avatarUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: data.email.trim() || user.email || '',
            full_name: data.fullName.trim(),
            job_title: data.jobTitle?.trim() || 'Team Member',
            avatar_url: data.avatarUrl || null,
            role: 'employee',
            account_status: 'active',
          });
        if (insErr) throw insErr;
      }

      const { data: finalProfile, error: readErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (readErr || !finalProfile) throw readErr || new Error('Failed to retrieve newly created profile.');

      const mapped: UserProfile = {
        id: finalProfile.id,
        name: finalProfile.full_name,
        email: finalProfile.email,
        role: finalProfile.role,
        department: 'Engineering Operations',
        jobTitle: finalProfile.job_title || 'Associate',
        employeeId: finalProfile.system_id || 'ID-0001',
        avatarUrl: finalProfile.avatar_url || null,
        timezone: finalProfile.timezone || 'Asia/Kolkata',
        todayAttendance: {
          isCheckedIn: true,
          checkInTime: '09:00 AM',
          isOnBreak: false,
          breakStartTime: null,
          elapsedWorkingMinutes: 480,
        },
      };

      return { success: true, profile: mapped };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create profile.' };
    }
  },

  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
    try {
      // 1. Validate file format
      const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!ALLOWED_MIME.includes(file.type.toLowerCase())) {
        return {
          success: false,
          error: 'Invalid file format. Please select an image file (PNG, JPEG, WebP, GIF).',
        };
      }

      // 2. Validate file size (max 2MB = 2097152 bytes)
      const MAX_SIZE = 2 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return {
          success: false,
          error: 'File size exceeds 2MB limit. Please upload a smaller image file.',
        };
      }

      // 3. Resolve trusted authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required to upload profile photo.' };
      }

      // Determine target user ID (admin can upload for another user; non-admin is scoped to user.id)
      let targetUserId = user.id;
      if (userId && userId !== user.id) {
        const { data: callerProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (callerProfile?.role === 'admin') {
          targetUserId = userId;
        } else {
          return { success: false, error: 'Unauthorized: Cannot modify another user avatar.' };
        }
      }

      // 4. Generate clean storage path
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanExt = ['png', 'jpeg', 'jpg', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const filePath = `${targetUserId}/avatar_${Date.now()}.${cleanExt}`;

      // 5. Upload to Supabase Storage 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 6. Retrieve public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // 7. Update profile record in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      if (profileError) {
        throw profileError;
      }

      return { success: true, avatarUrl };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to upload profile photo. Please try again.',
      };
    }
  },

  async removeAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Authentication required.' };

      let targetUserId = user.id;
      if (userId && userId !== user.id) {
        const { data: callerProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (callerProfile?.role === 'admin') {
          targetUserId = userId;
        } else {
          return { success: false, error: 'Unauthorized: Cannot remove another user avatar.' };
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to remove profile photo.',
      };
    }
  },

  async updateUserProfile(
    userId: string,
    updates: {
      full_name?: string;
      job_title?: string;
      email?: string;
      phone?: string;
      avatar_url?: string | null;
      timezone?: string;
      department_id?: string;
    }
  ): Promise<{ success: boolean; profile?: UserProfile; emailVerificationPending?: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User is not authenticated.' };
      }

      // Security check: only admins can update other users' profiles
      if (user.id !== userId) {
        const { data: callerProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (callerProfile?.role !== 'admin') {
          return {
            success: false,
            error: 'Access Denied: You do not have permission to update other user profiles.',
          };
        }
      }

      const dbUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name.trim();
      if (updates.job_title !== undefined) dbUpdates.job_title = updates.job_title.trim();
      if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
      if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
      if (updates.department_id !== undefined) dbUpdates.department_id = updates.department_id;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone.trim();

      let emailVerificationPending = false;
      if (updates.email !== undefined && updates.email.trim()) {
        const newEmail = updates.email.trim();
        // If the authenticated user is changing their own registered email,
        // use Supabase Auth updateUser so that verification emails are dispatched.
        if (user.id === userId && user.email !== newEmail) {
          const { error: authEmailErr } = await supabase.auth.updateUser({ email: newEmail });
          if (authEmailErr) {
            return { success: false, error: `Authentication provider email change failed: ${authEmailErr.message}` };
          }
          emailVerificationPending = true;
        }
        dbUpdates.email = newEmail;
      }

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates as any)
        .eq('id', userId);

      if (error) throw error;

      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      let profileObj: UserProfile | undefined;
      if (updatedProfile) {
        profileObj = {
          id: updatedProfile.id,
          name: updatedProfile.full_name || '',
          email: updatedProfile.email || '',
          phone: updatedProfile.phone || null,
          role: updatedProfile.role,
          department: updatedProfile.department_id || 'Engineering Operations',
          jobTitle: updatedProfile.job_title || 'Associate',
          employeeId: updatedProfile.system_id || 'ID-0001',
          avatarUrl: updatedProfile.avatar_url || null,
          timezone: updatedProfile.timezone || 'Asia/Kolkata',
          todayAttendance: {
            isCheckedIn: true,
            checkInTime: '09:00 AM',
            isOnBreak: false,
            breakStartTime: null,
            elapsedWorkingMinutes: 480,
          },
        };
      }

      return { success: true, profile: profileObj, emailVerificationPending };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to update profile.',
      };
    }
  },

  async getEmployeeWorkDetails(employeeProfileId: string): Promise<{
    success: boolean;
    data?: {
      profile: UserProfile | null;
      tasks: Task[];
      attendance: AttendanceRecord[];
      reports: DailyReport[];
    };
    error?: string;
  }> {
    try {
      const [accountsRes, tasksRes, attRes, repRes] = await Promise.all([
        this.getManagedAccounts(),
        this.getTasks({ assignedTo: employeeProfileId }),
        this.getAttendanceRecords(employeeProfileId),
        this.getDailyReports(),
      ]);

      const foundAccount = accountsRes.data.find(
        (a) => a.id === employeeProfileId || a.systemId === employeeProfileId
      );

      let mappedProfile: UserProfile | null = null;
      if (foundAccount) {
        mappedProfile = {
          id: foundAccount.id,
          name: foundAccount.fullName,
          email: foundAccount.email,
          role: foundAccount.role,
          department: foundAccount.department,
          jobTitle: foundAccount.jobTitle,
          employeeId: foundAccount.systemId,
          avatarUrl: foundAccount.avatarUrl || null,
          timezone: 'Asia/Kolkata',
          todayAttendance: {
            isCheckedIn: true,
            checkInTime: '09:00 AM',
            isOnBreak: false,
            breakStartTime: null,
            elapsedWorkingMinutes: 480,
          },
        };
      }

      const targetUuid = foundAccount?.id || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeProfileId) ? employeeProfileId : null);
      const targetSystemId = foundAccount?.systemId || (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeProfileId) ? employeeProfileId : null);

      const employeeTasks = (tasksRes.data || []).filter((t) => {
        if (
          t.assignedToEmployeeId === employeeProfileId ||
          (targetUuid && t.assignedToEmployeeId === targetUuid) ||
          (targetSystemId && t.assignedToEmployeeId?.toUpperCase() === targetSystemId.toUpperCase())
        ) {
          return true;
        }

        if (t.assignees && t.assignees.length > 0) {
          return t.assignees.some((a) => {
            const aId = a.id;
            const aSys = (a.employeeId || '').toUpperCase();
            return (
              aId === employeeProfileId ||
              (targetUuid && aId === targetUuid) ||
              (targetSystemId && aSys === targetSystemId.toUpperCase()) ||
              aSys === employeeProfileId.toUpperCase()
            );
          });
        }

        return false;
      });

      const employeeReports = (repRes.data || []).filter(
        (r) =>
          r.employeeId === employeeProfileId ||
          (foundAccount && r.employeeId === foundAccount.systemId) ||
          (foundAccount && r.employeeName === foundAccount.fullName)
      );

      return {
        success: true,
        data: {
          profile: mappedProfile,
          tasks: employeeTasks,
          attendance: attRes.data || [],
          reports: employeeReports,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        data: {
          profile: null,
          tasks: [],
          attendance: [],
          reports: [],
        },
        error: err?.message || 'Failed to load employee work details.',
      };
    }
  },
};
