import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  Calendar,
  X,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  Layers,
  MessageSquare,
  Send,
  AlertTriangle,
  History,
  FileText,
  User,
  ArrowUpRight,
  Upload,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { portalApi } from '../../services/portalApi';
import type { Task, TaskPriority, TaskStatus, UserProfile, ActivityLogEntry, TaskComment } from '../../types/work';

interface EmployeeTasksProps {
  tasks: Task[];
  userProfile?: UserProfile | null;
  onUpdateTaskStatus: (
    taskId: string,
    newStatus: TaskStatus,
    progress?: number,
    completionNotes?: string,
    blockers?: string
  ) => Promise<{ success: boolean; error?: string } | void> | void;
  onUpdateTaskProgress: (
    taskId: string,
    newProgress: number
  ) => Promise<{ success: boolean; error?: string } | void> | void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onOpenReportModal?: (taskId?: string) => void;
  onCompleteTaskDeliverable?: (taskId: string) => void;
}

export const EmployeeTasks: React.FC<EmployeeTasksProps> = ({
  tasks,
  userProfile,
  onUpdateTaskStatus,
  onUpdateTaskProgress,
  onToggleSubtask,
  onOpenReportModal,
  onCompleteTaskDeliverable,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modal editing draft states
  const [draftStatus, setDraftStatus] = useState<TaskStatus>('not_started');
  const [draftProgress, setDraftProgress] = useState<number>(0);
  const [draftNotes, setDraftNotes] = useState<string>('');
  const [draftBlockers, setDraftBlockers] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Extension request draft state
  const [showExtensionForm, setShowExtensionForm] = useState(false);
  const [proposedDeadline, setProposedDeadline] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);
  const [extensionSuccess, setExtensionSuccess] = useState(false);
  const [extensionError, setExtensionError] = useState<string | null>(null);

  // Comment draft state
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentList, setCommentList] = useState<TaskComment[]>([]);

  // Employee Activity History Drawer state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Sync modal draft when selected task changes
  useEffect(() => {
    if (selectedTask) {
      // Find current employee's specific assignment record
      const myAssignee = selectedTask.assignees?.find(
        (a) =>
          a.id === userProfile?.id ||
          a.employeeId === userProfile?.employeeId ||
          a.id === userProfile?.employeeId
      );

      setDraftStatus(myAssignee ? myAssignee.status : selectedTask.status);
      setDraftProgress(myAssignee ? myAssignee.progress : selectedTask.progress);
      setDraftNotes(myAssignee?.completionNotes || '');
      setDraftBlockers(myAssignee?.blockers || '');
      setCommentList(selectedTask.comments || []);
      setSaveSuccess(false);
      setSaveError(null);
      setShowExtensionForm(false);
      setExtensionSuccess(false);
      setExtensionError(null);
    }
  }, [selectedTask, userProfile]);

  const handleSaveTaskChanges = async () => {
    if (!selectedTask) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await onUpdateTaskStatus(
        selectedTask.id,
        draftStatus,
        draftProgress,
        draftNotes,
        draftBlockers
      );
      if (res && (res as any).success === false) {
        setSaveError((res as any).error || 'Failed to save task update.');
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Network error updating task.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !proposedDeadline || !extensionReason.trim()) return;

    setIsSubmittingExtension(true);
    setExtensionError(null);
    try {
      const res = await portalApi.requestTaskExtension(
        selectedTask.id,
        proposedDeadline,
        extensionReason.trim(),
        userProfile?.id
      );
      if (res.success) {
        setExtensionSuccess(true);
        setExtensionReason('');
        setTimeout(() => {
          setShowExtensionForm(false);
          setExtensionSuccess(false);
        }, 2000);
      } else {
        setExtensionError(res.error || 'Failed to submit extension request.');
      }
    } catch (err: any) {
      setExtensionError(err?.message || 'Unexpected error requesting deadline extension.');
    } finally {
      setIsSubmittingExtension(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;

    setIsPostingComment(true);
    try {
      const res = await portalApi.addTaskComment(
        selectedTask.id,
        newComment.trim(),
        userProfile?.id
      );
      if (res.success && res.comment) {
        setCommentList((prev) => [...prev, res.comment!]);
        setNewComment('');
      } else {
        alert(res.error || 'Failed to post comment.');
      }
    } catch (err: any) {
      alert(err?.message || 'Unexpected error posting comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleOpenActivityHistory = async () => {
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    try {
      const res = await portalApi.getActivityLogs({
        employeeId: userProfile?.id,
        pageSize: 50,
      });
      if (res.data) {
        setActivityLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900/60 font-semibold text-[11px] inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'pending_approval':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold text-[11px] inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Pending Approval</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 font-semibold text-[11px] inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span>Revision Requested</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-semibold text-[11px] inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>In Progress</span>
          </span>
        );
      case 'blocked':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-semibold text-[11px] inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Blocked</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold text-[11px] inline-flex items-center gap-1">
            <Circle className="w-3 h-3" />
            <span>Not Started</span>
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
            Medium Priority
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Low Priority
          </span>
        );
    }
  };

  // Synchronize modal state if updated in background
  const activeTask = selectedTask ? tasks.find((t) => t.id === selectedTask.id) || selectedTask : null;
  const myAssignee = activeTask?.assignees?.find(
    (a) =>
      a.id === userProfile?.id ||
      a.employeeId === userProfile?.employeeId ||
      a.id === userProfile?.employeeId
  );
  const myAssigneeDetails = myAssignee;
  const effectiveStatus = myAssignee?.status || activeTask?.status || 'not_started';

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              My Assigned Tasks
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Active workplace deliverables assigned to your account with independent status and progress tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenActivityHistory}
            className="text-xs shadow-xs"
          >
            <History className="w-3.5 h-3.5 mr-1 text-[#D9B66F]" />
            <span>My Activity History</span>
          </Button>
          <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
            {filteredTasks.length} tasks
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, description, or project name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#D9B66F] outline-none text-[var(--text-primary)] transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 px-3 text-xs rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="h-10 px-3 text-xs rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task List Container */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              No tasks assigned yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Your account has no active tasks or deliverables assigned by team managers.
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              No tasks match your criteria
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Try adjusting your search terms or clearing your status filters to view other assigned work.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const myAssignment = task.assignees?.find(
              (a) =>
                a.id === userProfile?.id ||
                a.employeeId === userProfile?.employeeId ||
                a.id === userProfile?.employeeId
            );
            const effectiveStatus = myAssignment ? myAssignment.status : task.status;
            const effectiveProgress = myAssignment ? myAssignment.progress : task.progress;
            const hasBlocker = Boolean(myAssignment?.blockers || effectiveStatus === 'blocked');

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`p-5 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs group ${
                  hasBlocker
                    ? 'border-red-500/40 hover:border-red-500'
                    : 'border-[var(--border-subtle)] hover:border-[#D9B66F]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#D9B66F]">
                        {task.id}
                      </span>
                      <span className="text-[var(--border-subtle)]">·</span>
                      <span className="text-xs font-semibold text-[var(--text-muted)]">
                        {task.project}
                      </span>
                      {getPriorityBadge(task.priority)}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] group-hover:text-[#D9B66F] transition-colors">
                      {task.title}
                    </h3>

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>

                    {myAssignment?.blockers && (
                      <div className="text-[11px] text-red-500 font-semibold flex items-center gap-1 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Blocker Reported: {myAssignment.blockers}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                    {getStatusBadge(effectiveStatus)}
                    <span className="text-[11px] font-medium text-[var(--text-muted)]">
                      Due {task.dueDate}
                    </span>
                  </div>
                </div>

                {/* Progress and Subtasks Footer */}
                <div className="mt-4 pt-3.5 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-4">
                    <span>
                      Subtasks: {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                    </span>
                    <span>Assigned by {task.managerName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-[var(--text-primary)]">
                      {effectiveProgress}%
                    </span>
                    <div className="w-24 h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${effectiveProgress}%` }}
                        className={`h-full rounded-full transition-all ${
                          effectiveStatus === 'completed'
                            ? 'bg-emerald-500'
                            : hasBlocker
                            ? 'bg-red-500'
                            : 'bg-[#D9B66F]'
                        }`}
                      />
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Details Modal / Drawer */}
      {activeTask && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
        >
          <div className="absolute inset-0" onClick={() => setSelectedTask(null)} />

          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-2xl p-6 sm:p-7 z-10 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[#D9B66F]">
                    {activeTask.id}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">· {activeTask.project}</span>
                </div>
                <h2 id="task-detail-title" className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  {activeTask.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                Description & Instructions
              </label>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                {activeTask.description}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[11px] text-[var(--text-muted)] block mb-1">Priority</span>
                {getPriorityBadge(activeTask.priority)}
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <span className="text-[11px] text-[var(--text-muted)] block mb-1">Due Date</span>
                <span className="font-semibold text-[var(--text-primary)]">{activeTask.dueDate}</span>
              </div>
            </div>

            {/* Workflow Banner for Pending Approval or Rejection */}
            {effectiveStatus === 'pending_approval' && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Deliverable Awaiting Manager Review</span>
                  <span className="text-[11px] opacity-90">
                    You have submitted your daily work report and proof image. Status will update to Completed upon MAN01 review and approval.
                  </span>
                </div>
              </div>
            )}

            {effectiveStatus === 'rejected' && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2.5 text-xs text-red-700 dark:text-red-300">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Correction Requested by Manager</span>
                    <span className="text-[11px] opacity-90">
                      {myAssignee?.blockers || myAssignee?.completionNotes || 'Manager requested revisions on your submitted deliverables.'}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedTask(null);
                    if (onCompleteTaskDeliverable) onCompleteTaskDeliverable(activeTask.id);
                    else if (onOpenReportModal) onOpenReportModal(activeTask.id);
                  }}
                  className="w-full text-xs shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Resubmit Work Report with Proof Image
                </Button>
              </div>
            )}

            {effectiveStatus === 'completed' && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Deliverable Approved & Completed</span>
                  <span className="text-[11px] opacity-90">
                    Your deliverable was reviewed and approved by management.
                  </span>
                </div>
              </div>
            )}

            {/* Direct Status Selection (Employees can only select not_started, in_progress, blocked) */}
            {effectiveStatus !== 'completed' && effectiveStatus !== 'pending_approval' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                  Your Assignment Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['not_started', 'in_progress', 'blocked'] as TaskStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setDraftStatus(st);
                        if (st === 'not_started') setDraftProgress(0);
                        else if (draftProgress === 0) setDraftProgress(50);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        draftStatus === st
                          ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] border-transparent shadow-xs'
                          : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#D9B66F]'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mandatory Deliverable Completion Action */}
            {effectiveStatus !== 'completed' && effectiveStatus !== 'pending_approval' && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-[#D9B66F]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#D9B66F]" />
                    Complete Work Deliverable
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#D9B66F]">Mandatory Review</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Completing a task requires submitting a work report and uploading a proof image for management approval.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedTask(null);
                    if (onCompleteTaskDeliverable) onCompleteTaskDeliverable(activeTask.id);
                    else if (onOpenReportModal) onOpenReportModal(activeTask.id);
                  }}
                  className="w-full text-xs shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Submit Work Report & Proof Image for Approval
                </Button>
              </div>
            )}

            {/* Progress Slider (Individual progress) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--text-muted)] uppercase">Your Assignment Progress</span>
                <span className="font-mono text-[var(--text-primary)]">{draftProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={draftProgress}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val === 100 && effectiveStatus !== 'completed' && effectiveStatus !== 'pending_approval') {
                    setSelectedTask(null);
                    if (onCompleteTaskDeliverable) onCompleteTaskDeliverable(activeTask.id);
                    else if (onOpenReportModal) onOpenReportModal(activeTask.id);
                  } else {
                    setDraftProgress(val);
                    if (val > 0 && draftStatus === 'not_started') setDraftStatus('in_progress');
                  }
                }}
                className="w-full accent-[#D9B66F] cursor-pointer"
              />
            </div>

            {/* Blocker Reporting Section */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-[var(--text-muted)] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span>Report Blocker / Impediment</span>
                </label>
                {draftBlockers && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftBlockers('');
                      if (draftStatus === 'blocked') setDraftStatus('in_progress');
                    }}
                    className="text-[11px] text-amber-500 hover:underline font-medium cursor-pointer"
                  >
                    Clear Blocker
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={draftBlockers}
                onChange={(e) => {
                  setDraftBlockers(e.target.value);
                  if (e.target.value.trim() && draftStatus !== 'blocked') {
                    setDraftStatus('blocked');
                  }
                }}
                placeholder="Explain what is blocking progress (e.g. Waiting on API credentials, merge conflict)..."
                className="w-full p-2.5 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-red-400 outline-none text-[var(--text-primary)] resize-none"
              />
            </div>

            {/* Completion Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                Completion Notes & Deliverable Links
              </label>
              <textarea
                rows={2}
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                placeholder="Document your specific achievements, code deliverables, notes, or PR links..."
                className="w-full p-2.5 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#D9B66F] outline-none text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] resize-none"
              />
            </div>

            {/* Deadline Extension Request Section */}
            <div className="p-3 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-[var(--text-muted)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D9B66F]" />
                  <span>Request Deadline Extension</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowExtensionForm(!showExtensionForm)}
                  className="text-xs text-[#D9B66F] hover:underline font-semibold cursor-pointer"
                >
                  {showExtensionForm ? 'Cancel Request' : '+ Request New Date'}
                </button>
              </div>

              {myAssigneeDetails?.extensionRequestedDate && (
                <div className="text-[11px] p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                  ⏳ Extension requested to <strong>{myAssigneeDetails.extensionRequestedDate}</strong>.
                  {myAssigneeDetails.extensionReason && ` ("${myAssigneeDetails.extensionReason}")`}
                </div>
              )}

              {showExtensionForm && (
                <form onSubmit={handleRequestExtension} className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-primary)] mb-1">
                      Proposed New Deadline
                    </label>
                    <input
                      type="date"
                      value={proposedDeadline}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setProposedDeadline(e.target.value)}
                      required
                      className="w-full p-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-primary)] mb-1">
                      Reason for Extension
                    </label>
                    <textarea
                      rows={2}
                      value={extensionReason}
                      onChange={(e) => setExtensionReason(e.target.value)}
                      required
                      placeholder="Explain justification for deadline revision..."
                      className="w-full p-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  {extensionError && (
                    <div className="text-[11px] text-red-500">{extensionError}</div>
                  )}
                  {extensionSuccess && (
                    <div className="text-[11px] text-emerald-600 font-semibold">
                      ✓ Extension request submitted to manager successfully!
                    </div>
                  )}
                  <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingExtension} className="text-xs">
                    Submit Extension Request
                  </Button>
                </form>
              )}
            </div>

            {/* Task Discussion & Comments */}
            <div className="p-3 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2.5">
              <label className="text-xs font-semibold uppercase text-[var(--text-muted)] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#D9B66F]" />
                <span>Task Comments & Discussion ({commentList.length})</span>
              </label>

              {commentList.length > 0 && (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {commentList.map((c) => (
                    <div key={c.id} className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <strong className="text-[var(--text-primary)]">{c.authorName} ({c.authorRole})</strong>
                        <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[var(--text-secondary)]">{c.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post comment or ask question..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                />
                <Button type="submit" variant="outline" size="sm" isLoading={isPostingComment} disabled={!newComment.trim()}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>

            {/* Feedback Alerts */}
            {saveError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Progress and notes saved to Supabase successfully!</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-[var(--border-subtle)]">
              {onOpenReportModal && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTask(null);
                    onOpenReportModal(activeTask.id);
                  }}
                  className="text-xs"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  <span>Submit Work Report</span>
                </Button>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTask(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  onClick={handleSaveTaskChanges}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Save Updates
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Activity History Modal */}
      {isHistoryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
        >
          <div className="absolute inset-0" onClick={() => setIsHistoryModalOpen(false)} />

          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-2xl p-6 sm:p-7 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-[#D9B66F]" />
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    My Activity History & Audit Trail
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Chronological audit log of your workplace tasks, reports, attendance, and updates.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                Loading activity history from database...
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                No activity records logged yet for your account.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)] capitalize">
                          {log.actionType.replace(/_/g, ' ')}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#D9B66F]/10 text-[#D9B66F]">
                          {log.entityType}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {log.details ? (
                          <span>
                            {log.details.title && `Task: "${log.details.title}" `}
                            {log.details.previous_progress !== undefined &&
                              `Progress updated: ${log.details.previous_progress}% → ${log.details.new_progress}% `}
                            {log.details.new_status && `Status: ${log.details.new_status} `}
                            {log.details.blockers && `Blocker: "${log.details.blockers}" `}
                            {log.details.comment && `Comment: "${log.details.comment}" `}
                            {log.details.proposed_deadline && `Proposed date: ${log.details.proposed_deadline} `}
                            {log.details.check_in_time && `Check-in time: ${log.details.check_in_time} `}
                          </span>
                        ) : (
                          'Action recorded.'
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--text-muted)] shrink-0">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
