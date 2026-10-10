import React from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';

export interface ScheduleEvent {
  id: string;
  title: string;
  timeSlot: string; // e.g. "9:00 am"
  dayIndex: number; // 0 to 5
  color?: 'charcoal' | 'white' | 'gold';
  attendeesCount?: number;
  subtitle?: string;
}

export interface TimelineScheduleProps {
  currentMonth?: string;
  days?: { name: string; date: number }[];
  events?: ScheduleEvent[];
  className?: string;
}

const DEFAULT_DAYS = [
  { name: 'Mon', date: 22 },
  { name: 'Tue', date: 23 },
  { name: 'Wed', date: 24 },
  { name: 'Thu', date: 25 },
  { name: 'Fri', date: 26 },
  { name: 'Sat', date: 27 },
];

const DEFAULT_EVENTS: ScheduleEvent[] = [
  {
    id: '1',
    title: 'Weekly Team Sync',
    subtitle: 'Discuss progress on projects',
    timeSlot: '9:00 am',
    dayIndex: 2,
    color: 'charcoal',
    attendeesCount: 3,
  },
  {
    id: '2',
    title: 'Onboarding Session',
    subtitle: 'Introduction for new hires',
    timeSlot: '10:00 am',
    dayIndex: 3,
    color: 'white',
    attendeesCount: 2,
  },
];

const TIME_SLOTS = ['8:00 am', '9:00 am', '10:00 am', '11:00 am'];

export const TimelineSchedule: React.FC<TimelineScheduleProps> = ({
  currentMonth = 'September 2024',
  days = DEFAULT_DAYS,
  events = DEFAULT_EVENTS,
  className = '',
}) => {
  return (
    <div className={`p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] ${className}`}>
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">
          August
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {currentMonth}
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">
          October
        </span>
      </div>

      {/* Week Days Header Row */}
      <div className="grid grid-cols-6 gap-2 text-center pb-3 border-b border-[var(--border-subtle)]">
        {days.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              {day.name}
            </span>
            <span className={`text-xs font-semibold mt-0.5 ${idx === 2 ? 'text-[#D9B66F] font-bold' : 'text-[var(--text-primary)]'}`}>
              {day.date}
            </span>
          </div>
        ))}
      </div>

      {/* Time Slots & Event Rows */}
      <div className="mt-4 space-y-3 relative">
        {TIME_SLOTS.map((slot) => {
          const slotEvents = events.filter((e) => e.timeSlot === slot);

          return (
            <div key={slot} className="flex items-center gap-4 min-h-[42px] border-b border-dashed border-[var(--border-subtle)]/70 pb-2.5">
              <span className="text-[11px] font-mono text-[var(--text-muted)] w-14 shrink-0">
                {slot}
              </span>

              <div className="flex-1 flex items-center gap-2">
                {slotEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-2.5 shadow-xs transition-all ${
                      evt.color === 'charcoal'
                        ? 'bg-[#222222] dark:bg-[#2C2E36] text-white'
                        : 'bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-[11px] leading-tight">
                        {evt.title}
                      </span>
                      {evt.subtitle && (
                        <span className={`text-[9px] leading-tight ${evt.color === 'charcoal' ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>
                          {evt.subtitle}
                        </span>
                      )}
                    </div>

                    {evt.attendeesCount && (
                      <div className="flex items-center -space-x-1.5 ml-1">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                          evt.color === 'charcoal' ? 'bg-[#D9B66F] text-[#222222]' : 'bg-[#222222] text-white'
                        }`}>
                          <Users className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
