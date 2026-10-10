import React from 'react';
import { UserCheck, Users, ShieldAlert } from 'lucide-react';
import type { PortalRole } from '../../types/work';

interface RoleSwitcherProps {
  currentRole: PortalRole;
  onSelectRole: (role: PortalRole) => void;
  className?: string;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onSelectRole,
  className = '',
}) => {
  return (
    <div
      role="group"
      aria-label="Switch portal view"
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] ${className}`}
    >
      <button
        type="button"
        onClick={() => onSelectRole('employee')}
        title="Switch to Employee Portal"
        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
          currentRole === 'employee'
            ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] shadow-xs'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
        }`}
      >
        <UserCheck className="w-3 h-3 text-[#D9B66F]" />
        <span>Employee</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectRole('manager')}
        title="Switch to Manager Portal"
        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
          currentRole === 'manager'
            ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] shadow-xs'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
        }`}
      >
        <Users className="w-3 h-3 text-[#D9B66F]" />
        <span>Manager</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectRole('admin')}
        title="Switch to Administrator Portal"
        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
          currentRole === 'admin'
            ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] shadow-xs'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
        }`}
      >
        <ShieldAlert className="w-3 h-3 text-[#D9B66F]" />
        <span>Admin</span>
      </button>
    </div>
  );
};
