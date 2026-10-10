import React, { useState } from 'react';
import { Eye, Shield, User, Briefcase, ChevronDown, ChevronUp, Clock, Lock } from 'lucide-react';

export type DashboardViewType =
  | 'auth'
  | 'employee'
  | 'manager'
  | 'admin';

interface TemporaryDashboardViewerProps {
  currentView: string;
  onSelectView: (view: DashboardViewType) => void;
}

export const TemporaryDashboardViewer: React.FC<TemporaryDashboardViewerProps> = ({
  currentView,
  onSelectView,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const viewOptions: { id: DashboardViewType; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'admin',
      label: 'Admin Portal',
      icon: <Shield className="w-3.5 h-3.5" />,
      color: 'text-amber-600 dark:text-[#D9B66F]',
    },
    {
      id: 'manager',
      label: 'Manager Portal',
      icon: <Briefcase className="w-3.5 h-3.5" />,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'employee',
      label: 'Employee Portal',
      icon: <User className="w-3.5 h-3.5" />,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'auth',
      label: 'Sign In Screen',
      icon: <Lock className="w-3.5 h-3.5" />,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <aside
      aria-label="Temporary Dashboard Viewer"
      className="fixed bottom-4 right-4 z-50 transition-all duration-300 font-sans"
    >
      <div className="bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border-subtle)] dark:border-[#C5A059]/40 rounded-2xl shadow-2xl p-2.5 text-xs text-[var(--text-primary)] transition-all">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)] px-1">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="font-bold text-[11px] text-[var(--text-primary)]">Dashboard Viewer</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#C5A059]/15 text-[#B08D46] dark:text-[#D9B66F] border border-[#C5A059]/30">
              Preview Mode
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Dashboard Viewer' : 'Collapse Dashboard Viewer'}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable Switcher Body */}
        {!isCollapsed && (
          <div className="pt-2 space-y-1.5 max-w-xs animate-fadeIn">
            <p className="text-[10px] text-[var(--text-muted)] px-1 leading-tight">
              Temporary evaluator tool to analyze all 3 dashboards and verification screens:
            </p>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {viewOptions.map((opt) => {
                const isActive = currentView === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectView(opt.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-left truncate ${
                      isActive
                        ? 'bg-[#C5A059] text-gray-900 font-bold shadow-xs'
                        : 'bg-[var(--bg-card-subtle)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    <span className={isActive ? 'text-gray-900' : opt.color}>
                      {opt.icon}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
