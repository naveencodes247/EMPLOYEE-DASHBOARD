import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Users,
  UserCheck,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Task, TaskPriority, TaskStatus, TeamMember, TaskAssignee } from '../../types/work';

interface ManagerTasksProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  isAssignModalOpen: boolean;
  onOpenAssignModal: () => void;
  onCloseAssignModal: () => void;
  onCreateTask: (task: Omit<Task, 'id'> & { assigneeIds?: string[] }) => Promise<{ success: boolean; assignedCount?: number; message?: string; error?: string } | void> | void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onReviewExtension?: (requestId: string, decision: 'approved' | 'rejected', note?: string) => Promise<void> | void;
  preselectedAssignee?: { employeeId: string; employeeName: string } | null;
  managerName?: string;
}

type AssignmentMode = 'individual' | 'multiple' | 'team';

export const ManagerTasks: React.FC<ManagerTasksProps> = ({
  tasks,
  teamMembers,
  isAssignModalOpen,
  onOpenAssignModal,
  onCloseAssignModal,
  onCreateTask,
  onUpdateTask,
  onReviewExtension,
  preselectedAssignee,
  managerName = 'Engineering Lead',
}) => {
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Default dynamic due date (7 days from today)
  const defaultDueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // Form state for creating a task
  const [assignMode, setAssignMode] = useState<AssignmentMode>('individual');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('Core Operations');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(() => {
    if (preselectedAssignee?.employeeId) {
      const match = teamMembers.find(
        (m) => m.employeeId === preselectedAssignee.employeeId || m.id === preselectedAssignee.employeeId
      );
      return match ? [match.id] : [];
    }
    return teamMembers[0] ? [teamMembers[0].id] : [];
  });
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);

  // Submission & feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update selected employee when preselected changes
  useEffect(() => {
    if (preselectedAssignee?.employeeId) {
      const match = teamMembers.find(
        (m) => m.employeeId === preselectedAssignee.employeeId || m.id === preselectedAssignee.employeeId
      );
      if (match) {
        setAssignMode('individual');
        setSelectedAssigneeIds([match.id]);
      }
    }
  }, [preselectedAssignee, teamMembers]);

  // Handle mode switches
  const handleModeChange = (mode: AssignmentMode) => {
    setAssignMode(mode);
    setSubmitFeedback(null);
    if (mode === 'individual') {
      // Pick first member if multiple were selected
      setSelectedAssigneeIds(selectedAssigneeIds[0] ? [selectedAssigneeIds[0]] : (teamMembers[0] ? [teamMembers[0].id] : []));
    } else if (mode === 'team') {
      // Select all eligible team members (EMP01 through EMP10)
      setSelectedAssigneeIds(teamMembers.map((m) => m.id));
    }
  };

  const handleToggleAssignee = (id: string) => {
    if (assignMode === 'individual') {
      setSelectedAssigneeIds([id]);
    } else {
      setSelectedAssigneeIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
  };

  const handleSelectAllAssignees = () => {
    setSelectedAssigneeIds(teamMembers.map((m) => m.id));
  };

  const handleClearAllAssignees = () => {
    setSelectedAssigneeIds([]);
  };

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `sub-${Date.now()}`, title: subtaskInput.trim(), completed: false },
    ]);
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmitNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let targetIds = [...selectedAssigneeIds];
    if (assignMode === 'team') {
      targetIds = teamMembers.map((m) => m.id);
    }

    if (targetIds.length === 0) {
      setSubmitFeedback({
        type: 'error',
        message: 'Please select at least one eligible employee to assign this deliverable.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    const assignedMembers = teamMembers.filter((m) => targetIds.includes(m.id));
    const names = assignedMembers.map((m) => m.fullName).join(', ');

    try {
      const res = await onCreateTask({
        title: title.trim(),
        description: description.trim() || 'Work deliverable assigned by department manager.',
        project: project.trim() || 'Core Operations',
        priority,
        status: 'not_started',
        progress: 0,
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || defaultDueDate,
        managerName,
        assignedToEmployeeId: targetIds[0],
        assignedToEmployeeName: names || 'Unassigned',
        assigneeIds: targetIds,
        subtasks: subtasks.length > 0 ? subtasks : [
          { id: `sub-init-1`, title: 'Initial deliverable scope review', completed: false },
        ],
      });

      if (res && res.success === false) {
        setSubmitFeedback({
          type: 'error',
          message: res.error || 'Failed to assign deliverable to employees.',
        });
      } else {
        const count = res?.assignedCount || targetIds.length;
        const msg = res?.message || `Task assigned successfully to ${count} employees.`;
        setSubmitFeedback({
          type: 'success',
          message: `✓ ${msg}`,
        });

        // Reset and close after brief confirmation
        setTimeout(() => {
          setTitle('');
          setDescription('');
          setSubtasks([]);
          setDueDate(defaultDueDate);
          setSubmitFeedback(null);
          onCloseAssignModal();
        }, 1600);
      }
    } catch (err: any) {
      setSubmitFeedback({
        type: 'error',
        message: err?.message || 'Database error creating task assignment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesFilter = filterStatus === 'all' || t.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(q) ||
      t.project.toLowerCase().includes(q) ||
      (t.assignedToEmployeeName && t.assignedToEmployeeName.toLowerCase().includes(q)) ||
      (t.assignees && t.assignees.some((a) => a.fullName.toLowerCase().includes(q) || a.employeeId.toLowerCase().includes(q)));
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'in_progress':
        return <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'blocked':
        return <span className="text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Blocked</span>;
      default:
        return <span className="text-[var(--text-muted)] font-medium text-[11px]">Not Started</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Task Assignment & Delivery
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Create, assign, monitor, and resolve blockers across all direct reports.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSubmitFeedback(null);
            onOpenAssignModal();
          }}
          className="text-xs shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1 text-[#D9B66F]" />
          <span>Assign New Task</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Interactive segmented controls for status filter */}
        <div
          role="group"
          aria-label="Filter tasks by status"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs"
        >
          {(
            [
              { id: 'all', label: 'All Tasks' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'blocked', label: 'Blocked' },
              { id: 'not_started', label: 'Not Started' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${filterStatus === tab.id
                  ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, assignees, IDs..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#D9B66F]/40"
          />
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
            No tasks match your selected filter criteria.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isBlocked = task.status === 'blocked';
            const assignees = task.assignees || [];
            const hasMultipleAssignees = assignees.length > 1;
            const isExpanded = expandedTaskId === task.id;
            const blockedAssignees = assignees.filter((a) => a.status === 'blocked' || (a.blockers && a.blockers.trim() !== ''));
            const pendingExtensions = (task.extensionRequests || []).filter((r) => r.status === 'pending');

            // Overdue check
            const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date(new Date().toDateString());

            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl bg-[var(--bg-card)] border transition-all space-y-3.5 ${
                  isBlocked || blockedAssignees.length > 0
                    ? 'border-red-500/40 shadow-xs'
                    : 'border-[var(--border-subtle)] hover:border-[#D9B66F]/40'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[var(--text-muted)]">
                      {task.id}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                      {task.title}
                    </h3>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="capitalize font-semibold text-[var(--text-primary)]">
                      {task.status.replace('_', ' ')}
                    </span>
                    <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
                    <span className="capitalize text-[11px] font-medium">
                      {task.priority} priority
                    </span>
                    <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
                    <span className={`text-[11px] ${isOverdue ? 'text-red-500 font-bold' : 'text-[var(--text-muted)]'}`}>
                      Due {task.dueDate} {isOverdue && '(Overdue)'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {task.description}
                </p>

                {/* Overall Rollup Progress */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#D9B66F]" />
                      <span>
                        Assignees: <strong className="text-[var(--text-primary)]">{task.assignedToEmployeeName || 'Unassigned'}</strong>
                        {assignees.length > 0 && ` (${assignees.length} assigned)`}
                      </span>
                    </span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{task.progress}% Overall</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-card-subtle)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isCompleted
                          ? 'bg-emerald-500'
                          : isBlocked || blockedAssignees.length > 0
                            ? 'bg-amber-500'
                            : 'bg-[#D9B66F]'
                        }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>

                {/* Blocker Alert Banner if any assignee is blocked */}
                {blockedAssignees.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Active Blocker Reported ({blockedAssignees.length} employee{blockedAssignees.length > 1 ? 's' : ''})</span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateTask(task.id, { status: 'in_progress' })}
                        className="text-[11px] h-7 border-red-300 text-red-600 dark:text-red-300 hover:bg-red-500/10"
                      >
                        Acknowledge & Unblock
                      </Button>
                    </div>
                    {blockedAssignees.map((ba) => (
                      <div key={ba.id} className="text-[11px] pl-5 text-[var(--text-secondary)]">
                        <strong>{ba.fullName} ({ba.employeeId}):</strong> {ba.blockers || 'Reported blocked on milestone delivery.'}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending Extension Requests */}
                {pendingExtensions.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Deadline Extension Requested</span>
                    </div>
                    {pendingExtensions.map((req) => (
                      <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs">
                        <div>
                          <span className="font-semibold text-[var(--text-primary)]">Proposed Deadline: {req.proposedDeadline}</span>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Reason: "{req.reason}"</p>
                        </div>
                        {onReviewExtension && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[11px] h-7"
                              onClick={() => onReviewExtension(req.id, 'rejected', 'Declined due to release milestones')}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-[11px] h-7"
                              onClick={() => onReviewExtension(req.id, 'approved', 'Approved by manager')}
                            >
                              Approve Extension
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Multi-Employee Independent Progress Breakdown */}
                {assignees.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="text-xs font-semibold text-[#D9B66F] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>
                        {isExpanded ? 'Hide' : 'View'} Independent Progress for {assignees.length} Assignees
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2.5 animate-fadeIn">
                        <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          Individual Employee Assignments ({assignees.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {assignees.map((assignee) => (
                            <div
                              key={assignee.id}
                              className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="truncate">
                                  <span className="font-semibold text-[var(--text-primary)] block truncate">
                                    {assignee.fullName}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)]">
                                    {assignee.employeeId} · {assignee.jobTitle}
                                  </span>
                                </div>
                                <div className="shrink-0">{getStatusBadge(assignee.status)}</div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                                  <span>Progress</span>
                                  <span className="font-mono font-bold text-[var(--text-primary)]">{assignee.progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-[var(--bg-card-subtle)] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      assignee.status === 'completed' ? 'bg-emerald-500' : 'bg-[#D9B66F]'
                                    }`}
                                    style={{ width: `${assignee.progress}%` }}
                                  />
                                </div>
                              </div>

                              {assignee.completedAt && (
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                                  Completed: {new Date(assignee.completedAt).toLocaleDateString()}
                                </div>
                              )}
                              {assignee.blockers && (
                                <div className="text-[10px] text-red-500 font-medium">
                                  Blocker: {assignee.blockers}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subtasks summary & Manager Status Actions */}
                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-[var(--text-muted)] text-[11px]">
                    Subtasks: {task.subtasks.filter((s) => s.completed).length} / {task.subtasks.length} resolved
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status === 'blocked' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateTask(task.id, { status: 'in_progress' })}
                        className="text-xs text-amber-600 dark:text-amber-400 border-amber-300"
                      >
                        Clear Blocker
                      </Button>
                    )}

                    {task.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateTask(task.id, { status: 'completed', progress: 100 })}
                        className="text-xs"
                      >
                        Mark Completed
                      </Button>
                    )}

                    <select
                      value={task.priority}
                      onChange={(e) => onUpdateTask(task.id, { priority: e.target.value as TaskPriority })}
                      className="px-2 py-1 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Task Modal */}
      {isAssignModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="w-full max-w-xl bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Assign Workplace Deliverable
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Allocate work items to direct reports with isolated tracking and deadlines.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseAssignModal}
                disabled={isSubmitting}
                aria-label="Close dialog"
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 ASSIGNMENT MODES SELECTOR */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Assignment Mode
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs">
                <button
                  type="button"
                  onClick={() => handleModeChange('individual')}
                  className={`py-2 px-2 rounded-xl font-semibold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    assignMode === 'individual'
                      ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="text-[11px] leading-tight">Individual (Mode A)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('multiple')}
                  className={`py-2 px-2 rounded-xl font-semibold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    assignMode === 'multiple'
                      ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[11px] leading-tight">Multiple (Mode B)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('team')}
                  className={`py-2 px-2 rounded-xl font-semibold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    assignMode === 'team'
                      ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px] leading-tight">Entire Team (Mode C)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitNewTask} className="space-y-4">
              <Input
                label="Task Title *"
                placeholder="e.g. Implement OAuth Single Sign-On and Multi-Factor Auth"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSubmitting}
              />

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Deliverable Scope & Instructions
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  disabled={isSubmitting}
                  placeholder="Provide explicit delivery instructions and acceptance criteria..."
                  className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#D9B66F]/40"
                />
              </div>

              {/* Mode C: Entire Team Banner */}
              {assignMode === 'team' && (
                <div className="p-3.5 rounded-2xl bg-[#D9B66F]/10 border border-[#D9B66F]/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D9B66F]">
                    <UserCheck className="w-4 h-4" />
                    <span>Entire-Team Assignment Mode (All {teamMembers.length} Members)</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    This task will be simultaneously assigned to all {teamMembers.length} active team members ({teamMembers.map(m => m.employeeId).join(', ')}). The backend creates <strong>{teamMembers.length} individual assignment records</strong> with independent status and progress tracking.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {teamMembers.map((m) => (
                      <span key={m.id} className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] font-mono font-semibold text-[var(--text-primary)]">
                        {m.employeeId} · {m.fullName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode A & B Employee Selection */}
              {assignMode !== 'team' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                      {assignMode === 'individual'
                        ? 'Select Individual Employee *'
                        : `Select Target Employees * (${selectedAssigneeIds.length} selected)`}
                    </label>
                    {assignMode === 'multiple' && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={handleSelectAllAssignees}
                          className="text-[#D9B66F] hover:underline font-medium cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-[var(--text-muted)]">·</span>
                        <button
                          type="button"
                          onClick={handleClearAllAssignees}
                          className="text-[var(--text-muted)] hover:text-red-500 font-medium cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-2 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] max-h-48 overflow-y-auto space-y-1.5">
                    {teamMembers.map((m) => {
                      const isSelected = selectedAssigneeIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleToggleAssignee(m.id)}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#D9B66F]/10 border-[#D9B66F]'
                              : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[#D9B66F]/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <input
                              type={assignMode === 'individual' ? 'radio' : 'checkbox'}
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded accent-[#D9B66F] pointer-events-none"
                            />
                            <div className="w-6 h-6 rounded-lg bg-[#D9B66F]/20 text-[#222222] dark:text-[#F8E7A1] text-[10px] font-bold flex items-center justify-center shrink-0">
                              {m.fullName
                                ? m.fullName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()
                                : m.employeeId}
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-semibold text-[var(--text-primary)] block leading-tight truncate">
                                {m.fullName}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] leading-tight block truncate">
                                {m.employeeId} · {m.jobTitle}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="text-[10px] font-bold text-[#D9B66F] px-1.5 py-0.5 rounded bg-[#D9B66F]/15 shrink-0">
                              Selected
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    disabled={isSubmitting}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#D9B66F]/40"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <Input
                  label="Project Stream"
                  value={project}
                  disabled={isSubmitting}
                  onChange={(e) => setProject(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Due Date *"
                  type="date"
                  value={dueDate}
                  disabled={isSubmitting}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              {/* Subtasks addition */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Deliverable Subtasks / Checklist
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subtaskInput}
                    disabled={isSubmitting}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    placeholder="Add checklist item..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddSubtask} disabled={isSubmitting}>
                    Add
                  </Button>
                </div>

                {subtasks.length > 0 && (
                  <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                    {subtasks.map((s) => (
                      <div
                        key={s.id}
                        className="p-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                      >
                        <span className="text-[var(--text-primary)]">{s.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(s.id)}
                          className="text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Real Feedback Alert */}
              {submitFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                    submitFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'bg-red-500/10 border border-red-500/20 text-red-500 font-semibold'
                  }`}
                >
                  {submitFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{submitFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <Button variant="outline" size="sm" type="button" onClick={onCloseAssignModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                  {assignMode === 'team'
                    ? `Assign to All ${teamMembers.length} Members`
                    : assignMode === 'multiple'
                    ? `Assign to ${selectedAssigneeIds.length} Members`
                    : 'Assign to Employee'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
