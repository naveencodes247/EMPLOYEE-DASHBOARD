import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  AlertTriangle,
  Users,
  CheckCircle2,
  ExternalLink,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { CalendarEvent } from '../../types/work';

interface EmployeeCalendarProps {
  events: CalendarEvent[];
}

export const EmployeeCalendar: React.FC<EmployeeCalendarProps> = ({ events }) => {
  const [filterType, setFilterType] = useState<'all' | 'meeting' | 'deadline'>('all');
  const [activeMeetingModal, setActiveMeetingModal] = useState<CalendarEvent | null>(null);

  const filteredEvents = events.filter((e) => {
    return filterType === 'all' || e.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Work Schedule & Calendar
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Synchronized sprint meetings, deadline milestones, and scheduled team syncs.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Events
          </button>
          <button
            type="button"
            onClick={() => setFilterType('meeting')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'meeting'
                ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Meetings
          </button>
          <button
            type="button"
            onClick={() => setFilterType('deadline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'deadline'
                ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Deadlines
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#D9B66F] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    evt.type === 'deadline'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-[#F8E7A1] text-[#222222]'
                  }`}
                >
                  {evt.type}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">{evt.date}</span>
                {evt.project && (
                  <>
                    <span className="text-[var(--border-subtle)]">·</span>
                    <span className="text-xs text-[var(--text-muted)]">{evt.project}</span>
                  </>
                )}
              </div>

              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                {evt.title}
              </h3>

              <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#D9B66F]" />
                  <span>{evt.startTime} - {evt.endTime}</span>
                </span>

                {evt.attendees && evt.attendees.length > 0 && (
                  <span className="flex items-center gap-1 text-[var(--text-muted)]">
                    <Users className="w-3.5 h-3.5" />
                    <span>{evt.attendees.join(', ')}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Link action if meeting */}
            {evt.meetingLink && (
              <div className="shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveMeetingModal(evt)}
                  leftIcon={<Video className="w-3.5 h-3.5 text-[#D9B66F]" />}
                  rightIcon={<ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />}
                >
                  Join Meeting
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Secure Conference Room Modal */}
      {activeMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D9B66F]/20 border border-[#D9B66F]/40 flex items-center justify-center text-[#D9B66F]">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {activeMeetingModal.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
                    {activeMeetingModal.startTime} - {activeMeetingModal.endTime} · {activeMeetingModal.date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMeetingModal(null)}
                className="w-8 h-8 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Enterprise Encrypted Conference Link</span>
              </div>
              <p className="text-xs font-mono text-[#D9B66F] break-all select-all">
                {activeMeetingModal.meetingLink}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveMeetingModal(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  // In iframe environments, avoid window.open, show copied confirmation
                  navigator.clipboard?.writeText(activeMeetingModal.meetingLink || '');
                  setActiveMeetingModal(null);
                }}
                leftIcon={<Video className="w-3.5 h-3.5" />}
              >
                Copy Link & Connect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
