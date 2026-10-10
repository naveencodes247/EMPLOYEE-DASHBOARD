import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export interface BarDataPoint {
  day: string;
  hours: number;
  maxHours?: number;
  isActive?: boolean;
  tooltipText?: string;
}

export interface CompactBarChartProps {
  title?: string;
  totalTime?: string;
  subtitle?: string;
  data?: BarDataPoint[];
  onOpenDetails?: () => void;
  className?: string;
}

const DEFAULT_WEEKLY_DATA: BarDataPoint[] = [
  { day: 'S', hours: 0, maxHours: 8 },
  { day: 'M', hours: 6.5, maxHours: 8 },
  { day: 'T', hours: 7.2, maxHours: 8 },
  { day: 'W', hours: 6.0, maxHours: 8 },
  { day: 'T', hours: 7.8, maxHours: 8 },
  { day: 'F', hours: 5.4, maxHours: 8, isActive: true, tooltipText: '5h 23m' },
  { day: 'S', hours: 0, maxHours: 8 },
];

export const CompactBarChart: React.FC<CompactBarChartProps> = ({
  title = 'Progress',
  totalTime = '6.1 h',
  subtitle = 'Work Time this week',
  data = DEFAULT_WEEKLY_DATA,
  onOpenDetails,
  className = '',
}) => {
  return (
    <div className={`p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between ${className}`}>
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              {totalTime}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {subtitle}
            </span>
          </div>
        </div>

        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            aria-label="View detailed weekly report"
            className="w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bar Chart Visualization Area */}
      <div className="mt-6 pt-4 relative">
        <div className="h-28 flex items-end justify-between gap-2 px-1">
          {data.map((item, idx) => {
            const max = item.maxHours || 8;
            const percent = Math.min(100, Math.max(8, (item.hours / max) * 100));
            const isZero = item.hours === 0;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center relative group h-full justify-end">
                {/* Active Tooltip Badge (e.g. "5h 23m" from reference) */}
                {item.isActive && item.tooltipText && (
                  <div className="absolute -top-6 px-2 py-0.5 rounded-full bg-[#F8E7A1] text-[#222222] font-semibold text-[10px] shadow-xs select-none whitespace-nowrap z-10 animate-fadeIn">
                    {item.tooltipText}
                  </div>
                )}

                {/* Vertical guideline for active bar */}
                {item.isActive && (
                  <div className="absolute inset-y-0 w-px border-l border-dashed border-[#D9B66F]/60 -z-0" />
                )}

                {/* Bar pill */}
                <div
                  style={{ height: isZero ? '6px' : `${percent}%` }}
                  className={`w-2.5 sm:w-3 rounded-full transition-all duration-300 relative z-1 ${
                    item.isActive
                      ? 'bg-[#F8E7A1] dark:bg-[#D9B66F] shadow-xs ring-2 ring-[#D9B66F]/30'
                      : isZero
                      ? 'bg-[var(--border-subtle)]'
                      : 'bg-[#222222] dark:bg-[#E8E5DD]'
                  }`}
                  title={`${item.day}: ${item.hours} hours`}
                />

                {/* Day label */}
                <span
                  className={`mt-3 text-[11px] font-medium select-none ${
                    item.isActive
                      ? 'text-[#222222] dark:text-[#D9B66F] font-bold'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
