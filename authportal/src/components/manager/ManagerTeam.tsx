import React, { useState } from 'react';
import {
  Users,
  Search,
  Mail,
  Briefcase,
  CheckSquare,
  Clock,
  ArrowRight,
  UserCheck,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { EmployeeWorkProfileModal } from '../profile/EmployeeWorkProfileModal';
import type { TeamMember, Task } from '../../types/work';

interface ManagerTeamProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  onAssignTaskToMember: (memberId: string, memberName: string) => void;
}

export const ManagerTeam: React.FC<ManagerTeamProps> = ({
  teamMembers,
  tasks,
  onAssignTaskToMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const filteredMembers = teamMembers.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.jobTitle.toLowerCase().includes(q) ||
      m.employeeId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Engineering Team Directory
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059]">
              {teamMembers.length} Employees
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Click on any employee card or row to view their full work profile, task status, and daily reports.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or name (e.g. EMP01)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#D9B66F]/40"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
          <Users className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">No matching employee records found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {searchQuery
              ? `No accounts match the query "${searchQuery}". Clear your search to view all ${teamMembers.length} team members.`
              : 'No provisioned employee accounts currently available in directory.'}
          </p>
          {searchQuery && (
            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        /* Team Roster Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const isProfileIncomplete = !member.fullName || member.fullName === 'outFyt Member';
            const memberTasks = tasks.filter(
              (t) =>
                t.assignedToEmployeeId === member.id ||
                t.assignedToEmployeeId === member.employeeId ||
                (t.assignees &&
                  t.assignees.some(
                    (a) =>
                      a.id === member.id ||
                      a.employeeId === member.employeeId ||
                      a.id === member.employeeId
                  ))
            );
            const activeTasksCount = memberTasks.filter((t) => t.status !== 'completed').length;
            const completedTasksCount = memberTasks.filter((t) => t.status === 'completed').length;

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#D9B66F] hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer group select-none"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.fullName}
                          className="w-12 h-12 rounded-2xl object-cover border border-[#C5A059]/30 shrink-0 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#D9B66F]/20 text-[#222222] dark:text-[#F8E7A1] font-bold text-sm flex items-center justify-center shrink-0 border border-[#D9B66F]/30 group-hover:scale-105 transition-transform">
                          {member.fullName
                            ? member.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()
                            : member.employeeId}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[#D9B66F] transition-colors">
                            {member.fullName || 'outFyt Employee'}
                          </h3>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)]">{member.jobTitle || 'Team Member'}</p>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-semibold">{member.employeeId}</span>
                          <span>·</span>
                          <span>{member.department || 'Operations'}</span>
                          {isProfileIncomplete && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              Profile not completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          member.attendanceToday.status === 'present'
                            ? 'bg-emerald-500'
                            : member.attendanceToday.status === 'remote'
                            ? 'bg-blue-500'
                            : member.attendanceToday.status === 'on_break'
                            ? 'bg-amber-500'
                            : 'bg-zinc-400'
                        }`}
                      />
                      <span className="font-semibold text-[var(--text-primary)]">
                        {member.attendanceToday.status === 'present'
                          ? 'In Office'
                          : member.attendanceToday.status === 'remote'
                          ? 'Remote'
                          : member.attendanceToday.status === 'on_break'
                          ? 'On Break'
                          : 'On Leave'}
                      </span>
                    </div>

                    <span className="text-[11px] text-[var(--text-muted)]">
                      {member.attendanceToday.hoursWorked > 0
                        ? `${member.attendanceToday.hoursWorked} hrs logged`
                        : 'No hours today'}
                    </span>
                  </div>

                  {/* Workload */}
                  <div className="mt-3 bg-[var(--bg-card-subtle)] p-2.5 rounded-xl border border-[var(--border-subtle)] flex items-center justify-around text-center text-xs">
                    <div>
                      <span className="block text-[10px] text-[var(--text-muted)]">Active Tasks</span>
                      <span className="font-bold text-[var(--text-primary)]">{activeTasksCount}</span>
                    </div>
                    <div className="w-px h-6 bg-[var(--border-subtle)]" />
                    <div>
                      <span className="block text-[10px] text-[var(--text-muted)]">Completed</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{completedTasksCount}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMember(member)}
                    className="w-full text-xs"
                  >
                    View Work Profile
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onAssignTaskToMember(member.id, member.fullName)}
                    className="w-full text-xs shadow-xs"
                  >
                    Assign Task
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive Clickable Employee Work Profile Modal */}
      {selectedMember && (
        <EmployeeWorkProfileModal
          isOpen={Boolean(selectedMember)}
          onClose={() => setSelectedMember(null)}
          employeeProfileId={selectedMember.id}
          employeeSystemId={selectedMember.employeeId}
          employeeName={selectedMember.fullName}
          isAdmin={false}
        />
      )}
    </div>
  );
};
