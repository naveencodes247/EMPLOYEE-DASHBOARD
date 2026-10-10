import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Users,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { CalendarEvent, TeamMember } from '../../types/work';

interface ManagerCalendarProps {
  events: CalendarEvent[];
  teamMembers: TeamMember[];
  onAddEvent: (event: CalendarEvent) => void;
}

export const ManagerCalendar: React.FC<ManagerCalendarProps> = ({
  events,
  teamMembers,
  onAddEvent,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-10-12');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');
  const [type, setType] = useState<'meeting' | 'deadline' | 'activity'>('meeting');
  const [location, setLocation] = useState('Engineering Room 1 / Virtual');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddEvent({
      id: `cal-${Date.now()}`,
      title: title.trim(),
      type,
      date,
      startTime,
      endTime,
      meetingLink: type === 'meeting' ? 'https://meet.company.internal/team-sync' : undefined,
      attendees: ['Engineering Team'],
      location,
    });

    setTitle('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Team Schedule & Milestone Calendar
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Coordinate standups, milestone deadlines, and 1-on-1 reviews.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="text-xs shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1 text-[#D9B66F]" />
          <span>Schedule Team Event</span>
        </Button>
      </div>

      {/* Events Grid */}
      <div className="space-y-3">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#D9B66F]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#D9B66F]/20 text-[#222222] dark:text-[#F8E7A1] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#D9B66F]" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{evt.title}</h3>
                {/* Clean unboxed metadata */}
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-0.5">
                  <span>{evt.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{evt.startTime} - {evt.endTime}</span>
                  {evt.location && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{evt.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {evt.meetingLink && (
                <a
                  href={evt.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] hover:border-[#D9B66F] text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5 transition-colors"
                >
                  <Video className="w-3.5 h-3.5 text-[#D9B66F]" />
                  <span>Join Meeting</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] p-6 space-y-4 animate-scaleUp shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Schedule Team Event
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Event Title *"
                placeholder="e.g. Architecture Sprint Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date *"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Event Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                  >
                    <option value="meeting">Team Meeting</option>
                    <option value="deadline">Sprint Deadline</option>
                    <option value="activity">Team Activity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <Input
                  label="End Time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              <Input
                label="Location or Room"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Create Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
