import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserCheck,
  CheckSquare,
  Clock,
  FileText,
  Calendar,
  MessageSquare,
  BarChart2,
  Shield,
  ListOrdered,
  Settings,
  Bell,
  Search,
  LogOut,
  Home,
  Menu,
  X,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { BrandConfig } from '../../types/auth';
import type { PortalRole } from '../../types/work';

export interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface PortalLayoutProps {
  role: PortalRole;
  brandConfig: BrandConfig;
  user: {
    name: string;
    roleTitle: string;
    avatarUrl?: string;
    email?: string;
  };
  activeTab: string;
  onTabChange: (tabId: any) => void;
  onSignOut: () => void;
  onSelectRole?: (role: PortalRole) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  headerTitle: string;
  headerSubtitle: string;
  unreadNotificationsCount?: number;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  role,
  brandConfig,
  user,
  activeTab,
  onTabChange,
  onSignOut,
  searchPlaceholder = 'Search anything... (tasks, reports, employees)',
  searchValue = '',
  onSearchChange,
  headerTitle,
  headerSubtitle,
  unreadNotificationsCount = 0,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Configure navigation items strictly matching the role permissions
  const getNavItems = (): NavItemConfig[] => {
    if (role === 'admin') {
      return [
        { id: 'overview', label: 'Dashboard / Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'employees', label: 'Employee Management', icon: <Users className="w-4 h-4" /> },
        { id: 'managers', label: 'Manager Management', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'tasks', label: 'Task Management', icon: <CheckSquare className="w-4 h-4" /> },
        { id: 'attendance', label: 'Attendance', icon: <Clock className="w-4 h-4" /> },
        { id: 'reports', label: 'Daily Reports', icon: <FileText className="w-4 h-4" /> },
        { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
        { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
        { id: 'security', label: 'Security Center', icon: <Shield className="w-4 h-4" /> },
        { id: 'audit', label: 'Audit Logs', icon: <ListOrdered className="w-4 h-4" /> },
        { id: 'settings', label: 'Organization Settings', icon: <Settings className="w-4 h-4" /> },
      ];
    }

    if (role === 'manager') {
      return [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'team', label: 'Employees', icon: <Users className="w-4 h-4" /> },
        { id: 'tasks', label: 'Task Management', icon: <CheckSquare className="w-4 h-4" /> },
        { id: 'attendance', label: 'Attendance', icon: <Clock className="w-4 h-4" /> },
        { id: 'reports', label: 'Daily Reports', icon: <FileText className="w-4 h-4" /> },
        { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
        { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
        { id: 'profile', label: 'Profile & Settings', icon: <Settings className="w-4 h-4" /> },
      ];
    }

    // Employee
    return [
      { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'tasks', label: 'My Tasks', icon: <CheckSquare className="w-4 h-4" /> },
      { id: 'attendance', label: 'Attendance', icon: <Clock className="w-4 h-4" /> },
      { id: 'reports', label: 'Daily Reports', icon: <FileText className="w-4 h-4" /> },
      { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
      { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
      { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
      { id: 'profile', label: 'Profile & Settings', icon: <Settings className="w-4 h-4" /> },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex transition-colors duration-200">
      {/* ------------------------------------------------------------- */}
      {/* 1. Left Collapsible Sidebar                                    */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-[var(--bg-card)] border-r border-[var(--border-subtle)] flex flex-col justify-between transition-all duration-200 lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Top: Logo & Title + Accessible Collapse Control */}
        <div>
          <div
            className={`px-4 py-3.5 flex items-center border-b border-[var(--border-subtle)] ${
              isCollapsed ? 'lg:justify-center justify-between' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className="w-8 h-8 rounded-full overflow-hidden border border-[#C5A059]/40 bg-[var(--bg-card-subtle)] flex items-center justify-center shrink-0 cursor-pointer"
                title={brandConfig.companyName}
                onClick={() => onTabChange('overview')}
              >
                {brandConfig.logoUrl ? (
                  <img
                    src={brandConfig.logoUrl}
                    alt={brandConfig.companyName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#C5A059]">
                    {brandConfig.companyName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                    outFyt
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[125px]">
                    outFyt.co.in
                  </span>
                </div>
              )}
            </div>

            {/* Desktop collapse/expand toggle */}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] cursor-pointer transition-colors"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#C5A059]" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-2.5 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full relative flex items-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isCollapsed ? 'lg:justify-center px-0 py-2.5' : 'justify-between px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-[#C5A059] text-gray-900 font-semibold shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                  }`}
                >
                  <div className={`flex items-center gap-2.5 ${isCollapsed ? 'lg:justify-center' : 'truncate'}`}>
                    <span className={isActive ? 'text-gray-900' : 'text-[var(--text-muted)]'}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {item.badge !== undefined && !isCollapsed && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-gray-900 text-[#C5A059]'
                          : 'bg-[#C5A059]/15 text-[#B08D46] dark:text-[#D9B66F]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Collapsed dot badge */}
                  {item.badge !== undefined && isCollapsed && (
                    <span className="hidden lg:block absolute top-1 right-2 w-2 h-2 rounded-full bg-[#C5A059]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Action Icons */}
        <div
          className={`p-2.5 border-t border-[var(--border-subtle)] flex items-center text-[var(--text-muted)] ${
            isCollapsed ? 'lg:flex-col lg:gap-2 justify-center' : 'justify-around'
          }`}
        >
          <button
            type="button"
            title="Overview Home"
            onClick={() => onTabChange('overview')}
            className="p-2 rounded-lg hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="Settings"
            onClick={() => onTabChange(role === 'admin' ? 'settings' : 'profile')}
            className="p-2 rounded-lg hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] cursor-pointer transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="Sign Out"
            onClick={onSignOut}
            className="p-2 rounded-lg hover:text-red-600 hover:bg-[var(--bg-card-subtle)] cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. Main Content Wrapper (Dynamic Offset based on Sidebar)      */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-[var(--bg-card)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 sm:px-6 py-3 flex items-center justify-between gap-4 transition-colors">
          {/* Left: Mobile Toggle & Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                {headerTitle}
              </h1>
              <p className="text-[11px] text-[var(--text-secondary)] hidden sm:block">
                {headerSubtitle}
              </p>
            </div>
          </div>

          {/* Center/Right: Search, Theme, Bell, User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Search Bar */}
            <div className="relative hidden md:block w-64 lg:w-80">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-xs rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#C5A059] transition-all"
              />
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => onTabChange(role === 'employee' ? 'notifications' : 'overview')}
              className="relative p-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* User Profile Capsule */}
            <div
              onClick={() => onTabChange(role === 'admin' ? 'settings' : 'profile')}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] hover:border-[#C5A059]/40 cursor-pointer transition-all select-none"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-[var(--bg-card)] border border-[#C5A059]/30 flex items-center justify-center shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-[#C5A059]">
                    {user.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="hidden xl:flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-[var(--text-primary)] leading-none">{user.name}</span>
                <span className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5 capitalize">{user.roleTitle}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
