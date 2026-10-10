import React, { useState } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  Briefcase,
  FileText,
  Calendar,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  XCircle,
} from 'lucide-react';
import type { Task, TaskPriority, TaskStatus, DailyReport } from '../../types/work';

interface AdminTasksProps {
  tasks: Task[];
  dailyReports?: DailyReport[];
  onSelectEmployee?: (employeeId: string) => void;
}

export const AdminTasks: React.FC<AdminTasksProps> = ({
  tasks,
  dailyReports = [],
  onSelectEmployee,
}) => {
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const projects = Array.from(new Set(tasks.map((t) => t.project).filter(Boolean)));
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    const matchesProj = filterProject === 'all' || t.project === filterProject;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'overdue'
        ? t.status !== 'completed' && t.dueDate && t.dueDate < todayStr
        : t.status === filterStatus);

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.project && t.project.toLowerCase().includes(q)) ||
      (t.managerName && t.managerName.toLowerCase().includes(q)) ||
      (t.assignedToEmployeeName && t.assignedToEmployeeName.toLowerCase().includes(q)) ||
      (t.assignees &&
        t.assignees.some(
          (a) =>
            a.fullName.toLowerCase().includes(q) ||
            (a.employeeId && a.employeeId.toLowerCase().includes(q))
        ));

    return matchesProj && matchesPriority && matchesStatus && matchesSearch;
  });

  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => t.status === 'in_progress' || t.status === 'not_started').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    overdue: tasks.filter((t) => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr).length,
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'high':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30';
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30';
      case 'blocked':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30';
      case 'pending_approval':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      default:
        return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Enterprise Deliverables & Task Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059]">
              {tasks.length} Total Deliverables
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Audit work items, individual assignments across all 10 employees, progress metrics, and submission approvals.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deliverables, owners, projects..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#D9B66F]/40"
          />
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Total Tasks</span>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-0.5">{stats.total}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[var(--bg-card-subtle)] flex items-center justify-center text-[#C5A059]">
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Active In-Flight</span>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{stats.active}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Delivered</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.completed}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Overdue Tasks</span>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-0.5">{stats.overdue}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-subtle)] text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-muted)]">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-muted)]">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="not_started">Not Started</option>
              <option value="overdue">Overdue</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* Project filter */}
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[var(--text-muted)]">Project:</span>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] outline-none max-w-[150px] truncate"
              >
                <option value="all">All Projects</option>
                {projects.map((proj) => (
                  <option key={proj} value={proj}>
                    {proj}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <span className="text-[11px] text-[var(--text-muted)]">
          Showing {filteredTasks.length} of {tasks.length} deliverables
        </span>
      </div>

      {/* Deliverables Table */}
      <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]/50 text-[var(--text-muted)]">
                <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                <th className="py-3 px-4 font-semibold">Deliverable &amp; Initiative</th>
                <th className="py-3 px-4 font-semibold">Assigning Manager</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Assigned Personnel</th>
                <th className="py-3 px-4 font-semibold">Aggregate Progress</th>
                <th className="py-3 px-4 font-semibold">Deadline</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No deliverables match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const isExpanded = expandedTaskId === t.id;
                  const assignees = t.assignees || [];
                  const isOverdue = t.status !== 'completed' && t.dueDate && t.dueDate < todayStr;

                  return (
                    <React.Fragment key={t.id}>
                      <tr
                        onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}
                        className={`hover:bg-[var(--bg-card-subtle)]/60 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-[var(--bg-card-subtle)]/40' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}
                            className="p-1 rounded-lg hover:bg-[var(--border-subtle)] text-[var(--text-muted)] transition-colors"
                            title={isExpanded ? 'Collapse assignees' : 'Expand all assignees'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#C5A059]" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--text-primary)] hover:text-[#C5A059] transition-colors">
                                {t.title}
                              </span>
                              {isOverdue && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                                  Overdue
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--text-muted)]">
                              <span className="font-medium text-[var(--text-secondary)]">{t.project}</span>
                              {t.startDate && (
                                <>
                                  <span>·</span>
                                  <span>Started {t.startDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <Briefcase className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                            <span className="font-medium">{t.managerName || 'Engineering Manager'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${getPriorityBadge(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                              {assignees.length > 0 ? `${assignees.length} assigned` : '1 assigned'}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[140px]">
                              {t.assignedToEmployeeName}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 w-32">
                            <div className="flex-1 h-2 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  t.progress === 100
                                    ? 'bg-emerald-500'
                                    : 'bg-[#C5A059]'
                                }`}
                                style={{ width: `${t.progress}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-semibold text-[var(--text-primary)]">
                              {t.progress}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span className={isOverdue ? 'font-bold text-red-600 dark:text-red-400' : 'text-[var(--text-muted)]'}>
                              {t.dueDate || 'Open'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${getStatusBadge(
                              t.status
                            )}`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable Individual Assignments Breakdown (Section 4C) */}
                      {isExpanded && (
                        <tr className="bg-[var(--bg-card-subtle)]/70">
                          <td colSpan={8} className="p-4 sm:p-5 border-y border-[var(--border-subtle)] space-y-4">
                            {/* Task Description & Meta Details */}
                            <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-subtle)] space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[var(--text-primary)]">Deliverable Scope &amp; Specifications:</span>
                                <span className="font-mono text-[10px] text-[var(--text-muted)]">ID: {t.id}</span>
                              </div>
                              <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                                {t.description || 'No detailed specifications filed for this deliverable.'}
                              </p>
                            </div>

                            {/* Multi-Employee Assignment Grid */}
                            <div>
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-subtle)]">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-[#C5A059]" />
                                  <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                                    Individual Employee Assignment Records ({assignees.length || 1})
                                  </h4>
                                </div>
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  Each employee maintains separate progress, submission, and completion status
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {(assignees.length > 0
                                  ? assignees
                                  : [
                                      {
                                        id: t.assignedToEmployeeId || 'primary',
                                        employeeId: t.assignedToEmployeeId || 'EMP',
                                        fullName: t.assignedToEmployeeName || 'Assigned Lead',
                                        jobTitle: 'Associate',
                                        status: t.status,
                                        progress: t.progress,
                                        completionNotes: '',
                                        completedAt: t.status === 'completed' ? t.updatedAt : null,
                                        blockers: '',
                                      },
                                    ]
                                ).map((assignee, idx) => {
                                  // Locate employee's submitted work report for this specific task
                                  const empReport = dailyReports.find(
                                    (r) =>
                                      r.taskId === t.id &&
                                      (r.employeeId === assignee.id ||
                                        r.employeeId === assignee.employeeId ||
                                        r.employeeName === assignee.fullName)
                                  );

                                  return (
                                    <div
                                      key={assignee.id || idx}
                                      className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5 shadow-2xs hover:border-[#C5A059]/40 transition-colors"
                                    >
                                      {/* Assignee identity header */}
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-8 h-8 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center font-bold text-[11px] text-[#C5A059] shrink-0">
                                            {(assignee.employeeId || 'EM').slice(-2).toUpperCase()}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-bold text-xs text-[var(--text-primary)]">
                                                {assignee.fullName}
                                              </span>
                                              <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[#C5A059]">
                                                {assignee.employeeId}
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-[var(--text-muted)]">
                                              {assignee.jobTitle || 'Team Member'}
                                            </p>
                                          </div>
                                        </div>

                                        {onSelectEmployee && (
                                          <button
                                            type="button"
                                            onClick={() => onSelectEmployee(assignee.id || assignee.employeeId)}
                                            className="p-1 rounded-lg hover:bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[#C5A059] transition-colors"
                                            title="Inspect full employee profile"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>

                                      {/* Individual Progress & Status */}
                                      <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[var(--text-muted)]">Assignment Status:</span>
                                            <span
                                              className={`px-2 py-0.2 rounded text-[10px] font-bold capitalize ${getStatusBadge(
                                                assignee.status as any
                                              )}`}
                                            >
                                              {assignee.status?.replace('_', ' ') || 'in progress'}
                                            </span>
                                          </div>
                                          <span className="font-mono font-bold text-[var(--text-primary)]">
                                            {assignee.progress || 0}%
                                          </span>
                                        </div>

                                        <div className="w-full h-1.5 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${
                                              assignee.progress === 100 ? 'bg-emerald-500' : 'bg-[#C5A059]'
                                            }`}
                                            style={{ width: `${assignee.progress || 0}%` }}
                                          />
                                        </div>
                                      </div>

                                      {/* Completion Timestamp & Blockers */}
                                      <div className="pt-1 text-[11px] space-y-1 text-[var(--text-muted)]">
                                        {assignee.completedAt ? (
                                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                            <Check className="w-3 h-3" />
                                            <span>
                                              Completed on {new Date(assignee.completedAt).toLocaleString()}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                                            <Clock className="w-3 h-3" />
                                            <span>Work actively in progress</span>
                                          </div>
                                        )}

                                        {assignee.completionNotes && (
                                          <p className="text-[10px] bg-[var(--bg-card-subtle)] p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] italic">
                                            &ldquo;{assignee.completionNotes}&rdquo;
                                          </p>
                                        )}

                                        {assignee.blockers && (
                                          <div className="flex items-start gap-1.5 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[10px]">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span>Reported Blocker: {assignee.blockers}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Work Report Submission Status (Section 4C & 4D) */}
                                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px]">
                                        <div className="flex items-center gap-1.5">
                                          <FileText className="w-3 h-3 text-[var(--text-muted)]" />
                                          <span className="text-[var(--text-muted)]">Work Report:</span>
                                          {empReport ? (
                                            <span
                                              className={`font-bold capitalize px-1.5 py-0.2 rounded ${
                                                empReport.status === 'approved'
                                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                  : empReport.status === 'rejected'
                                                  ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                              }`}
                                            >
                                              {empReport.status}
                                            </span>
                                          ) : (
                                            <span className="text-[var(--text-muted)] font-medium">
                                              Pending submission
                                            </span>
                                          )}
                                        </div>

                                        {empReport && (empReport.imageUrls?.length || 0) > 0 && (
                                          <span className="text-[10px] font-semibold text-[#C5A059]">
                                            {(empReport.imageUrls?.length || 0)} Proof Attachment(s)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
