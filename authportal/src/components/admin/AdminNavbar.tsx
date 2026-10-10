import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  UserCheck,
  CheckSquare,
  FileText,
  Clock,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Lock,
} from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { RoleSwitcher } from '../ui/RoleSwitcher';
import type { AdminTab, UserProfile, PortalRole } from '../../types/work';
import type { BrandConfig } from '../../types/auth';

interface AdminNavbarProps {
  brandConfig: BrandConfig;
  userProfile: UserProfile;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onSelectRole: (role: PortalRole) => void;
  onSignOut: () => void;
}

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Admin Dashboard', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { id: 'accounts', label: 'Account Directory', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'tasks', label: 'Deliverables & Tasks', icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { id: 'reports', label: 'Work Reports', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'attendance', label: 'Attendance & Leave', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'audit', label: 'Audit & Security', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  { id: 'settings', label: 'Portal Governance', icon: <Settings className="w-3.5 h-3.5" /> },
];

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  brandConfig,
  userProfile,
  activeTab,
  onTabChange,
  onSelectRole,
  onSignOut,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="w-full border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand Monogram & Admin Pill (Navigates to Admin Dashboard) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTabChange('overview')}
            className="h-9 px-3 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center gap-2 shadow-xs select-none cursor-pointer hover:border-[#C5A059]/50 transition-colors text-left"
            title="Admin Dashboard"
          >
            {brandConfig.logoUrl ? (
              <img
                src={brandConfig.logoUrl}
                alt={brandConfig.companyName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9B66F]" />
            )}
            <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              {brandConfig.companyName}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('overview')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[11px] font-semibold text-red-700 dark:text-red-400 cursor-pointer hover:bg-red-500/15 transition-colors"
            title="Admin Dashboard"
          >
            <Lock className="w-3 h-3" />
            <span>Administrator Console</span>
          </button>

          {/* Quick Role Switcher */}
          <div className="hidden md:block">
            <RoleSwitcher currentRole="admin" onSelectRole={onSelectRole} />
          </div>
        </div>

        {/* Center: Desktop Navigation */}
        <nav
          aria-label="Admin Console Navigation"
          className="hidden xl:flex items-center gap-1 p-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]/70 text-xs font-medium text-[var(--text-secondary)]"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold shadow-xs'
                    : 'hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Notifications, Avatar, ThemeToggle, Sign Out */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Admin Avatar Pill */}
          <div
            title={`Admin: ${userProfile.name} (${userProfile.employeeId})`}
            className="flex items-center gap-2 p-0.5 rounded-full border border-[var(--border-subtle)] select-none"
          >
            <div className="w-7 h-7 rounded-full bg-red-500/20 text-[#222222] dark:text-[#F8E7A1] font-bold text-xs flex items-center justify-center overflow-hidden">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(userProfile.name)}</span>
              )}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-[var(--text-primary)] pr-2">
              {userProfile.name.split(' ')[0]}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out of Admin Console"
            aria-label="Sign out of Admin Console"
            className="w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900 transition-colors flex items-center justify-center cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="xl:hidden w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="xl:hidden px-4 pb-3 pt-1 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] animate-fadeIn">
          <div className="pt-2 pb-2 md:hidden">
            <RoleSwitcher currentRole="admin" onSelectRole={onSelectRole} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-subtle)]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
