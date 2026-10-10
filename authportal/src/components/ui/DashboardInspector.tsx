import React, { useState } from 'react';
import { Eye, Shield, User, Briefcase, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import type { PortalRole } from '../../types/work';

interface DashboardInspectorProps {
  currentView: string;
  onSelectView: (view: 'auth' | 'employee' | 'manager' | 'admin') => void;
}

export const DashboardInspector: React.FC<DashboardInspectorProps> = ({
  currentView,
  onSelectView,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      aria-label="Dashboard Inspector"
      className="fixed bottom-4 right-4 z-50 transition-all duration-300"
    >
      <div className="bg-[#18191E]/95 backdrop-blur-md border border-[#C5A059]/40 rounded-2xl shadow-2xl p-2.5 text-xs text-white">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10 px-1">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="font-bold text-[11px] text-white">Dashboard Inspector</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#C5A059]/20 text-[#D9B66F]">
              Review Tool
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Dashboard Switcher' : 'Collapse'}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center gap-1.5">
            {/* Employee Portal button */}
            <button
              type="button"
              onClick={() => onSelectView('employee')}
              className={`px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'employee'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <User className="w-3 h-3 text-emerald-400" />
              <span>Employee</span>
            </button>

            {/* Manager Portal button */}
            <button
              type="button"
              onClick={() => onSelectView('manager')}
              className={`px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'manager'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <Briefcase className="w-3 h-3 text-blue-400" />
              <span>Manager</span>
            </button>

            {/* Admin Portal button */}
            <button
              type="button"
              onClick={() => onSelectView('admin')}
              className={`px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-[#C5A059]/25 text-[#D9B66F] border border-[#C5A059]/50 shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <Shield className="w-3 h-3 text-[#C5A059]" />
              <span>Admin</span>
            </button>

            {/* Sign In / Auth Screen button */}
            <button
              type="button"
              onClick={() => onSelectView('auth')}
              className={`px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'auth'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <Lock className="w-3 h-3 text-purple-400" />
              <span>Sign In / Auth</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
