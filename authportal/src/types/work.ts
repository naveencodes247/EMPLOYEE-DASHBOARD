/**
 * Work Management Portal Types & Domain Models
 * Prepared for Supabase Auth, PostgreSQL RLS, and Storage integration.
 */

export type PortalRole = 'employee' | 'manager' | 'admin';

export type EmployeeTab =
  | 'overview'
  | 'tasks'
  | 'attendance'
  | 'reports'
  | 'calendar'
  | 'messages'
  | 'notifications'
  | 'profile';

export type ManagerTab =
  | 'overview'
  | 'approvals'
  | 'team'
  | 'tasks'
  | 'attendance'
  | 'reports'
  | 'calendar'
  | 'messages'
  | 'analytics'
  | 'profile';

export type AdminTab =
  | 'overview'
  | 'employees'
  | 'managers'
  | 'accounts'
  | 'approvals'
  | 'tasks'
  | 'attendance'
  | 'reports'
  | 'calendar'
  | 'messages'
  | 'analytics'
  | 'security'
  | 'audit'
  | 'settings';

export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'pending_approval' | 'completed' | 'rejected';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAssignee {
  id: string;
  employeeId: string;
  fullName: string;
  email?: string;
  jobTitle?: string;
  avatarUrl?: string | null;
  status: TaskStatus;
  progress: number;
  completionNotes?: string;
  completedAt?: string | null;
  blockers?: string;
  extensionRequestedDate?: string | null;
  extensionReason?: string;
  updatedAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  authorName?: string;
  authorRole?: string;
  comment: string;
  createdAt: string;
}

export interface TaskExtensionRequest {
  id: string;
  taskId: string;
  userId: string;
  employeeName?: string;
  employeeId?: string;
  proposedDeadline: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  attendanceRecordId: string;
  userId: string;
  employeeName?: string;
  employeeId?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ActivityLogEntry {
  id: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  targetEmployeeId?: string;
  targetEmployeeName?: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number; // 0 - 100
  assignedDate: string;
  startDate?: string;
  dueDate: string;
  subtasks: Subtask[];
  managerName?: string;
  assignedToEmployeeId?: string;
  assignedToEmployeeName?: string;
  assignees?: TaskAssignee[];
  comments?: TaskComment[];
  extensionRequests?: TaskExtensionRequest[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'present' | 'remote' | 'leave' | 'late' | 'on_break';

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  breakMinutes: number;
  totalHours: number;
  status: AttendanceStatus;
  employeeName?: string;
  employeeId?: string;
}

export type LeaveType = 'annual' | 'sick' | 'personal' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface ReportAttachment {
  id: string;
  reportId: string;
  employeeId: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize?: number;
  contentType?: string;
  createdAt?: string;
}

export interface DailyReport {
  id: string;
  date: string;
  taskId?: string;
  taskTitle?: string;
  description?: string;
  completedWork: string;
  workInProgress: string;
  progress?: number;
  blockers?: string;
  notes?: string;
  nextSteps?: string;
  submittedAt: string;
  employeeName?: string;
  employeeId?: string;
  managerFeedback?: string;
  reviewedAt?: string;
  status?: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'revision_requested';
  tasksCompleted?: string[];
  inProgress?: string[];
  hoursWorked?: number;
  imageUrls?: string[];
  attachments?: ReportAttachment[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'meeting' | 'deadline' | 'activity';
  date: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  attendees?: string[];
  project?: string;
  location?: string;
}

export type NotificationType =
  | 'task_assignment'
  | 'deadline_reminder'
  | 'manager_message'
  | 'meeting'
  | 'announcement';

export interface WorkNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface AccountApprovalRequest {
  id: string;
  fullName: string;
  email: string;
  requestedRole: 'employee' | 'manager';
  department: string;
  requestedAt: string;
  emailVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  assignedId?: string;
}

export interface ManagedAccount {
  id: string;
  systemId: string; // e.g. EMP-9102 or MGR-2018 or ADM-1001
  fullName: string;
  email: string;
  phone?: string | null;
  role: PortalRole;
  department: string;
  jobTitle: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLogin: string;
  avatarUrl?: string | null;
}

export interface TeamMember {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  jobTitle: string;
  department: string;
  avatarUrl: string | null;
  status: 'active' | 'leave';
  attendanceToday: {
    status: 'present' | 'remote' | 'on_break' | 'not_checked_in';
    checkInTime: string | null;
    hoursWorked: number;
  };
  activeTasksCount: number;
  completedTasksCount: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  targetUser?: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
  severity: 'info' | 'warning' | 'security';
}

export interface PortalSecuritySettings {
  enforce2FA: boolean;
  sessionTimeoutMinutes: number;
  passwordExpiryDays: number;
  ipAllowlistEnabled: boolean;
  allowedIpRanges: string;
  workHoursStart: string;
  workHoursEnd: string;
  allowRemoteCheckIn: boolean;
  dailyReportsRequired: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: PortalRole;
  jobTitle: string;
  department: string;
  employeeId: string;
  avatarUrl: string | null;
  timezone: string;
  todayAttendance: {
    isCheckedIn: boolean;
    checkInTime: string | null;
    isOnBreak: boolean;
    breakStartTime: string | null;
    elapsedWorkingMinutes: number;
  };
}
