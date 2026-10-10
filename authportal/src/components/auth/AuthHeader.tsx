import React from 'react';
import { Edit3, ArrowRight, ShieldCheck, ShieldAlert, UserCheck, Clock } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { BrandConfig } from '../../types/auth';

interface AuthHeaderProps {
  brandConfig: BrandConfig;
  onOpenBrandModal: () => void;
  onOpenPortal?: (portal: 'employee' | 'manager' | 'admin' | 'pendingEmployee' | 'pendingManager') => void;
  onOpenEmployeePortal?: () => void;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  brandConfig,
  onOpenBrandModal,
  onOpenPortal,
  onOpenEmployeePortal,
}) => {
  return (
    <header className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Brand & Logo Placeholder */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full overflow-hidden border border-[var(--border-subtle)] flex items-center justify-center shadow-xs select-none bg-[var(--bg-card)]"
          aria-hidden="true"
        >
          {brandConfig.logoUrl ? (
            <img
              src={brandConfig.logoUrl}
              alt={brandConfig.companyName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold tracking-wider text-[#C5A059] dark:text-[#D4AF37]">
              {brandConfig.companyName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            {brandConfig.companyName}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            outFyt.co.in
          </span>
        </div>
      </div>

      {/* Right controls: Theme Toggle only */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
};
