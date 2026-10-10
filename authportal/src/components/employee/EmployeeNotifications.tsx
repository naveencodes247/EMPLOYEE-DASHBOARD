import React, { useState } from 'react';
import {
  Bell,
  Check,
  Briefcase,
  AlertTriangle,
  MessageSquare,
  Calendar,
  Megaphone,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { WorkNotification } from '../../types/work';

interface EmployeeNotificationsProps {
  notifications: WorkNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const EmployeeNotifications: React.FC<EmployeeNotificationsProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const filteredNotifications = notifications.filter((notif) => {
    const matchesUnread = !unreadOnly || !notif.read;
    const matchesType = filterType === 'all' || notif.type === filterType;
    return matchesUnread && matchesType;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: WorkNotification['type']) => {
    switch (type) {
      case 'task_assignment':
        return <Briefcase className="w-4 h-4 text-[#D9B66F]" />;
      case 'deadline_reminder':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'manager_message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      default:
        return <Megaphone className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Notifications & System Alerts
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Operational dispatches, deadline reminders, and management approvals.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
          >
            {unreadOnly ? 'Show All' : `Unread Only (${unreadCount})`}
          </Button>

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onMarkAllAsRead}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
            filterType === 'all'
              ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('task_assignment')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
            filterType === 'task_assignment'
              ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Task Assignments
        </button>
        <button
          type="button"
          onClick={() => setFilterType('deadline_reminder')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
            filterType === 'deadline_reminder'
              ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Deadlines
        </button>
        <button
          type="button"
          onClick={() => setFilterType('announcement')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
            filterType === 'announcement'
              ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Announcements
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
            <Bell className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              No notifications to display
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              You are all caught up with your operational alerts.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => onMarkAsRead(notif.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 shadow-xs ${
                !notif.read
                  ? 'bg-[#F8E7A1]/15 dark:bg-[#38321B]/30 border-[#D9B66F]/50'
                  : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#D9B66F]" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono block pt-0.5">
                    {notif.timestamp}
                  </span>
                </div>
              </div>

              {!notif.read && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notif.id);
                  }}
                  title="Mark as read"
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 p-1 rounded-md"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
