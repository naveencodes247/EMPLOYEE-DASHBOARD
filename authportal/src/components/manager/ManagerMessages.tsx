import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Bell,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Link as LinkIcon,
  Copy,
  Share2,
  ExternalLink,
  Users,
  Layers,
  Mail,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { portalApi } from '../../services/portalApi';
import type { WorkNotification, Task, TeamMember } from '../../types/work';

interface ManagerMessagesProps {
  notifications: WorkNotification[];
  tasks?: Task[];
  teamMembers?: TeamMember[];
  onBroadcastAnnouncement?: (title: string, message: string) => void;
  onRefresh?: () => void;
}

export const ManagerMessages: React.FC<ManagerMessagesProps> = ({
  notifications,
  tasks = [],
  teamMembers = [],
  onBroadcastAnnouncement,
  onRefresh,
}) => {
  const [activeMode, setActiveMode] = useState<'announcement' | 'task_link'>('announcement');

  // Announcement State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'selected'>('all');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    success: boolean;
    recipientCount: number;
    shareUrl: string;
    emailStatus: string;
  } | null>(null);

  // Task Link State
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [isBroadcastingTask, setIsBroadcastingTask] = useState(false);
  const [taskLinkResult, setTaskLinkResult] = useState<{
    success: boolean;
    recipientCount: number;
    shareUrl: string;
    emailStatus: string;
  } | null>(null);

  // Copy Feedback
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const generatedAnnouncementUrl = broadcastTitle.trim()
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?announcement=${encodeURIComponent(
        broadcastTitle.trim()
      )}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/?announcement=latest`;

  const generatedTaskUrl = selectedTask
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?taskId=${selectedTask.id}`
    : '';

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleShareWhatsApp = (text: string, url: string) => {
    const fullText = `${text}\n\nAccess Link: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank');
  };

  const handleShareMailClient = (subject: string, body: string, url: string) => {
    const fullBody = `${body}\n\nDirect Link: ${url}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`, '_blank');
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    setBroadcastResult(null);

    const recipientUserIds =
      targetType === 'selected'
        ? teamMembers.filter((m) => selectedEmployeeIds.includes(m.employeeId || '')).map((m) => m.id)
        : undefined;

    const res = await portalApi.broadcastAnnouncement({
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      recipientUserIds,
      sendEmail: true,
    });

    setIsBroadcasting(false);

    if (res.success) {
      setBroadcastResult({
        success: true,
        recipientCount: res.recipientCount,
        shareUrl: res.shareUrl,
        emailStatus: res.emailStatus,
      });

      if (onBroadcastAnnouncement) {
        onBroadcastAnnouncement(broadcastTitle.trim(), broadcastMessage.trim());
      }
      if (onRefresh) {
        onRefresh();
      }
    } else {
      setBroadcastResult({
        success: false,
        recipientCount: 0,
        shareUrl: '',
        emailStatus: res.error || 'Failed to deliver broadcast.',
      });
    }
  };

  const handleBroadcastTaskLink = async () => {
    if (!selectedTask) return;

    setIsBroadcastingTask(true);
    setTaskLinkResult(null);

    const res = await portalApi.generateTaskShareLink({
      taskId: selectedTask.id,
      broadcastNotification: true,
    });

    setIsBroadcastingTask(false);

    if (res.success) {
      setTaskLinkResult({
        success: true,
        recipientCount: res.recipientCount,
        shareUrl: res.shareUrl,
        emailStatus: res.emailStatus,
      });
      if (onRefresh) {
        onRefresh();
      }
    } else {
      setTaskLinkResult({
        success: false,
        recipientCount: 0,
        shareUrl: '',
        emailStatus: res.error || 'Failed to generate task link.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Team Broadcasts & Direct Link Generator
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Publish announcements, generate shareable links for WhatsApp/email, and broadcast to all 10 employees.
          </p>
        </div>

        {/* Feature Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setActiveMode('announcement')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'announcement'
                ? 'bg-[#D9B66F] text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Announcements</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('task_link')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'task_link'
                ? 'bg-[#D9B66F] text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Task Direct Links</span>
          </button>
        </div>
      </div>

      {/* MODE 1: Announcements Broadcast */}
      {activeMode === 'announcement' && (
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-5">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#D9B66F]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Create Team Announcement & Link
            </h3>
          </div>

          {broadcastResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                broadcastResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {broadcastResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span>
                  {broadcastResult.success
                    ? `Broadcast Delivered to ${broadcastResult.recipientCount} Team Members`
                    : 'Broadcast Failed'}
                </span>
              </div>
              <p className="leading-relaxed opacity-90">{broadcastResult.emailStatus}</p>
              {broadcastResult.shareUrl && (
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-[var(--text-primary)]">
                  <span className="truncate">{broadcastResult.shareUrl}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(broadcastResult.shareUrl)}
                    className="p-1 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] hover:text-[#D9B66F] cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedUrl === broadcastResult.shareUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
            <Input
              label="Announcement Headline *"
              placeholder="e.g. Sprint 42 Freeze & Release Branch Cutoff"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Directive Body & Details *
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={3}
                required
                placeholder="Detail required actions, dates, and instructions for team members..."
                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#D9B66F]/40"
              />
            </div>

            {/* Recipient Scope */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-2">
                Target Recipients
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'all'}
                    onChange={() => setTargetType('all')}
                    className="text-[#D9B66F] focus:ring-[#D9B66F]"
                  />
                  <span>All 10 Team Members (EMP1–EMP10)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'selected'}
                    onChange={() => setTargetType('selected')}
                    className="text-[#D9B66F] focus:ring-[#D9B66F]"
                  />
                  <span>Select Specific Employees</span>
                </label>
              </div>

              {targetType === 'selected' && (
                <div className="mt-3 p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {teamMembers.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(m.employeeId || '')}
                        onChange={(e) => {
                          const id = m.employeeId || '';
                          setSelectedEmployeeIds(
                            e.target.checked
                              ? [...selectedEmployeeIds, id]
                              : selectedEmployeeIds.filter((x) => x !== id)
                          );
                        }}
                        className="rounded text-[#D9B66F] focus:ring-[#D9B66F]"
                      />
                      <span className="font-mono text-[11px] font-semibold text-[#D9B66F]">
                        {m.employeeId}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Generated Link & Actions */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-2">
              <span className="font-bold text-[var(--text-secondary)] uppercase text-[10px] block">
                Shareable Announcement Link (Method 1: Copy & Share)
              </span>
              <div className="flex items-center justify-between gap-2 font-mono text-xs text-[var(--text-primary)]">
                <span className="truncate">{generatedAnnouncementUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(generatedAnnouncementUrl)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:text-[#D9B66F] font-sans text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  {copiedUrl === generatedAnnouncementUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border-subtle)]/60">
                <button
                  type="button"
                  onClick={() =>
                    handleShareWhatsApp(
                      `*outFyt Announcement:* ${broadcastTitle || 'Important Update'}\n${broadcastMessage}`,
                      generatedAnnouncementUrl
                    )
                  }
                  className="px-3 py-1 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share via WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleShareMailClient(
                      broadcastTitle || 'outFyt Team Announcement',
                      broadcastMessage,
                      generatedAnnouncementUrl
                    )
                  }
                  className="px-3 py-1 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Share via Email</span>
                </button>
              </div>
            </div>

            {/* Broadcast Submission Button (Method 2) */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isBroadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
                className="shadow-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                <span>
                  {isBroadcasting
                    ? 'Delivering Broadcast...'
                    : 'Broadcast to Portal & Mailboxes (Method 2)'}
                </span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODE 2: Task Direct Link Generator */}
      {activeMode === 'task_link' && (
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#D9B66F]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Generate Task Direct Link & Distribute
            </h3>
          </div>

          {taskLinkResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                taskLinkResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {taskLinkResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span>
                  {taskLinkResult.success ? 'Task Link Generated & Broadcast' : 'Distribution Failed'}
                </span>
              </div>
              <p className="leading-relaxed opacity-90">{taskLinkResult.emailStatus}</p>
              {taskLinkResult.shareUrl && (
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-[var(--text-primary)]">
                  <span className="truncate">{taskLinkResult.shareUrl}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(taskLinkResult.shareUrl)}
                    className="p-1 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] hover:text-[#D9B66F] cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedUrl === taskLinkResult.shareUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[var(--bg-input)] text-xs text-[var(--text-secondary)]">
              No tasks currently available. Create a task first in the Tasks tab to generate shareable links.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Select Task to Share *
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#D9B66F]/40"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.priority.toUpperCase()} · Due {t.dueDate})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTask && (
                <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text-primary)]">{selectedTask.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                        {selectedTask.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-[#D9B66F]/10 border border-[#D9B66F]/30 text-[#D9B66F] font-semibold text-[11px]">
                        Priority: {selectedTask.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[11px]">
                        Due: {selectedTask.dueDate}
                      </span>
                    </div>
                  </div>

                  {/* Share Link Box */}
                  <div className="pt-2 border-t border-[var(--border-subtle)]/70 space-y-2">
                    <span className="font-bold text-[var(--text-secondary)] uppercase text-[10px] block">
                      Direct Task Access Link (Requires Authorized Authentication)
                    </span>
                    <div className="flex items-center justify-between gap-2 font-mono text-xs text-[var(--text-primary)]">
                      <span className="truncate">{generatedTaskUrl}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(generatedTaskUrl)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:text-[#D9B66F] font-sans text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      >
                        {copiedUrl === generatedTaskUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleShareWhatsApp(
                            `*outFyt Task Assignment:* ${selectedTask.title}\nDue: ${selectedTask.dueDate}`,
                            generatedTaskUrl
                          )
                        }
                        className="px-3 py-1 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleShareMailClient(
                            `Task Assignment: ${selectedTask.title}`,
                            `Please review your assigned task: ${selectedTask.title}.\nDue Date: ${selectedTask.dueDate}`,
                            generatedTaskUrl
                          )
                        }
                        className="px-3 py-1 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Share via Email</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleBroadcastTaskLink}
                        disabled={isBroadcastingTask}
                        className="px-3 py-1 rounded-xl bg-[#D9B66F] hover:bg-[#c4a159] text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {isBroadcastingTask ? 'Broadcasting...' : 'Broadcast to Assignees'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Broadcast History */}
      <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          Recent Team Directives & Operational Notices
        </h3>

        {notifications.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] italic">
            No broadcast history recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {notifications.map((notif) => (
              <div key={notif.id} className="py-4 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#D9B66F]" />
                    {notif.title}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">{notif.timestamp}</span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">{notif.message}</p>
                {notif.actionUrl && (
                  <a
                    href={notif.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D9B66F] hover:underline"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
