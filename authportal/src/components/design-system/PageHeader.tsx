import React from 'react';
import { Users, UserPlus, Briefcase } from 'lucide-react';

export interface HeaderStat {
  label: string;
  count: number | string;
  icon?: React.ReactNode;
}

export interface PageHeaderProps {
  greeting?: string;
  userName?: string;
  stats?: HeaderStat[];
  className?: string;
}

const DEFAULT_STATS: HeaderStat[] = [
  {
    label: 'Employe',
    count: 78,
    icon: <Users className="w-3 h-3 text-[#777777]" />,
  },
  {
    label: 'Hirings',
    count: 56,
    icon: <UserPlus className="w-3 h-3 text-[#D9B66F]" />,
  },
  {
    label: 'Projects',
    count: 203,
    icon: <Briefcase className="w-3 h-3 text-[#777777]" />,
  },
];

export const PageHeader: React.FC<PageHeaderProps> = ({
  greeting = 'Welcome in',
  userName = 'Nixtio',
  stats = DEFAULT_STATS,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 py-2 ${className}`}>
      {/* Left Greeting & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
          {greeting}, {userName}
        </h1>
      </div>

      {/* Right Stats Cluster (from reference: 78 Employe, 56 Hirings, 203 Projects) */}
      <div className="flex items-center gap-6 sm:gap-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-mono">
              {stat.count}
            </span>
            <div className="flex flex-col">
              {stat.icon && <span className="mb-0.5">{stat.icon}</span>}
              <span className="text-[11px] text-[var(--text-muted)] font-medium leading-none">
                {stat.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
