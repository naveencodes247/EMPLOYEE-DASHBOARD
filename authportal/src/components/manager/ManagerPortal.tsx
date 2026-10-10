import React, { useState, useEffect, useCallback } from 'react';
import { PortalLayout } from '../layout/PortalLayout';
import { ManagerOverview } from './ManagerOverview';
import { ManagerTeam } from './ManagerTeam';
import { ManagerTasks } from './ManagerTasks';
import { ManagerAttendance } from './ManagerAttendance';
import { ManagerDailyReports } from './ManagerDailyReports';
import { ManagerCalendar } from './ManagerCalendar';
import { ManagerMessages } from './ManagerMessages';
import { ManagerAnalytics } from './ManagerAnalytics';
import { ManagerProfileSettings } from './ManagerProfileSettings';
import { CreateProfileCard } from '../profile/CreateProfileCard';
import { EmployeeWorkProfileModal } from '../profile/EmployeeWorkProfileModal';
import { portalApi } from '../../services/portalApi';
import { supabase } from '../../lib/supabase';
import type {
  ManagerTab,
  Task,
  DailyReport,
  CalendarEvent,
  WorkNotification,
  PortalRole,
  UserProfile,
  AccountApprovalRequest,
  TeamMember,
  LeaveRequest,
  LeaveStatus,
  AttendanceRecord,
} from '../../types/work';
import type { BrandConfig } from '../../types/auth';

interface ManagerPortalProps {
  brandConfig: BrandConfig;
  currentUserProfile?: UserProfile;
  onSignOut: () => void;
  onSelectRole?: (role: PortalRole) => void;
  approvalRequests?: AccountApprovalRequest[];
  onUpdateApprovalRequests?: React.Dispatch<React.SetStateAction<AccountApprovalRequest[]>>;
  onUpdateUserProfile?: (updated: Partial<UserProfile>) => void;
}

export const ManagerPortal: React.FC<ManagerPortalProps> = ({
  brandConfig,
  currentUserProfile,
  onSignOut,
  onSelectRole,
  onUpdateUserProfile,
}) => {
  const [activeTab, setActiveTab] = useState<ManagerTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real backend states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<AccountApprovalRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [unprovisionedUser, setUnprovisionedUser] = useState<{ email: string; systemId: string } | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<WorkNotification[]>([]);
  const [preselectedAssignee, setPreselectedAssignee] = useState<{ employeeId: string; employeeName: string } | null>(null);
  const [inspectEmployeeId, setInspectEmployeeId] = useState<string | null>(null);

  // Authenticated Manager Profile
  const [managerProfile, setManagerProfile] = useState<UserProfile>(() => {
    if (currentUserProfile) {
      return {
        ...currentUserProfile,
        role: 'manager',
        todayAttendance: currentUserProfile.todayAttendance || {
          isCheckedIn: true,
          checkInTime: '09:00 AM',
          isOnBreak: false,
          breakStartTime: null,
          elapsedWorkingMinutes: 480,
        },
      };
    }
    return {
      id: '',
      name: 'Manager',
      email: '',
      role: 'manager' as PortalRole,
      department: 'Engineering Operations',
      jobTitle: 'Engineering Manager',
      employeeId: 'MAN01',
      avatarUrl: null,
      timezone: 'Asia/Kolkata',
      todayAttendance: {
        isCheckedIn: true,
        checkInTime: '09:00 AM',
        isOnBreak: false,
        breakStartTime: null,
        elapsedWorkingMinutes: 480,
      },
    };
  });

  useEffect(() => {
    if (currentUserProfile) {
      setManagerProfile((prev) => ({
        ...prev,
        ...currentUserProfile,
      }));
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data: prof }) => {
            if (prof) {
              setManagerProfile({
                id: prof.id,
                name: prof.full_name || 'Manager',
                email: prof.email || user.email || '',
                role: 'manager',
                department: prof.department_id || 'Engineering Operations',
                jobTitle: prof.job_title || 'Engineering Manager',
                employeeId: prof.system_id || 'MAN01',
                avatarUrl: prof.avatar_url || null,
                timezone: prof.timezone || 'Asia/Kolkata',
                todayAttendance: {
                  isCheckedIn: true,
                  checkInTime: '09:00 AM',
                  isOnBreak: false,
                  breakStartTime: null,
                  elapsedWorkingMinutes: 480,
                },
              });
            } else {
              setUnprovisionedUser({
                email: user.email || '',
                systemId: user.user_metadata?.employee_id || user.user_metadata?.system_id || 'MAN01',
              });
            }
          });
      });
    }
  }, [currentUserProfile]);

  // Deep linking via query parameters (?taskId=... or ?announcement=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('taskId')) {
        setActiveTab('tasks');
      } else if (params.get('announcement')) {
        setActiveTab('messages');
      }
    }
  }, []);

  // Sync real data from Supabase
  const loadPortalData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [
        accountsRes,
        tasksRes,
        reportsRes,
        calendarRes,
        attendanceRes,
        approvalsRes,
      ] = await Promise.all([
        portalApi.getManagedAccounts(),
        portalApi.getTasks(),
        portalApi.getDailyReports(),
        portalApi.getCalendarEvents(),
        portalApi.getAttendanceRecords(),
        portalApi.getAdminApprovalRequests(),
      ]);

      if (accountsRes.data) {
        const staff = accountsRes.data
          .filter((a) => a.role === 'employee')
          .map((a) => ({
            id: a.id,
            employeeId: a.systemId,
            fullName: a.fullName,
            email: a.email,
            jobTitle: a.jobTitle,
            department: a.department,
            avatarUrl: a.avatarUrl || null,
            status: a.status as any,
            activeTasksCount: (tasksRes.data || []).filter(
              (t) =>
                (t.assignedToEmployeeId === a.id ||
                  t.assignedToEmployeeId === a.systemId ||
                  (t.assignees &&
                    t.assignees.some(
                      (assignee) =>
                        assignee.id === a.id ||
                        assignee.employeeId === a.systemId ||
                        assignee.id === a.systemId
                    ))) &&
                t.status !== 'completed'
            ).length,
            completedTasksCount: (tasksRes.data || []).filter(
              (t) =>
                (t.assignedToEmployeeId === a.id ||
                  t.assignedToEmployeeId === a.systemId ||
                  (t.assignees &&
                    t.assignees.some(
                      (assignee) =>
                        assignee.id === a.id ||
                        assignee.employeeId === a.systemId ||
                        assignee.id === a.systemId
                    ))) &&
                t.status === 'completed'
            ).length,
            attendanceToday: {
              status: 'present' as const,
              checkInTime: '09:00 AM',
              hoursWorked: 8,
            },
          }));
        setTeamMembers(staff);
      }

      if (tasksRes.data) setTasks(tasksRes.data);
      if (reportsRes.data) setDailyReports(reportsRes.data);
      if (calendarRes.data) setCalendarEvents(calendarRes.data);
      if (attendanceRes.data) setAttendanceRecords(attendanceRes.data);
      if (approvalsRes.data) {
        setApprovalRequests(approvalsRes.data.filter((r) => r.requestedRole === 'employee'));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sync with Supabase backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortalData();

    const channel = supabase
      .channel('manager-portal-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadPortalData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignments' }, () => {
        loadPortalData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_reports' }, () => {
        loadPortalData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPortalData]);

  // Real backend connected approve handler for Manager
  const handleApproveEmployee = async (requestId: string, reason: string = 'Authorized by Department Manager') => {
    const res = await portalApi.approveAccountRequest(requestId, reason);
    if (res.success) {
      await loadPortalData();
    } else {
      alert(`Approval error: ${res.error}`);
    }
  };

  const handleRejectEmployee = async (requestId: string, reason: string = 'Rejected by Manager') => {
    const res = await portalApi.rejectAccountRequest(requestId, reason);
    if (res.success) {
      await loadPortalData();
    } else {
      alert(`Rejection error: ${res.error}`);
    }
  };

  const handleCreateTask = async (newTaskData: Omit<Task, 'id'> & { assigneeIds?: string[] }) => {
    const assigneeIds = newTaskData.assigneeIds && newTaskData.assigneeIds.length > 0
      ? newTaskData.assigneeIds
      : newTaskData.assignees && newTaskData.assignees.length > 0
      ? newTaskData.assignees.map((a) => a.id)
      : newTaskData.assignedToEmployeeId
      ? [newTaskData.assignedToEmployeeId]
      : [];

    const res = await portalApi.createTask({
      title: newTaskData.title,
      description: newTaskData.description,
      project: newTaskData.project,
      priority: newTaskData.priority,
      dueDate: newTaskData.dueDate,
      startDate: newTaskData.startDate,
      status: newTaskData.status,
      assignedTo: assigneeIds[0],
      assigneeIds,
      createdBy: managerProfile.id,
    });
    if (res.success) {
      await loadPortalData();
    }
    return res;
  };

  const handleReviewExtension = async (requestId: string, decision: 'approved' | 'rejected', note?: string) => {
    const res = await portalApi.reviewTaskExtension(requestId, decision, note);
    if (res.success) {
      await loadPortalData();
    } else {
      alert(`Extension review error: ${res.error}`);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task> & { assigneeIds?: string[] }) => {
    const res = await portalApi.updateTask(taskId, {
      title: updates.title,
      description: updates.description,
      project: updates.project,
      priority: updates.priority,
      dueDate: updates.dueDate,
      startDate: updates.startDate,
      status: updates.status,
      progress: updates.progress,
      assigneeIds: updates.assigneeIds || (updates.assignees ? updates.assignees.map((a) => a.id) : undefined),
    });
    if (res.success) {
      await loadPortalData();
    } else {
      alert(`Task update error: ${res.error}`);
    }
  };

  const pendingApprovalsCount = approvalRequests.filter(
    (a) => a.requestedRole === 'employee' && a.status === 'pending'
  ).length;

  if (unprovisionedUser) {
    return (
      <PortalLayout
        role="manager"
        brandConfig={brandConfig}
        user={{
          name: 'New Manager',
          roleTitle: 'Manager',
          email: unprovisionedUser.email,
        }}
        activeTab="profile"
        onTabChange={() => {}}
        onSignOut={onSignOut}
        onSelectRole={onSelectRole || (() => {})}
        headerTitle="Manager Portal"
        headerSubtitle="Profile Activation & Setup"
      >
        <CreateProfileCard
          userEmail={unprovisionedUser.email}
          employeeId={unprovisionedUser.systemId}
          initialRole="manager"
          onProfileCreated={(newProfile) => {
            setManagerProfile(newProfile);
            setUnprovisionedUser(null);
            if (onUpdateUserProfile) {
              onUpdateUserProfile(newProfile);
            }
          }}
        />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      role="manager"
      brandConfig={brandConfig}
      user={{
        name: managerProfile.name,
        roleTitle: 'Manager',
        email: managerProfile.email,
      }}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSignOut={onSignOut}
      onSelectRole={onSelectRole}
      headerTitle="Manager Operations Dashboard"
      headerSubtitle="Team coordination, deliverable triage, and personnel management"
      searchPlaceholder="Search employees, tasks, reports..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      unreadNotificationsCount={pendingApprovalsCount}
    >
      {errorMessage && (
        <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={loadPortalData}
            className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 font-semibold cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#C5A059] border-t-transparent animate-spin" />
          <p className="text-xs text-neutral-400 font-medium">Synchronizing department data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <ManagerOverview
              userProfile={managerProfile}
              teamMembers={teamMembers}
              tasks={tasks}
              dailyReports={dailyReports}
              approvalRequests={approvalRequests}
              attendanceRecords={attendanceRecords}
              onNavigateTab={setActiveTab}
              onApproveRequest={handleApproveEmployee}
              onRejectRequest={handleRejectEmployee}
            />
          )}



          {activeTab === 'team' && (
            <ManagerTeam
              teamMembers={teamMembers}
              tasks={tasks}
              onAssignTaskToMember={(empId, empName) => {
                setPreselectedAssignee({ employeeId: empId, employeeName: empName });
                setActiveTab('tasks');
                setIsAssignModalOpen(true);
              }}
            />
          )}

          {activeTab === 'tasks' && (
            <ManagerTasks
              tasks={tasks}
              teamMembers={teamMembers}
              isAssignModalOpen={isAssignModalOpen}
              onOpenAssignModal={() => setIsAssignModalOpen(true)}
              onCloseAssignModal={() => {
                setIsAssignModalOpen(false);
                setPreselectedAssignee(null);
              }}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onReviewExtension={handleReviewExtension}
              preselectedAssignee={preselectedAssignee}
              managerName={managerProfile.name}
            />
          )}

          {activeTab === 'attendance' && (
            <ManagerAttendance
              teamMembers={teamMembers}
              leaveRequests={leaveRequests}
              onReviewLeaveRequest={(requestId: string, status: LeaveStatus, note?: string) => {
                setLeaveRequests((prev) =>
                  prev.map((lr) => (lr.id === requestId ? { ...lr, status, reviewNote: note } : lr))
                );
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ManagerDailyReports
              dailyReports={dailyReports}
              teamMembers={teamMembers}
              onReviewReport={async (reportId: string, feedback: string, decision: 'approved' | 'rejected' | 'reviewed') => {
                await portalApi.reviewDailyReport(reportId, feedback, decision);
                await loadPortalData();
              }}
              onSelectEmployee={(empId) => setInspectEmployeeId(empId)}
            />
          )}

          {activeTab === 'calendar' && (
            <ManagerCalendar
              events={calendarEvents}
              teamMembers={teamMembers}
              onAddEvent={(e: CalendarEvent) => setCalendarEvents((prev) => [e, ...prev])}
            />
          )}

          {activeTab === 'messages' && (
            <ManagerMessages
              notifications={notifications}
              tasks={tasks}
              teamMembers={teamMembers}
              onBroadcastAnnouncement={(title: string, msg: string) => {
                const notif: WorkNotification = {
                  id: `notif-${Date.now()}`,
                  type: 'announcement',
                  title,
                  message: msg,
                  timestamp: 'Just now',
                  read: false,
                };
                setNotifications((prev) => [notif, ...prev]);
              }}
              onRefresh={loadPortalData}
            />
          )}

          {activeTab === 'analytics' && (
            <ManagerAnalytics
              tasks={tasks}
              teamMembers={teamMembers}
              leaveRequests={leaveRequests}
              dailyReports={dailyReports}
            />
          )}

          {activeTab === 'profile' && (
            <ManagerProfileSettings
              userProfile={managerProfile}
              onUpdateProfile={(updated) => {
                setManagerProfile((prev) => ({ ...prev, ...updated }));
                if (onUpdateUserProfile) {
                  onUpdateUserProfile(updated);
                }
              }}
            />
          )}
        </>
      )}
      {/* Employee Work Profile Modal */}
      {inspectEmployeeId && (
        <EmployeeWorkProfileModal
          isOpen={Boolean(inspectEmployeeId)}
          onClose={() => setInspectEmployeeId(null)}
          employeeProfileId={inspectEmployeeId}
          employeeSystemId={inspectEmployeeId}
          employeeName="Team Member"
          isAdmin={false}
        />
      )}
    </PortalLayout>
  );
};
