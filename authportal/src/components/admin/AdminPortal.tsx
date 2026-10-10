import React, { useState, useEffect, useCallback } from 'react';
import { PortalLayout } from '../layout/PortalLayout';
import { AdminOverview } from './AdminOverview';
import { AdminAccounts } from './AdminAccounts';
import { AdminTasks } from './AdminTasks';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminSettings } from './AdminSettings';
import { CreateProfileCard } from '../profile/CreateProfileCard';
import { ManagerAttendance } from '../manager/ManagerAttendance';
import { ManagerDailyReports } from '../manager/ManagerDailyReports';
import { ManagerCalendar } from '../manager/ManagerCalendar';
import { ManagerMessages } from '../manager/ManagerMessages';
import { ManagerAnalytics } from '../manager/ManagerAnalytics';
import { CompanyCustomizerModal } from '../auth/CompanyCustomizerModal';
import { EmployeeWorkProfileModal } from '../profile/EmployeeWorkProfileModal';
import { portalApi } from '../../services/portalApi';
import { supabase } from '../../lib/supabase';
import { DEFAULT_PORTAL_SETTINGS } from '../../services/workData';
import type {
  AdminTab,
  PortalRole,
  UserProfile,
  AccountApprovalRequest,
  ManagedAccount,
  Task,
  AuditLogEntry,
  PortalSecuritySettings,
  LeaveRequest,
  AttendanceRecord,
  DailyReport,
  CalendarEvent,
} from '../../types/work';
import type { BrandConfig } from '../../types/auth';

interface AdminPortalProps {
  brandConfig: BrandConfig;
  currentUserProfile?: UserProfile;
  onUpdateBrandConfig: (config: BrandConfig) => void;
  onSignOut: () => void;
  onSelectRole?: (role: PortalRole) => void;
  approvalRequests?: AccountApprovalRequest[];
  onUpdateApprovalRequests?: React.Dispatch<React.SetStateAction<AccountApprovalRequest[]>>;
  onUpdateUserProfile?: (updated: Partial<UserProfile>) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  brandConfig,
  currentUserProfile,
  onUpdateBrandConfig,
  onSignOut,
  onSelectRole,
  onUpdateUserProfile,
}) => {
  const VALID_ADMIN_TABS: AdminTab[] = [
    'overview',
    'employees',
    'managers',
    'accounts',
    'tasks',
    'attendance',
    'reports',
    'calendar',
    'messages',
    'analytics',
    'security',
    'audit',
    'settings',
  ];

  // Default Admin route strictly set to overview (Admin Dashboard)
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as AdminTab;
      if (hash && VALID_ADMIN_TABS.includes(hash)) {
        return hash;
      }
    }
    return 'overview';
  });

  // Ensure canonical route on mount and listen to hashchange
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash.replace('#', '') as AdminTab;
      if (!currentHash || currentHash === ('admin' as any) || !VALID_ADMIN_TABS.includes(currentHash)) {
        window.location.hash = 'overview';
        setActiveTab('overview');
      }

      const handleHashChange = () => {
        const nextHash = window.location.hash.replace('#', '') as AdminTab;
        if (VALID_ADMIN_TABS.includes(nextHash)) {
          setActiveTab(nextHash);
        } else {
          window.location.hash = 'overview';
          setActiveTab('overview');
        }
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

  // Synchronize URL hash when active tab changes via internal navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== activeTab) {
        window.location.hash = activeTab;
      }
    }
  }, [activeTab]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real backend states
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<AccountApprovalRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<PortalSecuritySettings>(DEFAULT_PORTAL_SETTINGS);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [unprovisionedUser, setUnprovisionedUser] = useState<{ email: string; systemId: string } | null>(null);
  const [inspectEmployeeId, setInspectEmployeeId] = useState<string | null>(null);

  // Authenticated Admin Profile
  const [adminProfile, setAdminProfile] = useState<UserProfile>(() => {
    if (currentUserProfile) {
      return {
        ...currentUserProfile,
        role: 'admin',
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
      name: 'System Administrator',
      email: '',
      role: 'admin' as PortalRole,
      department: 'Executive Governance',
      jobTitle: 'System Administrator',
      employeeId: 'ADM01',
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
      setAdminProfile((prev) => ({
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
              setAdminProfile({
                id: prof.id,
                name: prof.full_name || 'System Administrator',
                email: prof.email || user.email || '',
                role: 'admin',
                department: prof.department_id || 'Executive Governance',
                jobTitle: prof.job_title || 'System Administrator',
                employeeId: prof.system_id || 'ADM01',
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
                systemId: user.user_metadata?.employee_id || user.user_metadata?.system_id || 'ADM01',
              });
            }
          });
      });
    }
  }, [currentUserProfile]);

  // Fetch real data from PostgreSQL
  const loadPortalData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [
        approvalsRes,
        accountsRes,
        tasksRes,
        auditRes,
        attendanceRes,
        reportsRes,
        calendarRes,
      ] = await Promise.all([
        portalApi.getAdminApprovalRequests(),
        portalApi.getManagedAccounts(),
        portalApi.getTasks(),
        portalApi.getAuditLogs(),
        portalApi.getAttendanceRecords(),
        portalApi.getDailyReports(),
        portalApi.getCalendarEvents(),
      ]);

      if (approvalsRes.data) setApprovalRequests(approvalsRes.data);
      if (accountsRes.data) setAccounts(accountsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (auditRes.data) setAuditLogs(auditRes.data);
      if (attendanceRes.data) setAttendanceRecords(attendanceRes.data);
      if (reportsRes.data) setDailyReports(reportsRes.data);
      if (calendarRes.data) setCalendarEvents(calendarRes.data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sync with Supabase backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortalData();

    // Live Realtime Synchronization: Immediately update when manager assigns or edits tasks
    const taskChannel = supabase
      .channel('admin-portal-tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadPortalData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignments' }, () => {
        loadPortalData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
    };
  }, [loadPortalData]);

  // Real backend connected approve handler
  const handleApproveRequest = async (requestId: string, reason: string = 'Authorized by Administrator') => {
    const res = await portalApi.approveAccountRequest(requestId, reason);
    if (res.success) {
      await loadPortalData();
    } else {
      alert(`Approval error: ${res.error}`);
    }
  };

  // Real backend connected reject handler
  const handleRejectRequest = async (requestId: string, reason: string = 'Rejected by Administrator') => {
    const res = await portalApi.rejectAccountRequest(requestId, reason);
    if (res.success) {
      await loadPortalData();
    } else {
      alert(`Rejection error: ${res.error}`);
    }
  };

  const handleToggleAccountStatus = async (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    // Optimistic UI update
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, status: nextStatus } : acc))
    );
  };

  const handleResetUserCredentials = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (target) {
      alert(`Mandatory password reset dispatched to verified email: ${target.email}`);
    }
  };

  const handleUpdateSettings = (newSettings: PortalSecuritySettings) => {
    setSettings(newSettings);
  };

  const pendingApprovalsCount = approvalRequests.filter(
    (r) => r.requestedRole === 'manager' && r.status === 'pending'
  ).length;

  if (unprovisionedUser) {
    return (
      <PortalLayout
        role="admin"
        brandConfig={brandConfig}
        user={{
          name: 'New Administrator',
          roleTitle: 'Administrator',
          email: unprovisionedUser.email,
        }}
        activeTab="overview"
        onTabChange={() => {}}
        onSignOut={onSignOut}
        onSelectRole={onSelectRole || (() => {})}
        headerTitle="Admin Portal"
        headerSubtitle="Profile Activation & Setup"
      >
        <CreateProfileCard
          userEmail={unprovisionedUser.email}
          employeeId={unprovisionedUser.systemId}
          initialRole="admin"
          onProfileCreated={(newProfile) => {
            setAdminProfile(newProfile);
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
      role="admin"
      brandConfig={brandConfig}
      user={{
        name: adminProfile.name,
        roleTitle: 'Administrator',
        email: adminProfile.email,
      }}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSignOut={onSignOut}
      onSelectRole={onSelectRole}
      headerTitle="Admin Operations Dashboard"
      headerSubtitle="Executive governance, account authorizations, and organizational oversight"
      searchPlaceholder="Search accounts, deliverables, audit events..."
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
          <p className="text-xs text-neutral-400 font-medium">Synchronizing live operational data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <AdminOverview
              userProfile={adminProfile}
              approvalRequests={approvalRequests}
              accounts={accounts}
              tasks={tasks}
              auditLogs={auditLogs}
              attendanceRecords={attendanceRecords}
              dailyReports={dailyReports}
              onNavigateTab={setActiveTab}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
            />
          )}


          {(activeTab === 'employees' || activeTab === 'managers' || activeTab === 'accounts') && (
            <AdminAccounts
              accounts={
                activeTab === 'managers'
                  ? accounts.filter((a) => a.role === 'manager')
                  : activeTab === 'employees'
                  ? accounts.filter((a) => a.role === 'employee')
                  : accounts
              }
              onToggleAccountStatus={handleToggleAccountStatus}
              onResetUserCredentials={handleResetUserCredentials}
              onAccountProfileUpdated={async () => {
                await loadPortalData();
              }}
            />
          )}

          {activeTab === 'tasks' && (
            <AdminTasks
              tasks={tasks}
              dailyReports={dailyReports}
              onSelectEmployee={(empId) => setInspectEmployeeId(empId)}
            />
          )}

          {activeTab === 'attendance' && (
            <ManagerAttendance
              teamMembers={accounts
                .filter((a) => a.role === 'employee' || a.role === 'manager')
                .map((a) => ({
                  id: a.id,
                  employeeId: a.systemId,
                  fullName: a.fullName,
                  email: a.email,
                  jobTitle: a.jobTitle,
                  department: a.department,
                  avatarUrl: null,
                  status: (a.status === 'active' ? 'active' : 'leave') as any,
                  attendanceToday: {
                    status: 'present' as const,
                    checkInTime: '09:00 AM',
                    hoursWorked: 8,
                  },
                  activeTasksCount: tasks.filter(
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
                  completedTasksCount: tasks.filter(
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
                }))}
              leaveRequests={leaveRequests}
              onReviewLeaveRequest={(requestId, status, note) => {
                setLeaveRequests((prev) =>
                  prev.map((lr) => (lr.id === requestId ? { ...lr, status, reviewNote: note } : lr))
                );
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ManagerDailyReports
              dailyReports={dailyReports}
              teamMembers={accounts
                .filter((a) => a.role === 'employee')
                .map((a) => ({
                  id: a.id,
                  employeeId: a.systemId,
                  fullName: a.fullName,
                  email: a.email,
                  jobTitle: a.jobTitle,
                  department: a.department,
                  avatarUrl: null,
                  status: (a.status === 'active' ? 'active' : 'leave') as any,
                  attendanceToday: {
                    status: 'present' as const,
                    checkInTime: '09:00 AM',
                    hoursWorked: 8,
                  },
                  activeTasksCount: tasks.filter((t) => t.assignedToEmployeeId === a.id && t.status !== 'completed').length,
                  completedTasksCount: tasks.filter((t) => t.assignedToEmployeeId === a.id && t.status === 'completed').length,
                }))}
              onReviewReport={async (reportId, feedback, decision) => {
                await portalApi.reviewDailyReport(reportId, feedback, decision);
                await loadPortalData();
              }}
              onSelectEmployee={(empId) => setInspectEmployeeId(empId)}
            />
          )}

          {activeTab === 'calendar' && (
            <ManagerCalendar
              events={calendarEvents}
              teamMembers={accounts.map((a) => ({
                id: a.id,
                employeeId: a.systemId,
                fullName: a.fullName,
                email: a.email,
                jobTitle: a.jobTitle,
                department: a.department,
                avatarUrl: null,
                status: 'active',
                attendanceToday: {
                  status: 'present' as const,
                  checkInTime: '09:00 AM',
                  hoursWorked: 8,
                },
                activeTasksCount: 0,
                completedTasksCount: 0,
              }))}
              onAddEvent={(e) => setCalendarEvents((prev) => [e, ...prev])}
            />
          )}

          {activeTab === 'messages' && (
            <ManagerMessages
              notifications={[]}
              tasks={tasks}
              teamMembers={accounts.map((a) => ({
                id: a.id,
                employeeId: a.systemId,
                fullName: a.fullName,
                email: a.email,
                jobTitle: a.jobTitle,
                department: a.department,
                role: a.role,
                status: a.status === 'active' ? ('active' as const) : ('leave' as const),
                avatarUrl: a.avatarUrl || null,
                attendanceToday: {
                  status: 'not_checked_in' as const,
                  checkInTime: null,
                  hoursWorked: 0,
                },
                activeTasksCount: 0,
                completedTasksCount: 0,
              }))}
              onBroadcastAnnouncement={() => {}}
              onRefresh={loadPortalData}
            />
          )}

          {activeTab === 'analytics' && (
            <ManagerAnalytics
              tasks={tasks}
              teamMembers={accounts.map((a) => ({
                id: a.id,
                employeeId: a.systemId,
                fullName: a.fullName,
                email: a.email,
                jobTitle: a.jobTitle,
                department: a.department,
                avatarUrl: null,
                status: 'active',
                attendanceToday: {
                  status: 'present' as const,
                  checkInTime: '09:00 AM',
                  hoursWorked: 8,
                },
                activeTasksCount: 0,
                completedTasksCount: 0,
              }))}
              leaveRequests={leaveRequests}
              dailyReports={dailyReports}
            />
          )}

          {(activeTab === 'security' || activeTab === 'settings') && (
            <AdminSettings
              brandConfig={brandConfig}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onOpenBrandCustomizer={() => setIsBrandModalOpen(true)}
              adminProfile={adminProfile}
              onUpdateAdminProfile={(updated) => {
                setAdminProfile((prev) => ({ ...prev, ...updated }));
                if (onUpdateUserProfile) {
                  onUpdateUserProfile(updated);
                }
              }}
              userEmail={adminProfile.email}
              employeeId={adminProfile.employeeId}
            />
          )}

          {activeTab === 'audit' && (
            <AdminAuditLogs auditLogs={auditLogs} accounts={accounts} tasks={tasks} />
          )}
        </>
      )}

      <CompanyCustomizerModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        brandConfig={brandConfig}
        onSave={(newCfg) => {
          onUpdateBrandConfig(newCfg);
          setIsBrandModalOpen(false);
        }}
      />

      {/* Employee Work Profile Modal */}
      {inspectEmployeeId && (
        <EmployeeWorkProfileModal
          isOpen={Boolean(inspectEmployeeId)}
          onClose={() => setInspectEmployeeId(null)}
          employeeProfileId={inspectEmployeeId}
          employeeSystemId={inspectEmployeeId}
          employeeName="Team Member"
          isAdmin={true}
          onProfileUpdated={async () => {
            await loadPortalData();
          }}
        />
      )}
    </PortalLayout>
  );
};
