import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  FileText,
  Calendar,
  MessageSquare,
  User,
  Check,
} from 'lucide-react';
import { DailyReportModal } from '../modals/DailyReportModal';
import { MeetingJoinModal } from '../modals/MeetingJoinModal';
import type {
  UserProfile,
  Task,
  EmployeeTab,
  CalendarEvent,
  DailyReport,
} from '../../types/work';

interface EmployeeOverviewProps {
  userProfile: UserProfile;
  tasks: Task[];
  dailyReports?: DailyReport[];
  calendarEvents?: CalendarEvent[];
  onNavigateTab: (tab: EmployeeTab) => void;
  onToggleTaskStatus?: (taskId: string) => void;
  onSubmitDailyReport?: (report: Omit<DailyReport, 'id'>) => void;
}

export const EmployeeOverview: React.FC<EmployeeOverviewProps> = ({
  userProfile,
  tasks,
  calendarEvents = [],
  onNavigateTab,
  onToggleTaskStatus,
  onSubmitDailyReport,
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  // Real backend calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'in_progress').length;
  const overdueTasksCount = tasks.filter((t) => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr).length;

  // Task Completion percentage
  const progressPercent = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 0;

  // Formatted date string
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ----------------------------------------------------------------- */}
      {/* ROW 1: 5 Top Metric Stat Cards (Real Employee Data)               */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Tasks */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[var(--text-muted)] font-medium block">Total Tasks</span>
            <span className="text-2xl font-bold text-[var(--text-primary)] mt-1 block">{totalTasksCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[#C5A059] flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[var(--text-muted)] font-medium block">Completed</span>
            <span className="text-2xl font-bold text-[var(--text-primary)] mt-1 block">{completedTasksCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[var(--text-muted)] font-medium block">In Progress</span>
            <span className="text-2xl font-bold text-[var(--text-primary)] mt-1 block">{inProgressTasksCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Overdue */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[var(--text-muted)] font-medium block">Overdue</span>
            <span className="text-2xl font-bold text-[var(--text-primary)] mt-1 block">{overdueTasksCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Card 5: Aesthetic Date & Greeting Card */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 p-3.5 rounded-2xl bg-amber-500/10 dark:bg-gradient-to-br dark:from-[#2A2B33] dark:via-[#212228] dark:to-[#18191E] border border-amber-500/20 dark:border-white/10 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
              {dayName}
            </span>
            <p className="text-xs font-bold text-[var(--text-primary)]">{formattedDate}</p>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] relative z-10 mt-1">
            Keep going, {userProfile.name.split(' ')[0]}!
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* ROW 2: Middle Row (Today's Schedule & Real Task Progress Gauge)    */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 cols): Today's Schedule */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Today's Schedule & Milestones</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('calendar')}
              className="text-[10px] text-[#C5A059] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            {calendarEvents.length > 0 ? (
              calendarEvents.slice(0, 3).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="font-mono text-[11px] font-bold text-[var(--text-primary)] shrink-0">{evt.startTime}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div className="truncate">
                      <p className="font-semibold text-[var(--text-primary)] truncate text-xs">{evt.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{evt.project || 'General'} · {evt.type}</p>
                    </div>
                  </div>

                  {evt.meetingLink ? (
                    <button
                      type="button"
                      onClick={() => setIsMeetingModalOpen(true)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      Join
                    </button>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)] px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                      Scheduled
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-center text-[var(--text-muted)] text-xs">
                No meetings scheduled for today. Enjoy focused work time.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Real Task Progress Radial Gauge */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Work Throughput</h3>
            <span className="text-[10px] text-[#C5A059] font-medium">Live Status</span>
          </div>

          <div className="flex items-center justify-center py-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-gray-200 dark:text-[#25262D]" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.5"
                  strokeDasharray={`${progressPercent} 100`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-[var(--text-primary)]">{progressPercent}%</span>
                <span className="text-[10px] text-[var(--text-muted)]">Completed</span>
              </div>
            </div>
          </div>

          {/* Breakdown legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Total Tasks</span>
              <span className="font-bold text-[var(--text-primary)]">{totalTasksCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Done</span>
              <span className="font-bold text-[var(--text-primary)]">{completedTasksCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* ROW 3: Bottom Row (Real Tasks Checklist & Quick Action Controls)  */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Widget 1: My Deliverables Checklist (Connected to Real Tasks) */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[var(--text-primary)]">Assigned Deliverables</h3>
              <span className="text-[10px] text-[var(--text-muted)]">
                (Click to toggle status)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('tasks')}
              className="text-[10px] text-[#C5A059] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {tasks.length > 0 ? (
              tasks.map((t) => {
                const isCompleted = t.status === 'completed';
                return (
                  <div
                    key={t.id}
                    onClick={() => onToggleTaskStatus && onToggleTaskStatus(t.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                      isCompleted
                        ? 'bg-[var(--bg-card-subtle)] border-[var(--border-subtle)] opacity-70'
                        : 'bg-[var(--bg-card-subtle)] border-[var(--border-subtle)] hover:border-[#C5A059]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'
                        }`}
                      >
                        {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <span
                        className={`truncate text-xs font-medium ${
                          isCompleted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          t.priority === 'high'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : t.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">{t.dueDate || 'Open'}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-[var(--text-muted)] text-xs">
                No tasks assigned yet
              </div>
            )}
          </div>
        </div>

        {/* Widget 2: 4 Real Functional Quick Action Buttons */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[var(--text-primary)]">Quick Actions</h3>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Button 1: Submit Daily Report */}
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="p-3 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#C5A059]/40 flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-[#C5A059] group-hover:scale-110 flex items-center justify-center transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-primary)]">Daily Report</span>
            </button>

            {/* Button 2: View Calendar */}
            <button
              type="button"
              onClick={() => onNavigateTab('calendar')}
              className="p-3 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#C5A059]/40 flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-primary)]">Calendar</span>
            </button>

            {/* Button 3: Messages */}
            <button
              type="button"
              onClick={() => onNavigateTab('messages')}
              className="p-3 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#C5A059]/40 flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-primary)]">Messages</span>
            </button>

            {/* Button 4: Profile Settings */}
            <button
              type="button"
              onClick={() => onNavigateTab('profile')}
              className="p-3 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[#C5A059]/40 flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                <User className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-primary)]">My Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daily Report Modal */}
      <DailyReportModal
        isOpen={isReportModalOpen}
        tasks={tasks}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={async (rep) => {
          if (onSubmitDailyReport) {
            await onSubmitDailyReport(rep as any);
          }
          setIsReportModalOpen(false);
        }}
      />

      {/* Meeting Join Live Modal */}
      <MeetingJoinModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        meetingTitle="Team Standup & Review"
        meetingTime="10:00 AM - 11:00 AM"
      />
    </div>
  );
};
