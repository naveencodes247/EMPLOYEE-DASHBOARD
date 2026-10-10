import React from 'react';
import {
  Clock,
  Play,
  Pause,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Timer,
  Coffee,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { AttendanceRecord, UserProfile } from '../../types/work';

interface EmployeeAttendanceProps {
  userProfile: UserProfile;
  attendanceHistory: AttendanceRecord[];
  onToggleCheckIn: () => void;
  onToggleBreak: () => void;
}

export const EmployeeAttendance: React.FC<EmployeeAttendanceProps> = ({
  userProfile,
  attendanceHistory,
  onToggleCheckIn,
  onToggleBreak,
}) => {
  const isCheckedIn = userProfile.todayAttendance.isCheckedIn;
  const isOnBreak = userProfile.todayAttendance.isOnBreak;
  const elapsedMinutes = userProfile.todayAttendance.elapsedWorkingMinutes;
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900/60 font-semibold text-[11px]">
            Present (On-Site)
          </span>
        );
      case 'remote':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-semibold text-[11px]">
            Remote Verified
          </span>
        );
      case 'leave':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-semibold text-[11px]">
            Approved Leave
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 font-semibold text-[11px]">
            Late Check-In
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Attendance & Working Hours
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Log your daily shift hours, check-ins, and scheduled breaks.
          </p>
        </div>
      </div>

      {/* Real-time Tracking Prototype Console */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Status Indicator & Live Hours */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  isCheckedIn
                    ? isOnBreak
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-green-500 ring-4 ring-green-500/20'
                    : 'bg-slate-400'
                }`}
              />
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {isCheckedIn
                  ? isOnBreak
                    ? 'Break In Progress'
                    : `Active Shift (Started ${userProfile.todayAttendance.checkInTime})`
                  : 'Currently Checked Out'}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-[var(--text-primary)]">
                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Hours : Minutes logged today
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={isCheckedIn ? 'secondary' : 'primary'}
              size="lg"
              onClick={onToggleCheckIn}
              leftIcon={isCheckedIn ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            >
              {isCheckedIn ? 'Clock Out' : 'Clock In Now'}
            </Button>

            {isCheckedIn && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onToggleBreak}
                leftIcon={<Coffee className="w-4 h-4 text-[#D9B66F]" />}
              >
                {isOnBreak ? 'End Break' : 'Take a Break'}
              </Button>
            )}
          </div>
        </div>

        {/* Prototype boundary notice */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#D9B66F] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Attendance Prototype Notice:</strong> Actions above demonstrate live UI tracking. Permanent attendance verification, geolocation boundary checks, and overtime calculations will be validated securely by the Supabase backend.
          </p>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D9B66F]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Recent Attendance History
            </h3>
          </div>
          <span className="text-xs text-[var(--text-muted)]">Past 5 Shifts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Clock In</th>
                <th className="pb-3 font-semibold">Clock Out</th>
                <th className="pb-3 font-semibold">Break Taken</th>
                <th className="pb-3 font-semibold">Total Hours</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]/60 text-[var(--text-secondary)]">
              {attendanceHistory.map((rec) => (
                <tr key={rec.id} className="hover:bg-[var(--bg-card-subtle)] transition-colors">
                  <td className="py-3 font-medium text-[var(--text-primary)]">{rec.date}</td>
                  <td className="py-3 font-mono">{rec.checkIn}</td>
                  <td className="py-3 font-mono">{rec.checkOut || 'Active Shift'}</td>
                  <td className="py-3 font-mono">{rec.breakMinutes} mins</td>
                  <td className="py-3 font-mono font-semibold text-[var(--text-primary)]">{rec.totalHours} hrs</td>
                  <td className="py-3">{getStatusBadge(rec.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
