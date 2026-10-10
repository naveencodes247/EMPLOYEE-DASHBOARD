import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  AlertCircle,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { TeamMember, LeaveRequest, LeaveStatus } from '../../types/work';

interface ManagerAttendanceProps {
  teamMembers: TeamMember[];
  leaveRequests: LeaveRequest[];
  onReviewLeaveRequest: (requestId: string, status: LeaveStatus, reviewNote?: string) => void;
}

export const ManagerAttendance: React.FC<ManagerAttendanceProps> = ({
  teamMembers,
  leaveRequests,
  onReviewLeaveRequest,
}) => {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewModalType, setReviewModalType] = useState<'approve' | 'reject' | null>(null);

  const pendingRequests = leaveRequests.filter((r) => r.status === 'pending');
  const pastRequests = leaveRequests.filter((r) => r.status !== 'pending');

  const handleOpenReview = (request: LeaveRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewModalType(type);
    setReviewNote(type === 'approve' ? 'Approved by engineering lead.' : 'Unable to accommodate coverage.');
  };

  const handleConfirmReview = () => {
    if (!selectedRequest || !reviewModalType) return;
    onReviewLeaveRequest(selectedRequest.id, reviewModalType === 'approve' ? 'approved' : 'rejected', reviewNote);
    setSelectedRequest(null);
    setReviewModalType(null);
    setReviewNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Attendance Monitoring & Leave Approvals
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Verify employee presence, work hours compliance, and process leave requests.
        </p>
      </div>

      {/* Real-time Team Presence Dashboard */}
      <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D9B66F]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Today's Live Shift Presence
            </h3>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Updated today at 09:00 AM EST
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                <th className="py-2.5 font-semibold">Employee</th>
                <th className="py-2.5 font-semibold">Presence</th>
                <th className="py-2.5 font-semibold">Check-In</th>
                <th className="py-2.5 font-semibold">Shift Hours Logged</th>
                <th className="py-2.5 font-semibold">Tasks in Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {teamMembers.map((member) => {
                const status = member.attendanceToday.status;
                const statusDot =
                  status === 'present'
                    ? 'bg-emerald-500'
                    : status === 'remote'
                    ? 'bg-blue-500'
                    : status === 'on_break'
                    ? 'bg-amber-500'
                    : 'bg-zinc-400';

                const label =
                  status === 'present'
                    ? 'In Office'
                    : status === 'remote'
                    ? 'Remote'
                    : status === 'on_break'
                    ? 'On Break'
                    : 'Absent / Leave';

                return (
                  <tr key={member.id} className="hover:bg-[var(--bg-card-subtle)]/50">
                    <td className="py-3 font-semibold text-[var(--text-primary)]">
                      <div>{member.fullName}</div>
                      <div className="text-[11px] font-normal text-[var(--text-muted)]">
                        {member.employeeId} · {member.jobTitle}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                        <span>{label}</span>
                      </div>
                    </td>
                    <td className="py-3 text-[var(--text-secondary)]">
                      {member.attendanceToday.checkInTime || '—'}
                    </td>
                    <td className="py-3 font-semibold text-[var(--text-primary)]">
                      {member.attendanceToday.hoursWorked > 0
                        ? `${member.attendanceToday.hoursWorked} hrs`
                        : '0.0 hrs'}
                    </td>
                    <td className="py-3 text-[var(--text-secondary)]">
                      {member.activeTasksCount} active deliverables
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Approvals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Pending Leave Requests ({pendingRequests.length})
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Review vacation, medical, and personal leave submissions requiring lead approval.
            </p>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
            No pending leave requests requiring review.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        {req.employeeName}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {req.employeeId} · {req.department}
                      </p>
                    </div>
                    {/* Clean unboxed metadata */}
                    <div className="text-right text-xs">
                      <span className="font-bold text-[#D9B66F] uppercase">
                        {req.leaveType} leave
                      </span>
                      <span className="block text-[11px] text-[var(--text-muted)]">
                        {req.days} working {req.days === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs space-y-1">
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Leave Period:</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {req.startDate} to {req.endDate}
                      </span>
                    </div>
                    <div className="text-[var(--text-muted)] italic pt-1">
                      "{req.reason}"
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReview(req, 'reject')}
                    className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenReview(req, 'approve')}
                    className="text-xs shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 mr-1 text-[#D9B66F]" />
                    Approve Leave
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Historical Leave Records */}
        {pastRequests.length > 0 && (
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Previous Leave Decisions
            </h4>
            <div className="divide-y divide-[var(--border-subtle)]">
              {pastRequests.map((req) => (
                <div
                  key={req.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">{req.employeeName}</span>
                    <span className="text-[var(--text-muted)] ml-2">
                      ({req.leaveType} · {req.startDate} to {req.endDate})
                    </span>
                    {req.reviewNote && (
                      <p className="text-[11px] text-[var(--text-muted)] italic mt-0.5">
                        Lead note: {req.reviewNote}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold capitalize ${
                        req.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'
                      }`}
                    >
                      {req.status}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Reviewed by {req.reviewedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      {selectedRequest && reviewModalType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] p-6 space-y-4 animate-scaleUp shadow-xl">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Confirm {reviewModalType === 'approve' ? 'Approval' : 'Rejection'} for {selectedRequest.employeeName}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Leave dates: {selectedRequest.startDate} to {selectedRequest.endDate} ({selectedRequest.days} days)
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Lead Review Comments / Coverage Notes
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#D9B66F]/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRequest(null);
                  setReviewModalType(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReview}
              >
                Confirm {reviewModalType === 'approve' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
