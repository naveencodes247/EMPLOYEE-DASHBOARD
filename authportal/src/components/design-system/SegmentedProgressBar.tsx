import React from 'react';

export interface Segment {
  label?: string;
  percentage: number;
  color?: 'yellow' | 'charcoal' | 'muted' | 'gold' | 'custom';
  customClass?: string;
}

export interface SegmentedProgressBarProps {
  title?: string;
  totalPercent?: string | number;
  segments: Segment[];
  className?: string;
}

export const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = ({
  title,
  totalPercent,
  segments,
  className = '',
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header if provided */}
      {(title || totalPercent !== undefined) && (
        <div className="flex items-center justify-between">
          {title && (
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </span>
          )}
          {totalPercent !== undefined && (
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {typeof totalPercent === 'number' ? `${totalPercent}%` : totalPercent}
            </span>
          )}
        </div>
      )}

      {/* Segment Percent Indicators */}
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1">
        {segments.map((seg, idx) => (
          <span key={idx}>{seg.percentage}%</span>
        ))}
      </div>

      {/* Segmented Capsule Track */}
      <div className="h-6 w-full flex items-center gap-1.5 p-1 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] overflow-hidden">
        {segments.map((seg, idx) => {
          const colorStyles = {
            yellow: 'bg-[#F8E7A1] text-[#222222] font-semibold',
            charcoal: 'bg-[#222222] dark:bg-[#3A3C44] text-white font-medium',
            muted: 'bg-[var(--border-subtle)] text-[var(--text-muted)]',
            gold: 'bg-[#D9B66F] text-white font-semibold',
            custom: seg.customClass || '',
          }[seg.color || 'yellow'];

          return (
            <div
              key={idx}
              style={{ flex: Math.max(1, seg.percentage) }}
              className={`h-full rounded-full flex items-center justify-center text-[10px] transition-all duration-300 px-2 truncate ${colorStyles}`}
            >
              {seg.label && <span className="truncate">{seg.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
