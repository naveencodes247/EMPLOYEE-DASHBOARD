import React, { useState } from 'react';
import { Settings, Bell, User, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { BrandConfig } from '../../types/auth';

export interface AppNavbarProps {
  brandConfig: BrandConfig;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  notificationCount?: number;
  userName?: string;
  className?: string;
}

const NAV_TABS = [
  'Dashboard',
  'People',
  'Hiring',
  'Devices',
  'Apps',
  'Salary',
  'Calendar',
  'Reviews',
];

export const AppNavbar: React.FC<AppNavbarProps> = ({
  brandConfig,
  activeTab = 'Dashboard',
  onTabChange,
  notificationCount = 2,
  userName = 'Nixtio',
  className = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className={`w-full ${className}`}>
      <div className="flex items-center justify-between gap-4 py-3">
        {/* Brand Monogram Pill Capsule (inspired by reference: "Crextio") */}
        <div className="flex items-center gap-2">
          <div className="h-10 px-4 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center gap-2 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9B66F]" />
            <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              {brandConfig.companyName}
            </span>
          </div>
        </div>

        {/* Center Navigation Capsule - Desktop & Tablet */}
        <nav
          aria-label="Portal Navigation"
          className="hidden xl:flex items-center gap-1 p-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)]/90 backdrop-blur-xs text-xs font-medium text-[var(--text-secondary)] shadow-xs"
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange?.(tab)}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold shadow-xs'
                    : 'hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                }`}
              >
                {tab}
              </button>
            );
          })}

          {/* Settings tab with icon */}
          <button
            type="button"
            onClick={() => onTabChange?.('Setting')}
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
              activeTab === 'Setting'
                ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
                : 'hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Setting</span>
          </button>
        </nav>

        {/* Right Controls: Notification, Profile, Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Notification Button */}
          <button
            type="button"
            aria-label={`Notifications (${notificationCount} unread)`}
            className="relative w-9 h-9 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D9B66F] ring-2 ring-[var(--bg-card)]" />
            )}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile Capsule / Avatar */}
          <div className="hidden sm:flex items-center gap-2 pl-1">
            <button
              type="button"
              aria-label={`User profile for ${userName}`}
              className="w-9 h-9 rounded-full bg-[#F8E7A1] dark:bg-[#38321B] border border-[#D9B66F]/40 flex items-center justify-center text-[#222222] dark:text-[#F8E7A1] transition-transform active:scale-95 cursor-pointer"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button (for screens < 1280px) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="xl:hidden w-9 h-9 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="xl:hidden mt-2 p-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-1 shadow-lg animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
            {NAV_TABS.concat('Setting').map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    onTabChange?.(tab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                    isActive
                      ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-subtle)]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
