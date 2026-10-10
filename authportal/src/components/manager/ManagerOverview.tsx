import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckSquare,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type {
  UserProfile,
  Task,
  DailyReport,
  AttendanceRecord,
  AccountApprovalRequest,
  TeamMember,
  ManagerTab,
} from '../../types/work';

interface ManagerOverviewProps {
  userProfile: UserProfile;
  teamMembers: TeamMember[];
  tasks: Task[];
  dailyReports: DailyReport[];
  attendanceRecords: AttendanceRecord[];
  approvalRequests: AccountApprovalRequest[];
  onNavigateTab: (tab: ManagerTab) => void;
  onApproveRequest?: (requestId: string, reason?: string) => Promise<void> | void;
  onRejectRequest?: (requestId: string, reason?: string) => Promise<void> | void;
}

export const ManagerOverview: React.FC<ManagerOverviewProps> = ({
  userProfile,
  teamMembers,
  tasks,
  dailyReports,
  attendanceRecords,
  approvalRequests,
  onNavigateTab,
  onApproveRequest,
  onRejectRequest,
}) => {
  // Real backend calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTasksCount = tasks.filter((t) => t.status === 'in_progress' || t.status === 'not_started').length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const overdueTasksCount = tasks.filter((t) => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr).length;

  // Compute attendance rate from real records
  const attendanceRate = teamMembers.length > 0
    ? Math.min(100, Math.round((attendanceRecords.length / teamMembers.length) * 100))
    : 100;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ----------------------------------------------------------------- */}
      {/* ROW 1: 4 Key Department Metrics (Real Supabase Data)              */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Employees */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-muted)] font-medium block">Department Staff</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{teamMembers.length}</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                Active
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Active Tasks */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-muted)] font-medium block">Active Tasks</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{activeTasksCount}</span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                Assigned
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#C5A059] flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Completed Tasks */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-muted)] font-medium block">Completed Deliverables</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{completedTasksCount}</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                Finished
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Overdue Tasks */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-muted)] font-medium block">Overdue Tasks</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{overdueTasksCount}</span>
              {overdueTasksCount > 0 ? (
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center">
                  Review
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                  None
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>



      {/* ----------------------------------------------------------------- */}
      {/* ROW 2: Middle Row Widgets (Team Task Progress & Attendance)       */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Widget 1: Team Tasks */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Department Deliverables</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('tasks')}
              className="text-[10px] text-[#C5A059] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {tasks.length > 0 ? (
              tasks.slice(0, 4).map((t) => (
                <div key={t.id} className="p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="truncate mr-2">
                    <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate leading-tight">{t.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate leading-tight mt-0.5">
                      {t.assignedToEmployeeName || 'Assigned Staff'} · {t.priority}
                    </p>
                  </div>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                    t.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : t.status === 'in_progress'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {t.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-[var(--text-muted)] text-xs">
                No deliverables currently assigned
              </div>
            )}
          </div>
        </div>

        {/* Widget 2: Attendance Verification */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Employee Attendance</h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{attendanceRate}% Rate</span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-gray-200 dark:text-[#25262D]" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeDasharray={`${attendanceRate} 100`}
                  strokeDashoffset="0"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-bold text-[var(--text-primary)]">{attendanceRate}%</span>
                <span className="text-[8px] text-[var(--text-muted)]">Verified</span>
              </div>
            </div>

            <div className="space-y-2 flex-1 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)] text-[11px]">Logged Records</span>
                <span className="font-bold text-[var(--text-primary)]">{attendanceRecords.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)] text-[11px]">Staff Count</span>
                <span className="font-bold text-[var(--text-primary)]">{teamMembers.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 3: Recent Team Daily Reports (Real Deliverables) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[var(--text-primary)]">Team Daily Reports</h3>
              {dailyReports.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#C5A059]/20 text-[#C5A059] text-[10px] font-bold flex items-center justify-center">
                  {dailyReports.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-[10px] text-[#C5A059] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {dailyReports.length > 0 ? (
              dailyReports.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="truncate">
                    <p className="font-semibold text-[var(--text-primary)] text-xs truncate leading-tight">
                      {rep.employeeName || 'Team Member'}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate leading-tight mt-0.5">
                      {rep.completedWork || 'Work completed today'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('reports')}
                    className="px-2.5 py-1 rounded-lg bg-[#C5A059] hover:bg-[#B08D46] text-gray-900 font-bold text-[10px] transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    Review
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-[var(--text-muted)] text-xs flex flex-col items-center justify-center gap-1.5">
                <CheckCircle className="w-6 h-6 text-emerald-500/60" />
                <span>No daily reports submitted yet</span>
                <span className="text-[10px] text-[var(--text-muted)]">Awaiting today's submissions</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
