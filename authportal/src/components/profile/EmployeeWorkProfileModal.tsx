import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  CheckSquare,
  Clock,
  FileText,
  Mail,
  Briefcase,
  Building,
  Shield,
  Edit2,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  History,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ProfilePictureUploader } from '../employee/ProfilePictureUploader';
import { portalApi } from '../../services/portalApi';
import type { Task, AttendanceRecord, DailyReport, UserProfile, ActivityLogEntry } from '../../types/work';

interface EmployeeWorkProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeProfileId: string;
  employeeSystemId?: string;
  employeeName?: string;
  isAdmin?: boolean;
  onProfileUpdated?: (updated: any) => void;
}

export const EmployeeWorkProfileModal: React.FC<EmployeeWorkProfileModalProps> = ({
  isOpen,
  onClose,
  employeeProfileId,
  employeeSystemId,
  employeeName,
  isAdmin = false,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'tasks' | 'attendance' | 'reports' | 'activity'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loaded Employee Details
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [reports, setDailyReports] = useState<DailyReport[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);

  // Admin Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    const targetId = employeeProfileId || employeeSystemId;
    if (!isOpen || !targetId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setIsEditing(false);
    setSaveSuccess(null);

    Promise.all([
      portalApi.getEmployeeWorkDetails(targetId),
      portalApi.getActivityLogs({ employeeId: targetId, pageSize: 50 }),
    ])
      .then(([workRes, actRes]) => {
        if (!isMounted) return;
        if (workRes.success && workRes.data) {
          setProfile(workRes.data.profile);
          setTasks(workRes.data.tasks);
          setAttendance(workRes.data.attendance);
          setDailyReports(workRes.data.reports);

          if (workRes.data.profile) {
            setEditName(workRes.data.profile.name || '');
            setEditJobTitle(workRes.data.profile.jobTitle || '');
            setEditDepartment(workRes.data.profile.department || '');
            setEditEmail(workRes.data.profile.email || '');
          }
        } else {
          setError(workRes.error || 'Failed to load employee work profile details.');
        }

        if (actRes.data) {
          setActivityLogs(actRes.data);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err?.message || 'Unexpected error fetching employee data.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, employeeProfileId, employeeSystemId]);

  if (!isOpen) return null;

  const handleAdminSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setSaveSuccess(null);
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editEmail && !emailRegex.test(editEmail.trim())) {
      setError('Please provide a valid email format.');
      setIsSaving(false);
      return;
    }

    try {
      const res = await portalApi.updateUserProfile(profile.id, {
        full_name: editName.trim(),
        job_title: editJobTitle.trim(),
        department_id: editDepartment.trim(),
        email: editEmail.trim(),
      });

      if (res.success && res.profile) {
        setProfile((prev) => (prev ? { ...prev, ...res.profile } : (res.profile || null)));
        setIsEditing(false);
        setSaveSuccess('Employee profile updated and persisted to database.');
        if (onProfileUpdated) {
          onProfileUpdated(res.profile);
        }
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        setError(res.error || 'Failed to save profile changes.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = profile?.name || employeeName || 'Employee';
  const displayId = profile?.employeeId || employeeSystemId || 'EMP';
  const isProfileIncomplete = !profile?.name || profile.name === 'outFyt Member';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4 bg-[var(--bg-card-subtle)]/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl border-2 border-[var(--border-subtle)] bg-[#C5A059]/20 flex items-center justify-center overflow-hidden font-bold text-lg text-[#C5A059] shrink-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || displayId}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{displayName}</h3>
                <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  {displayId}
                </span>
                {isProfileIncomplete && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                    Profile not completed
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {profile?.jobTitle || 'No title set'} · {profile?.department || 'Operations'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit Profile
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[var(--border-subtle)] flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-[#C5A059] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Overview &amp; Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'border-[#C5A059] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Assigned Tasks ({tasks.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-[#C5A059] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Attendance Logs ({attendance.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-[#C5A059] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daily Reports ({reports.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-[#C5A059] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity History ({activityLogs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
              <p className="text-xs text-[var(--text-muted)]">Loading verified work history...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Profile & Overview */}
              {activeTab === 'profile' && (
                <div className="space-y-5">
                  {isEditing && isAdmin ? (
                    <form onSubmit={handleAdminSave} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Manage Profile Photo
                        </h4>
                        <ProfilePictureUploader
                          userId={profile?.id}
                          currentAvatarUrl={profile?.avatarUrl || null}
                          userName={displayName}
                          onUpdateAvatar={(newUrl) => {
                            setProfile((prev) => (prev ? { ...prev, avatarUrl: newUrl } : null));
                            if (onProfileUpdated) {
                              onProfileUpdated({ id: profile?.id, avatarUrl: newUrl });
                            }
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Full Legal / Display Name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                        <Input
                          label="Work Contact Email"
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Job Title / Designation"
                          value={editJobTitle}
                          onChange={(e) => setEditJobTitle(e.target.value)}
                          required
                        />
                        <Input
                          label="Department"
                          value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSaving}
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          isLoading={isSaving}
                          leftIcon={<Save className="w-3.5 h-3.5" />}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                          <span className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-[#C5A059]" /> Work Email
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)] block break-all">
                            {profile?.email || 'No email assigned'}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                          <span className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-[#C5A059]" /> System Identifier
                          </span>
                          <span className="text-xs font-mono font-bold text-[var(--text-primary)] block">
                            {displayId}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                          <span className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3 text-[#C5A059]" /> Designation
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)] block">
                            {profile?.jobTitle || 'Associate'}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                          <span className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                            <Building className="w-3 h-3 text-[#C5A059]" /> Department
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)] block">
                            {profile?.department || 'Operations'}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                          <span className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                            <User className="w-3 h-3 text-[#C5A059]" /> Contact Phone
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)] block">
                            {profile?.phone || 'Not provided'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)]">Timezone Configuration:</span>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {profile?.timezone || 'Asia/Kolkata'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Assigned Deliverables */}
              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                      <p className="text-xs text-[var(--text-muted)]">No active tasks assigned to this employee.</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-primary)]">{task.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                task.priority === 'high'
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : task.priority === 'medium'
                                  ? 'bg-blue-500/10 text-blue-600'
                                  : 'bg-zinc-500/10 text-zinc-600'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{task.description}</p>
                          <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)] pt-1">
                            <span>Due: {task.dueDate}</span>
                            <span>·</span>
                            <span>Progress: {task.progress}%</span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize shrink-0 self-start sm:self-center ${
                            task.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : task.status === 'in_progress'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Attendance Logs */}
              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  {attendance.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                      <p className="text-xs text-[var(--text-muted)]">No attendance history logged for this account.</p>
                    </div>
                  ) : (
                    attendance.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-[var(--text-primary)]">{rec.date}</span>
                          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                            <span>In: {rec.checkIn || 'N/A'}</span>
                            <span>·</span>
                            <span>Out: {rec.checkOut || 'Active'}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-[var(--text-primary)] block">
                            {rec.totalHours || 0} hrs
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                            {rec.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Daily Reports */}
              {activeTab === 'reports' && (
                <div className="space-y-3">
                  {reports.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                      <p className="text-xs text-[var(--text-muted)]">No daily reports submitted yet.</p>
                    </div>
                  ) : (
                    reports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2.5 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-primary)] font-mono">{rep.date}</span>
                            {rep.taskTitle && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[#D9B66F] border border-amber-500/20 text-[10px] font-semibold">
                                Task: {rep.taskTitle}
                              </span>
                            )}
                            {typeof rep.progress === 'number' && rep.progress > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                                {rep.progress}%
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-[var(--text-muted)]">
                            {rep.hoursWorked || 8} hrs recorded
                          </span>
                        </div>

                        {rep.description && rep.description !== rep.completedWork && (
                          <div>
                            <span className="font-semibold text-[var(--text-muted)] block text-[10px] uppercase">
                              Description:
                            </span>
                            <p className="text-[var(--text-primary)] text-[11px] mt-0.5">
                              {rep.description}
                            </p>
                          </div>
                        )}

                        <div>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 block text-[11px]">
                            Completed Tasks:
                          </span>
                          <p className="text-[var(--text-secondary)] text-[11px] mt-0.5 whitespace-pre-line">
                            {rep.completedWork || 'None reported'}
                          </p>
                        </div>

                        {rep.workInProgress && (
                          <div>
                            <span className="font-semibold text-blue-600 dark:text-blue-400 block text-[11px]">
                              Work in Progress:
                            </span>
                            <p className="text-[var(--text-secondary)] text-[11px] mt-0.5 whitespace-pre-line">
                              {rep.workInProgress}
                            </p>
                          </div>
                        )}

                        {rep.blockers && rep.blockers !== 'None reported.' && (
                          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                            <span className="font-bold block text-[10px] uppercase">Blockers:</span>
                            <p className="text-[11px] mt-0.5">{rep.blockers}</p>
                          </div>
                        )}

                        {rep.imageUrls && rep.imageUrls.length > 0 && (
                          <div className="pt-1.5 border-t border-[var(--border-subtle)]/70">
                            <span className="font-semibold text-[var(--text-muted)] block text-[10px] uppercase mb-1.5">
                              Attachments ({rep.imageUrls.length}):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {rep.imageUrls.map((url, imgIdx) => (
                                <a
                                  key={imgIdx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-14 h-14 rounded-lg overflow-hidden border border-[var(--border-subtle)] hover:border-[#D9B66F] transition-all shrink-0 group relative block"
                                >
                                  <img src={url} alt={`Attachment ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 5: Activity History */}
              {activeTab === 'activity' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-2 border-b border-[var(--border-subtle)]">
                    <span className="font-semibold uppercase tracking-wider">
                      Immutable Activity &amp; Audit Trail ({activityLogs.length})
                    </span>
                    <span>Most recent events first</span>
                  </div>

                  {activityLogs.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                      No activity logs recorded for this employee yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--text-primary)] capitalize">
                                {log.actionType.replace(/_/g, ' ')}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#D9B66F]/15 text-[#D9B66F]">
                                {log.entityType}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--text-secondary)]">
                              {log.details ? (
                                <span>
                                  {log.details.title && `Task: "${log.details.title}" `}
                                  {log.details.previous_progress !== undefined &&
                                    `Progress: ${log.details.previous_progress}% → ${log.details.new_progress}% `}
                                  {log.details.new_status && `Status changed to: ${log.details.new_status} `}
                                  {log.details.blockers && `Reported Blocker: "${log.details.blockers}" `}
                                  {log.details.comment && `Comment: "${log.details.comment}" `}
                                  {log.details.proposed_deadline && `Proposed Deadline: ${log.details.proposed_deadline} `}
                                  {log.details.check_in_time && `Check-in: ${log.details.check_in_time} `}
                                </span>
                              ) : (
                                'Action recorded in audit log.'
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              Actor: <strong>{log.actorName || 'System'}</strong> ({log.actorRole || 'system'})
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
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-end bg-[var(--bg-card-subtle)]/30">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
