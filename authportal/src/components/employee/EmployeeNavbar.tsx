import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  FileText,
  Calendar,
  MessageSquare,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { RoleSwitcher } from '../ui/RoleSwitcher';
import type { EmployeeTab, UserProfile, PortalRole } from '../../types/work';
import type { BrandConfig } from '../../types/auth';

interface EmployeeNavbarProps {
  brandConfig: BrandConfig;
  userProfile: UserProfile;
  activeTab: EmployeeTab;
  onTabChange: (tab: EmployeeTab) => void;
  onSelectRole?: (role: PortalRole) => void;
  unreadNotificationsCount?: number;
  onSignOut: () => void;
}

const TABS: { id: EmployeeTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { id: 'attendance', label: 'Attendance', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'reports', label: 'Reports', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: 'notifications', label: 'Alerts', icon: <Bell className="w-3.5 h-3.5" /> },
  { id: 'profile', label: 'Profile', icon: <User className="w-3.5 h-3.5" /> },
];

export const EmployeeNavbar: React.FC<EmployeeNavbarProps> = ({
  brandConfig,
  userProfile,
  activeTab,
  onTabChange,
  onSelectRole,
  unreadNotificationsCount = 2,
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
        {/* Left: Brand Monogram & Role Pill */}
        <div className="flex items-center gap-3">
          <div className="h-9 px-3 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center gap-2 shadow-xs select-none">
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
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-secondary)]">
            <Shield className="w-3 h-3 text-[#D9B66F]" />
            <span>Employee Portal</span>
          </div>

          {onSelectRole && (
            <div className="hidden md:block">
              <RoleSwitcher currentRole="employee" onSelectRole={onSelectRole} />
            </div>
          )}
        </div>

        {/* Center: Desktop Navigation Capsule */}
        <nav
          aria-label="Employee Workspace Navigation"
          className="hidden lg:flex items-center gap-1 p-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]/70 text-xs font-medium text-[var(--text-secondary)]"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
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
          {/* Notification Button */}
          <button
            type="button"
            onClick={() => onTabChange('notifications')}
            aria-label={`Notifications (${unreadNotificationsCount} unread)`}
            className={`relative w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'notifications'
                ? 'text-[#D9B66F] border-[#D9B66F]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D9B66F] ring-2 ring-[var(--bg-card)]" />
            )}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile Avatar Pill */}
          <button
            type="button"
            onClick={() => onTabChange('profile')}
            aria-label={`Profile settings for ${userProfile.name}`}
            className="flex items-center gap-2 p-0.5 rounded-full border border-[var(--border-subtle)] hover:border-[#D9B66F] transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full bg-[#F8E7A1] dark:bg-[#38321B] text-[#222222] dark:text-[#F8E7A1] font-bold text-xs flex items-center justify-center overflow-hidden">
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
            <span className="hidden xl:inline text-xs font-semibold text-[var(--text-primary)] pr-2">
              {userProfile.name.split(' ')[0]}
            </span>
          </button>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out of Employee Portal"
            aria-label="Sign out of Employee Portal"
            className="w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900 transition-colors flex items-center justify-center cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden px-4 pb-3 pt-1 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] animate-fadeIn">
          {onSelectRole && (
            <div className="pt-2 pb-2 md:hidden">
              <RoleSwitcher currentRole="employee" onSelectRole={onSelectRole} />
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2">
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
