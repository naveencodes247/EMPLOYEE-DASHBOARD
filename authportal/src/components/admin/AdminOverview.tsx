import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  CheckSquare,
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Laptop,
} from 'lucide-react';
import type {
  UserProfile,
  AccountApprovalRequest,
  ManagedAccount,
  Task,
  AuditLogEntry,
  AdminTab,
  AttendanceRecord,
  DailyReport,
} from '../../types/work';

interface AdminOverviewProps {
  userProfile: UserProfile;
  approvalRequests: AccountApprovalRequest[];
  accounts: ManagedAccount[];
  tasks: Task[];
  auditLogs: AuditLogEntry[];
  attendanceRecords?: AttendanceRecord[];
  dailyReports?: DailyReport[];
  onNavigateTab: (tab: AdminTab) => void;
  onApproveRequest?: (requestId: string, reason?: string) => Promise<void> | void;
  onRejectRequest?: (requestId: string, reason?: string) => Promise<void> | void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  userProfile,
  approvalRequests,
  accounts,
  tasks,
  auditLogs,
  attendanceRecords = [],
  dailyReports = [],
  onNavigateTab,
  onApproveRequest,
  onRejectRequest,
}) => {
  // Timeframe filter states
  const [completionTimeframe, setCompletionTimeframe] = useState('Last 6 Months');
  const [attendanceTimeframe, setAttendanceTimeframe] = useState('This Week');

  // Real backend calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const totalEmployeesCount = accounts.filter((a) => a.role === 'employee' && a.status === 'active').length;
  const totalManagersCount = accounts.filter((a) => a.role === 'manager' && a.status === 'active').length;
  const activeTasksCount = tasks.filter((t) => t.status === 'in_progress' || t.status === 'not_started').length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = tasks.filter((t) => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr);
  const overdueTasksCount = overdueTasks.length;

  // Department counts
  const depts = accounts.reduce((acc, curr) => {
    const d = curr.department || 'Operations';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Compute Task Completion Rate
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  // Date formatted
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ----------------------------------------------------------------- */}
      {/* ROW 1: KPI Stat Cards Grid (7 Cards Connected to Real Data)       */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-3.5">
        {/* Card 1: Total Employees */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="text-[11px] font-medium">Total Employees</span>
            <Users className="w-3.5 h-3.5 text-[#C5A059]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[var(--text-primary)]">{totalEmployeesCount}</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              Active
            </span>
          </div>
        </div>

        {/* Card 2: Total Managers */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="text-[11px] font-medium">Total Managers</span>
            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-[#B08D46] dark:text-[#D9B66F] text-[10px] flex items-center justify-center font-bold">M</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[var(--text-primary)]">{totalManagersCount}</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              Active
            </span>
          </div>
        </div>

        {/* Card 3: Active Tasks */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="text-[11px] font-medium">Active Tasks</span>
            <CheckSquare className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[var(--text-primary)]">{activeTasksCount}</span>
            <span className="text-[10px] text-[var(--text-muted)]">in flight</span>
          </div>
        </div>

        {/* Card 4: Completed Tasks */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="text-[11px] font-medium">Completed Tasks</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[var(--text-primary)]">{completedTasksCount}</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {completionRate}% rate
            </span>
          </div>
        </div>

        {/* Card 5: Overdue Tasks */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="text-[11px] font-medium">Overdue Tasks</span>
            <Clock className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[var(--text-primary)]">{overdueTasksCount}</span>
            {overdueTasksCount > 0 ? (
              <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 flex items-center">
                Attention
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                Clear
              </span>
            )}
          </div>
        </div>

        {/* Card 6: Task Completion Rate */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="text-[11px] font-medium">Completion Rate</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{completionRate}%</span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">delivered</span>
          </div>
        </div>

        {/* Card 7: Live Date & Greeting Card */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 p-3.5 rounded-2xl bg-amber-500/10 dark:bg-gradient-to-br dark:from-[#2A2B33] dark:via-[#212228] dark:to-[#18191E] border border-amber-500/20 dark:border-white/10 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
              {dayName}
            </span>
            <p className="text-xs font-bold text-[var(--text-primary)]">{formattedDate}</p>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] relative z-10 mt-1">
            Good day, {userProfile.name.split(' ')[0]}!
          </p>
        </div>
      </div>



      {/* ----------------------------------------------------------------- */}
      {/* ROW 2: Middle Row Widgets (Charts & Real Pending Approvals)       */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Widget 1: Task Completion Overview */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Task Completion Overview</h3>
            <select
              value={completionTimeframe}
              onChange={(e) => setCompletionTimeframe(e.target.value)}
              className="text-[10px] bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              <option value="Last 6 Months">Last 6 Months</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed ({completedTasksCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" /> Active ({activeTasksCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" /> Overdue ({overdueTasksCount})
            </span>
          </div>

          <div className="h-36 w-full pt-2 flex flex-col justify-end">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Completion Velocity</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{completionRate}%</span>
              </div>
              <div className="w-full bg-[var(--bg-card-subtle)] rounded-full h-3 overflow-hidden flex border border-[var(--border-subtle)]">
                <div style={{ width: `${completionRate}%` }} className="bg-emerald-500 h-full" />
                <div style={{ width: `${totalTasks > 0 ? (activeTasksCount / totalTasks) * 100 : 0}%` }} className="bg-blue-500 h-full" />
                <div style={{ width: `${totalTasks > 0 ? (overdueTasksCount / totalTasks) * 100 : 0}%` }} className="bg-red-500 h-full" />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] text-center pt-1">
                {totalTasks > 0 ? `${totalTasks} total organizational deliverables tracked` : 'No deliverables recorded yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Widget 2: Attendance Trends */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Attendance Trends</h3>
            <select
              value={attendanceTimeframe}
              onChange={(e) => setAttendanceTimeframe(e.target.value)}
              className="text-[10px] bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" /> Logged
            </span>
          </div>

          <div className="h-36 flex items-center justify-center p-2 text-center">
            <div className="space-y-1">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {attendanceRecords.length}
              </span>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">Logged Verification Events</p>
              <p className="text-[9px] text-[var(--text-muted)]">
                Audited against Supabase attendance logs
              </p>
            </div>
          </div>
        </div>

        {/* Widget 3: Department Distribution */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Department Headcount</h3>
            <span className="text-[10px] text-[#C5A059] font-semibold">{accounts.length} Total</span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            {Object.keys(depts).length > 0 ? (
              Object.entries(depts).slice(0, 5).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)] text-[11px] truncate">{dept}</span>
                  <span className="font-bold text-[var(--text-primary)] text-[11px]">{count}</span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-[var(--text-muted)] text-xs">
                No departmental assignments registered
              </div>
            )}
          </div>
        </div>

        {/* Widget 4: Recent Submitted Daily Reports (Real Deliverables) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[var(--text-primary)]">Submitted Daily Reports</h3>
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
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[#C5A059]/30 flex items-center justify-center text-[10px] font-bold text-[#C5A059] shrink-0">
                      {(rep.employeeName || 'EM').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-[var(--text-primary)] text-xs truncate leading-tight">
                        {rep.employeeName || 'Team Member'}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate leading-tight mt-0.5">
                        {rep.completedWork || 'Work completed today'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('reports')}
                      className="px-2.5 py-1 rounded-lg bg-[#C5A059] hover:bg-[#B08D46] text-gray-900 font-bold text-[10px] transition-colors cursor-pointer shadow-xs"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-[var(--text-muted)] text-xs flex flex-col items-center justify-center gap-1.5">
                <CheckCircle className="w-6 h-6 text-emerald-500/60" />
                <span>No daily reports submitted yet</span>
                <span className="text-[10px] text-[var(--text-muted)]">Awaiting personnel submissions</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* ROW 3: Bottom Row Widgets (Real Audit Trail & Deadlines)          */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Recent Audit Activity */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Security Audit Trail</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('audit')}
              className="text-[10px] text-[#C5A059] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {auditLogs.length > 0 ? (
              auditLogs.slice(0, 4).map((act) => (
                <div key={act.id} className="p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-start gap-2">
                  <div className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] shrink-0 mt-0.5">
                    <Shield className="w-3 h-3 text-[#C5A059]" />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                      {act.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate leading-tight mt-0.5">
                      By {act.performedBy} · {act.timestamp}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-[var(--text-muted)] text-xs">
                No recent audit events
              </div>
            )}
          </div>
        </div>

        {/* Widget 2: Upcoming Deadlines */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Upcoming Deliverables</h3>
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
              tasks.slice(0, 4).map((t) => {
                const isOverdue = t.status !== 'completed' && t.dueDate && t.dueDate < todayStr;
                return (
                  <div key={t.id} className="p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="truncate mr-2">
                      <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate leading-tight">{t.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate leading-tight mt-0.5">
                        {t.assignedToEmployeeName ? `${t.assignedToEmployeeName} · ` : ''}{t.project} · {t.priority}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold text-[var(--text-primary)]">{t.dueDate || 'Open'}</p>
                      <p className={`text-[9px] font-semibold ${isOverdue ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                        {isOverdue ? 'Overdue' : t.status.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-[var(--text-muted)] text-xs">
                No deliverables scheduled
              </div>
            )}
          </div>
        </div>

        {/* Widget 3: Organization Metrics */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Operations Velocity</h3>
            <span className="text-[10px] text-[var(--text-muted)]">Live Supabase</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] block truncate">Throughput</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-[var(--text-primary)]">{completionRate}%</span>
                <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] block truncate">Active Deliverables</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-[var(--text-primary)]">{activeTasksCount}</span>
                <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">Tracked</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] block truncate">Daily Logs</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-[var(--text-primary)]">{dailyReports.length}</span>
                <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400">Reports</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] block truncate">Audit Events</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">{auditLogs.length}</span>
                <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400">Logged</span>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 4: Security Center */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Security Verification</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('security')}
              className="text-[10px] text-[#C5A059] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              <span>Settings</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] text-[var(--text-secondary)]">Database RLS</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Enforced</span>
            </div>

            <div className="p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] text-[var(--text-secondary)]">Suspended Users</span>
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {accounts.filter((a) => a.status === 'suspended').length}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] text-[var(--text-secondary)]">Audit Logging</span>
              </div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Active</span>
            </div>

            <div className="p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] text-[var(--text-secondary)]">Initial Admin</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{userProfile.employeeId}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
