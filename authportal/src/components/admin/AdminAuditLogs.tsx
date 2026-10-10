import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  Shield,
  AlertTriangle,
  Info,
  Lock,
  Download,
  Calendar,
  User,
  Users,
  CheckSquare,
  Clock,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { portalApi } from '../../services/portalApi';
import type { AuditLogEntry, ActivityLogEntry, ManagedAccount, Task } from '../../types/work';

interface AdminAuditLogsProps {
  auditLogs: AuditLogEntry[];
  accounts?: ManagedAccount[];
  tasks?: Task[];
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({
  auditLogs,
  accounts = [],
  tasks = [],
}) => {
  const [activeView, setActiveView] = useState<'activity' | 'security'>('activity');

  // Security Audit Trail local filter state
  const [secSearchQuery, setSecSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'security'>('all');

  // Activity Tracking Server-Side state & filters
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [totalActivityCount, setTotalActivityCount] = useState(0);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [actSearchQuery, setActSearchQuery] = useState('');

  // Load activity logs from Supabase
  const loadActivityLogs = useCallback(async () => {
    setIsLoadingActivity(true);
    try {
      const res = await portalApi.getActivityLogs({
        employeeId: selectedEmployeeId !== 'all' ? selectedEmployeeId : undefined,
        actionType: selectedActionType !== 'all' ? selectedActionType : undefined,
        entityType: selectedEntityType !== 'all' ? selectedEntityType : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        pageSize,
      });

      if (res.data) {
        setActivityLogs(res.data);
        setTotalActivityCount(res.totalCount);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [selectedEmployeeId, selectedActionType, selectedEntityType, startDate, endDate, currentPage]);

  useEffect(() => {
    if (activeView === 'activity') {
      loadActivityLogs();
    }
  }, [loadActivityLogs, activeView]);

  // Filter Security Logs locally
  const filteredSecLogs = auditLogs.filter((log) => {
    const matchesSev = severityFilter === 'all' || log.severity === severityFilter;
    const q = secSearchQuery.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.targetUser && log.targetUser.toLowerCase().includes(q)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(q));

    return matchesSev && matchesSearch;
  });

  // Client-side text filter on loaded activity logs
  const displayActivityLogs = activityLogs.filter((log) => {
    if (!actSearchQuery.trim()) return true;
    const q = actSearchQuery.toLowerCase();
    return (
      log.actionType.toLowerCase().includes(q) ||
      (log.actorName && log.actorName.toLowerCase().includes(q)) ||
      (log.targetEmployeeName && log.targetEmployeeName.toLowerCase().includes(q)) ||
      (log.entityType && log.entityType.toLowerCase().includes(q)) ||
      JSON.stringify(log.details).toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(totalActivityCount / pageSize) || 1;

  const actionTypesList = [
    { value: 'all', label: 'All Action Types' },
    { value: 'task_created', label: 'Task Created' },
    { value: 'task_assigned', label: 'Task Assigned' },
    { value: 'task_status_changed', label: 'Task Status Changed' },
    { value: 'task_progress_updated', label: 'Task Progress Updated' },
    { value: 'task_completed', label: 'Task Completed' },
    { value: 'report_submitted', label: 'Work Report Submitted' },
    { value: 'attachment_uploaded', label: 'Attachment Uploaded' },
    { value: 'task_comment_added', label: 'Task Comment Added' },
    { value: 'blocker_reported', label: 'Blocker Reported' },
    { value: 'deadline_extension_requested', label: 'Extension Requested' },
    { value: 'deadline_changed', label: 'Deadline Changed' },
    { value: 'attendance_check_in', label: 'Attendance Check-In' },
    { value: 'attendance_check_out', label: 'Attendance Check-Out' },
    { value: 'leave_requested', label: 'Leave Requested' },
    { value: 'leave_approved', label: 'Leave Approved' },
    { value: 'leave_rejected', label: 'Leave Rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Organization-Wide Activity &amp; Audit Trail
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Immutable tracking of task assignments, progress updates, reports, blockers, and security actions.
          </p>
        </div>

        {/* View Switcher: Activity History vs Security Logs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveView('activity')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'activity'
                ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Employee Activity History ({totalActivityCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('security')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'security'
                ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security Audit Trail ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: COMPLETE EMPLOYEE ACTIVITY TRACKING */}
      {activeView === 'activity' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filters Bar */}
          <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Employee Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                  Employee Filter
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => {
                    setSelectedEmployeeId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 px-2.5 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                >
                  <option value="all">All Employees</option>
                  {accounts
                    .filter((a) => a.role === 'employee')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.systemId} · {a.fullName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Action Type Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                  Activity Event Type
                </label>
                <select
                  value={selectedActionType}
                  onChange={(e) => {
                    setSelectedActionType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 px-2.5 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                >
                  {actionTypesList.map((at) => (
                    <option key={at.value} value={at.value}>
                      {at.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 px-2.5 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 px-2.5 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Search Input & Reset */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={actSearchQuery}
                  onChange={(e) => setActSearchQuery(e.target.value)}
                  placeholder="Search details, actor, employee name, or task..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedEmployeeId('all');
                    setSelectedActionType('all');
                    setSelectedEntityType('all');
                    setStartDate('');
                    setEndDate('');
                    setActSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="text-xs"
                >
                  Reset Filters
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadActivityLogs}
                  isLoading={isLoadingActivity}
                  leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-x-auto space-y-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                  <th className="py-2.5 font-semibold">Timestamp</th>
                  <th className="py-2.5 font-semibold">Event Action</th>
                  <th className="py-2.5 font-semibold">Actor</th>
                  <th className="py-2.5 font-semibold">Target Employee</th>
                  <th className="py-2.5 font-semibold">Entity</th>
                  <th className="py-2.5 font-semibold">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {isLoadingActivity ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                      Loading persistent activity logs...
                    </td>
                  </tr>
                ) : displayActivityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                      No activity logs match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayActivityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--bg-card-subtle)]/50">
                      <td className="py-3 text-[var(--text-muted)] font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className="font-mono text-[11px] font-bold text-[#D9B66F] block">
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="text-[var(--text-primary)] font-semibold leading-tight">
                          {log.actorName || 'System'}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] capitalize">
                          {log.actorRole || 'system'}
                        </span>
                      </td>
                      <td className="py-3">
                        {log.targetEmployeeName ? (
                          <div className="text-[var(--text-primary)] font-medium">
                            {log.targetEmployeeName}
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#D9B66F]/10 text-[#D9B66F] border border-[#D9B66F]/20">
                          {log.entityType}
                        </span>
                      </td>
                      <td className="py-3 text-[var(--text-secondary)] max-w-md">
                        {log.details ? (
                          <div className="space-y-0.5 text-[11px]">
                            {log.details.title && (
                              <div><strong>Task:</strong> "{log.details.title}"</div>
                            )}
                            {log.details.previous_progress !== undefined && (
                              <div>
                                <strong>Progress:</strong> {log.details.previous_progress}% → {log.details.new_progress}%
                              </div>
                            )}
                            {log.details.previous_status && log.details.new_status && (
                              <div>
                                <strong>Status:</strong> {log.details.previous_status} → {log.details.new_status}
                              </div>
                            )}
                            {log.details.blockers && (
                              <div className="text-red-500 font-semibold">
                                <strong>Blocker:</strong> "{log.details.blockers}"
                              </div>
                            )}
                            {log.details.comment && (
                              <div><strong>Comment:</strong> "{log.details.comment}"</div>
                            )}
                            {log.details.proposed_deadline && (
                              <div>
                                <strong>Proposed Deadline:</strong> {log.details.proposed_deadline}
                                {log.details.reason && ` (Reason: "${log.details.reason}")`}
                              </div>
                            )}
                            {log.details.check_in_time && (
                              <div><strong>Check-in:</strong> {log.details.check_in_time}</div>
                            )}
                            {log.details.assigned_count && (
                              <div className="text-emerald-600 font-semibold">
                                Assigned to {log.details.assigned_count} employees
                              </div>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              <div>
                Showing {totalActivityCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                {Math.min(currentPage * pageSize, totalActivityCount)} of {totalActivityCount} logged events
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || isLoadingActivity}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  className="text-xs h-8"
                >
                  Previous
                </Button>
                <span className="font-mono font-semibold text-[var(--text-primary)]">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || isLoadingActivity}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  className="text-xs h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ADMINISTRATIVE SECURITY AUDIT TRAIL */}
      {activeView === 'security' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Severity Filter & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] w-fit text-xs">
              {(
                [
                  { id: 'all', label: 'All Events' },
                  { id: 'info', label: 'Informational' },
                  { id: 'warning', label: 'Warnings' },
                  { id: 'security', label: 'Security Critical' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSeverityFilter(t.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    severityFilter === t.id
                      ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={secSearchQuery}
                onChange={(e) => setSecSearchQuery(e.target.value)}
                placeholder="Search action, actor, IP, target..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                  <th className="py-2.5 font-semibold">Timestamp</th>
                  <th className="py-2.5 font-semibold">Event Action</th>
                  <th className="py-2.5 font-semibold">Actor</th>
                  <th className="py-2.5 font-semibold">IP Address</th>
                  <th className="py-2.5 font-semibold">Target Subject</th>
                  <th className="py-2.5 font-semibold">Event Details</th>
                  <th className="py-2.5 font-semibold">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredSecLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                      No security audit events match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSecLogs.map((log) => {
                    const sevColor =
                      log.severity === 'security'
                        ? 'text-red-600 dark:text-red-400 font-bold'
                        : log.severity === 'warning'
                        ? 'text-amber-600 dark:text-amber-400 font-semibold'
                        : 'text-[var(--text-secondary)]';

                    return (
                      <tr key={log.id} className="hover:bg-[var(--bg-card-subtle)]/50">
                        <td className="py-3 text-[var(--text-muted)] font-mono text-[11px] whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3 font-mono text-[11px] font-bold text-[var(--text-primary)]">
                          {log.action}
                        </td>
                        <td className="py-3 text-[var(--text-primary)]">{log.performedBy}</td>
                        <td className="py-3 text-[var(--text-muted)] font-mono text-[11px]">
                          {log.ipAddress || 'Internal'}
                        </td>
                        <td className="py-3 text-[var(--text-secondary)]">{log.targetUser || '—'}</td>
                        <td className="py-3 text-[var(--text-secondary)] max-w-sm">{log.details}</td>
                        <td className={`py-3 capitalize ${sevColor}`}>{log.severity}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
