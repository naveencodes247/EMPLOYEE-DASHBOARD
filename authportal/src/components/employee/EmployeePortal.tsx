import React, { useState, useEffect, useCallback } from 'react';
import { PortalLayout } from '../layout/PortalLayout';
import { EmployeeOverview } from './EmployeeOverview';
import { EmployeeTasks } from './EmployeeTasks';
import { EmployeeAttendance } from './EmployeeAttendance';
import { EmployeeDailyReports } from './EmployeeDailyReports';
import { EmployeeCalendar } from './EmployeeCalendar';
import { EmployeeMessages } from './EmployeeMessages';
import { EmployeeNotifications } from './EmployeeNotifications';
import { EmployeeProfileSettings } from './EmployeeProfileSettings';
import { CreateProfileCard } from '../profile/CreateProfileCard';
import { DailyReportModal } from '../modals/DailyReportModal';
import { portalApi } from '../../services/portalApi';
import { supabase } from '../../lib/supabase';
import type {
  EmployeeTab,
  Task,
  TaskStatus,
  DailyReport,
  UserProfile,
  WorkNotification,
  AttendanceRecord,
  CalendarEvent,
} from '../../types/work';
import type { BrandConfig } from '../../types/auth';
import type { PortalRole } from '../../types/work';

interface EmployeePortalProps {
  brandConfig: BrandConfig;
  currentUserProfile?: UserProfile;
  onSignOut: () => void;
  onSelectRole?: (role: PortalRole) => void;
  onUpdateUserProfile?: (updated: Partial<UserProfile>) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  brandConfig,
  currentUserProfile,
  onSignOut,
  onSelectRole,
  onUpdateUserProfile,
}) => {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileChecking, setIsProfileChecking] = useState(!currentUserProfile);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authenticated Employee Profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(currentUserProfile || null);
  const [unprovisionedUser, setUnprovisionedUser] = useState<{ email: string; systemId: string } | null>(null);

  // Check Supabase if currentUserProfile is not passed
  useEffect(() => {
    if (currentUserProfile) {
      setUserProfile(currentUserProfile);
      setIsProfileChecking(false);
      return;
    }

    let isMounted = true;
    setIsProfileChecking(true);

    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!isMounted) return;
      if (error || !user) {
        setIsProfileChecking(false);
        setIsLoading(false);
        setErrorMessage('Authentication session expired. Please sign in again.');
        return;
      }

      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile, error: profErr }) => {
          if (!isMounted) return;
          setIsProfileChecking(false);

          if (profErr) {
            setErrorMessage(`Failed to query employee profile: ${profErr.message}`);
            setIsLoading(false);
            return;
          }

          if (profile) {
            const mapped: UserProfile = {
              id: profile.id,
              name: profile.full_name || 'outFyt Member',
              email: profile.email || user.email || '',
              role: 'employee',
              department: profile.department_id || 'Engineering Operations',
              jobTitle: profile.job_title || 'Associate',
              employeeId: profile.system_id || user.user_metadata?.employee_id || 'ID-0001',
              avatarUrl: profile.avatar_url || null,
              timezone: profile.timezone || 'Asia/Kolkata',
              todayAttendance: {
                isCheckedIn: true,
                checkInTime: '09:00 AM',
                isOnBreak: false,
                breakStartTime: null,
                elapsedWorkingMinutes: 480,
              },
            };
            setUserProfile(mapped);
          } else {
            // No profile row in database yet
            setUnprovisionedUser({
              email: user.email || '',
              systemId: user.user_metadata?.employee_id || user.user_metadata?.system_id || 'EMP-NEW',
            });
            setIsLoading(false);
          }
        });
    });

    return () => {
      isMounted = false;
    };
  }, [currentUserProfile]);

  // Deep linking via query parameters (?taskId=... or ?announcement=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('taskId')) {
        setActiveTab('tasks');
      } else if (params.get('announcement')) {
        setActiveTab('notifications');
      }
    }
  }, []);

  // Real backend states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<WorkNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [completionReportTaskId, setCompletionReportTaskId] = useState<string | null>(null);

  const loadPortalData = useCallback(async () => {
    if (!userProfile?.id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [tasksRes, attRes, repRes, calRes, notifRes] = await Promise.all([
        portalApi.getTasks({ assignedTo: userProfile.id }),
        portalApi.getAttendanceRecords(userProfile.id),
        portalApi.getDailyReports(userProfile.id),
        portalApi.getCalendarEvents(),
        portalApi.getWorkNotifications(userProfile.id),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (attRes.data) setAttendanceHistory(attRes.data);
      if (repRes.data) setDailyReports(repRes.data);
      if (calRes.data) setCalendarEvents(calRes.data);
      if (notifRes.data) setNotifications(notifRes.data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sync employee data.');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    if (userProfile?.id) {
      loadPortalData();

      const channel = supabase
        .channel(`employee-portal-sync-${userProfile.id}`)
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
    }
  }, [loadPortalData, userProfile?.id]);

  // Real backend Task status update
  const handleUpdateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus,
    progress?: number,
    completionNotes?: string,
    blockers?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userProfile) return { success: false, error: 'User profile not loaded' };
    const res = await portalApi.updateTaskStatus(taskId, newStatus, userProfile.id, progress, completionNotes, blockers);
    if (res.success) {
      await loadPortalData();
      return { success: true };
    } else {
      return { success: false, error: res.error || 'Failed to update task status' };
    }
  };

  const handleToggleTaskCheckbox = (taskId: string) => {
    // Section 5: The task must not be marked completed merely because an employee selects a checkbox.
    // Selecting completion opens the mandatory work report & proof image form.
    setCompletionReportTaskId(taskId);
  };

  const handleUpdateTaskProgress = async (
    taskId: string,
    newProgress: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (newProgress === 100) {
      setCompletionReportTaskId(taskId);
      return { success: true };
    }
    const status: TaskStatus = newProgress > 0 ? 'in_progress' : 'not_started';
    return handleUpdateTaskStatus(taskId, status, newProgress);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubs = (t.subtasks || []).map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          );
          return { ...t, subtasks: updatedSubs };
        }
        return t;
      })
    );
  };

  // Real Check-in
  const handleToggleCheckIn = async () => {
    if (!userProfile) return;
    const res = await portalApi.recordCheckIn(userProfile.id);
    if (res.success) {
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              todayAttendance: {
                ...prev.todayAttendance,
                isCheckedIn: true,
                checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            }
          : null
      );
      await loadPortalData();
    }
  };

  const handleToggleBreak = () => {
    setUserProfile((prev) =>
      prev
        ? {
            ...prev,
            todayAttendance: {
              ...prev.todayAttendance,
              isOnBreak: !prev.todayAttendance.isOnBreak,
            },
          }
        : null
    );
  };

  // Real Daily Report persistence
  const handleSubmitReport = async (reportData: {
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
    files?: File[];
  }): Promise<{ success: boolean; error?: string }> => {
    if (!userProfile) return { success: false, error: 'User profile not found' };
    const res = await portalApi.submitDailyReport({
      employeeId: userProfile.id,
      date: reportData.date,
      taskId: reportData.taskId,
      description: reportData.description,
      completedWork: reportData.completedWork,
      workInProgress: reportData.workInProgress,
      progress: reportData.progress,
      blockers: reportData.blockers,
      notes: reportData.notes,
      nextSteps: reportData.nextSteps,
      hoursWorked: reportData.hoursWorked,
      files: reportData.files,
    });
    if (res.success) {
      await loadPortalData();
      return { success: true };
    } else {
      return { success: false, error: res.error || 'Failed to submit daily report' };
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await portalApi.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleUpdateProfile = (updatedProfile: Partial<UserProfile>) => {
    setUserProfile((prev) => (prev ? { ...prev, ...updatedProfile } : null));
    if (onUpdateUserProfile) {
      onUpdateUserProfile(updatedProfile);
    }
  };

  // If user profile is missing and needs to be created
  if (!isProfileChecking && !userProfile && unprovisionedUser) {
    return (
      <PortalLayout
        role="employee"
        brandConfig={brandConfig}
        user={{
          name: 'New Employee',
          roleTitle: 'Employee',
          email: unprovisionedUser.email,
        }}
        activeTab="profile"
        onTabChange={() => {}}
        onSignOut={onSignOut}
        onSelectRole={onSelectRole || (() => {})}
        headerTitle="Employee Portal"
        headerSubtitle="Profile Activation & Setup"
      >
        <CreateProfileCard
          userEmail={unprovisionedUser.email}
          employeeId={unprovisionedUser.systemId}
          initialRole="employee"
          onProfileCreated={(newProfile) => {
            setUserProfile(newProfile);
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
      role="employee"
      brandConfig={brandConfig}
      user={{
        name: userProfile?.name || 'Employee',
        roleTitle: 'Employee',
        email: userProfile?.email,
        avatarUrl: userProfile?.avatarUrl || undefined,
      }}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSignOut={onSignOut}
      onSelectRole={onSelectRole || (() => {})}
      headerTitle="Employee Portal"
      headerSubtitle="Assigned deliverables, schedule milestones, and daily accountability"
      searchPlaceholder="Search deliverables, events, reports..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      unreadNotificationsCount={notifications.filter((n) => !n.read).length}
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

      {isLoading || isProfileChecking || !userProfile ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#C5A059] border-t-transparent animate-spin" />
          <p className="text-xs text-neutral-400 font-medium">Synchronizing employee workspace...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <EmployeeOverview
              userProfile={userProfile}
              tasks={tasks}
              dailyReports={dailyReports}
              calendarEvents={calendarEvents}
              onNavigateTab={setActiveTab}
              onToggleTaskStatus={handleToggleTaskCheckbox}
              onSubmitDailyReport={handleSubmitReport}
            />
          )}

          {activeTab === 'tasks' && (
            <EmployeeTasks
              tasks={tasks}
              userProfile={userProfile}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onUpdateTaskProgress={handleUpdateTaskProgress}
              onToggleSubtask={handleToggleSubtask}
              onOpenReportModal={() => setActiveTab('reports')}
              onCompleteTaskDeliverable={(taskId) => setCompletionReportTaskId(taskId)}
            />
          )}

          {activeTab === 'attendance' && (
            <EmployeeAttendance
              userProfile={userProfile}
              attendanceHistory={attendanceHistory}
              onToggleCheckIn={handleToggleCheckIn}
              onToggleBreak={handleToggleBreak}
            />
          )}

          {activeTab === 'reports' && (
            <EmployeeDailyReports
              reports={dailyReports}
              tasks={tasks}
              onSubmitReport={handleSubmitReport}
            />
          )}

          {activeTab === 'calendar' && (
            <EmployeeCalendar events={calendarEvents} />
          )}

          {activeTab === 'messages' && (
            <EmployeeMessages userProfile={userProfile} />
          )}

          {activeTab === 'notifications' && (
            <EmployeeNotifications
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
          )}

          {activeTab === 'profile' && (
            <EmployeeProfileSettings
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </>
      )}

      {/* Mandatory Work Report & Proof Image Upload Modal */}
      {completionReportTaskId && (
        <DailyReportModal
          isOpen={Boolean(completionReportTaskId)}
          initialTaskId={completionReportTaskId}
          isMandatoryCompletion={true}
          tasks={tasks}
          onClose={() => setCompletionReportTaskId(null)}
          onSubmitReport={handleSubmitReport}
        />
      )}
    </PortalLayout>
  );
};
