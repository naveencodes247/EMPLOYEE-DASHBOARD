import React, { useState } from 'react';
import { ArrowUpRight, Play, Pause, Clock } from 'lucide-react';

export interface CircularTimerChartProps {
  title?: string;
  initialTime?: string;
  subtitle?: string;
  progressPercent?: number; // 0 to 100
  onOpenDetails?: () => void;
  className?: string;
}

export const CircularTimerChart: React.FC<CircularTimerChartProps> = ({
  title = 'Time tracker',
  initialTime = '02:35',
  subtitle = 'Work Time',
  progressPercent = 68,
  onOpenDetails,
  className = '',
}) => {
  const [isRunning, setIsRunning] = useState(false);

  // SVG circular arc calculation
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className={`p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </span>
        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            aria-label="View time tracking details"
            className="w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Circular Progress Gauge */}
      <div className="relative flex items-center justify-center my-4">
        <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 110 110">
          {/* Subtle tick background circle */}
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeDasharray="2 3"
            className="text-[var(--border-subtle)]"
          />
          {/* Active progress arc in warm yellow */}
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-[#F8E7A1] dark:text-[#D9B66F] transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-mono">
            {initialTime}
          </span>
          <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
            className="w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-primary)] transition-colors cursor-pointer active:scale-95"
          >
            {isRunning ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        <button
          type="button"
          aria-label="Time log summary"
          className="w-8 h-8 rounded-full bg-[#222222] dark:bg-[#33353D] text-white flex items-center justify-center hover:bg-[#333333] transition-colors cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-[#F8E7A1]" />
        </button>
      </div>
    </div>
  );
};
