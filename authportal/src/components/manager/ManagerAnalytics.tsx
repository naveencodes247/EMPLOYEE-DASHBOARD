import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  BarChart3,
  Download,
  Filter,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { TeamMember, Task, LeaveRequest, DailyReport } from '../../types/work';

interface ManagerAnalyticsProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  leaveRequests: LeaveRequest[];
  dailyReports: DailyReport[];
}

export const ManagerAnalytics: React.FC<ManagerAnalyticsProps> = ({
  teamMembers = [],
  tasks = [],
  leaveRequests = [],
  dailyReports = [],
}) => {
  const [timeframe, setTimeframe] = useState<'week' | 'sprint' | 'month'>('week');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const blockedTasks = tasks.filter((t) => t.status === 'blocked');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const presentCount = teamMembers.filter(
    (m) => m.attendanceToday.status === 'present' || m.attendanceToday.status === 'remote'
  ).length;
  const attendanceRate = teamMembers.length > 0 ? Math.round((presentCount / teamMembers.length) * 100) : 100;

  const approvedLeaves = leaveRequests.filter((l) => l.status === 'approved').length;

  const handleExportSummary = () => {
    setExportNotice('Exported team performance summary for ' + timeframe.toUpperCase());
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Team & Organization Analytics
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Operational velocity, workload balance, attendance ratios, and deliverable metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe switch */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs">
            <button
              type="button"
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                timeframe === 'week'
                  ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('sprint')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                timeframe === 'sprint'
                  ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Current Sprint
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Month-to-Date
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportSummary}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3.5 rounded-2xl bg-[var(--success-bg)] border border-[var(--success-border)] text-xs text-[var(--success-text)] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Sprint Completion Rate</span>
            <CheckSquare className="w-4 h-4 text-[#D9B66F]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              {completionRate}%
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {completedTasks.length}/{tasks.length} tasks
            </span>
          </div>
          <div className="w-full bg-[var(--bg-card-subtle)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#D9B66F] h-full rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Attendance Rate</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              {attendanceRate}%
            </span>
            <span className="text-xs text-[var(--text-muted)]">on-duty today</span>
          </div>
          <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{presentCount} active · {approvedLeaves} approved leaves</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Standup Reports</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              100%
            </span>
            <span className="text-xs text-[var(--text-muted)]">compliance</span>
          </div>
          <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>{dailyReports.length} reports logged this cycle</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Operational Blockers</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              {blockedTasks.length}
            </span>
            <span className="text-xs text-[var(--text-muted)]">critical bottlenecks</span>
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            {blockedTasks.length === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">All deliverables unblocked</span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-medium">Requires lead unblocking</span>
            )}
          </div>
        </div>
      </div>

      {/* Team Member Workload Distribution Table */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Workload Allocation by Team Member
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Individual task load, completion efficiency, and current availability status.
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {teamMembers.length} active engineers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pr-4">Team Member</th>
                <th className="pb-3 px-4">Role & ID</th>
                <th className="pb-3 px-4 text-center">Active Deliverables</th>
                <th className="pb-3 px-4 text-center">Completed</th>
                <th className="pb-3 px-4">Workload Capacity</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {teamMembers.map((member) => {
                const memberTasks = tasks.filter((t) => t.assignedToEmployeeId === member.employeeId);
                const memberCompleted = memberTasks.filter((t) => t.status === 'completed').length;
                const memberActive = memberTasks.filter((t) => t.status !== 'completed').length;
                const capacityPercent = Math.min(Math.round((memberActive / 5) * 100), 100);

                return (
                  <tr key={member.id} className="hover:bg-[var(--bg-card-subtle)]/50 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D9B66F]/20 border border-[#D9B66F]/40 flex items-center justify-center font-bold text-xs text-[#222222] dark:text-[#F8E7A1] shrink-0">
                          {member.fullName.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-primary)]">{member.fullName}</div>
                          <div className="text-[11px] text-[var(--text-muted)] font-mono">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[var(--text-primary)]">{member.jobTitle}</div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono">{member.employeeId}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-[var(--text-primary)]">{memberActive}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                        {memberCompleted}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                          <span>{capacityPercent}% load</span>
                          <span>{memberActive}/5 tasks</span>
                        </div>
                        <div className="w-full bg-[var(--bg-card-subtle)] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              capacityPercent > 80
                                ? 'bg-red-500'
                                : capacityPercent > 50
                                ? 'bg-[#D9B66F]'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${capacityPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      {member.status === 'leave' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          On Leave
                        </span>
                      ) : member.attendanceToday.status === 'remote' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          Remote
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                          On Duty
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
