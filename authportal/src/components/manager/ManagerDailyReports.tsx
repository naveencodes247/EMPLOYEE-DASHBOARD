import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertTriangle,
  Send,
  X,
  Maximize2,
  Image as ImageIcon,
  Layers,
  User,
  XCircle,
  Filter,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { DailyReport, TeamMember } from '../../types/work';

interface ManagerDailyReportsProps {
  dailyReports: DailyReport[];
  teamMembers: TeamMember[];
  onReviewReport: (reportId: string, feedback: string, decision: 'approved' | 'rejected' | 'reviewed') => void;
  onSelectEmployee?: (employeeId: string) => void;
}

export const ManagerDailyReports: React.FC<ManagerDailyReportsProps> = ({
  dailyReports,
  teamMembers,
  onReviewReport,
  onSelectEmployee,
}) => {
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [decisionMode, setDecisionMode] = useState<'approved' | 'rejected' | 'reviewed'>('approved');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const filteredReports = dailyReports.filter((r) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'submitted' && r.status !== 'submitted') return false;
      if (statusFilter === 'approved' && r.status !== 'approved') return false;
      if (statusFilter === 'rejected' && r.status !== 'rejected' && r.status !== 'revision_requested') return false;
    }
    if (!searchEmployee) return true;
    const q = searchEmployee.toLowerCase();
    return (
      r.employeeName?.toLowerCase().includes(q) ||
      r.employeeId?.toLowerCase().includes(q) ||
      r.taskTitle?.toLowerCase().includes(q) ||
      r.completedWork.toLowerCase().includes(q)
    );
  });

  const handleOpenDecision = (report: DailyReport, mode: 'approved' | 'rejected' | 'reviewed') => {
    setSelectedReport(report);
    setDecisionMode(mode);
    if (mode === 'approved') {
      setFeedbackInput(report.managerFeedback || 'Deliverable verified and approved.');
    } else if (mode === 'rejected') {
      setFeedbackInput(report.managerFeedback || '');
    } else {
      setFeedbackInput(report.managerFeedback || '');
    }
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    const feedback = feedbackInput.trim() || (decisionMode === 'approved' ? 'Approved by lead.' : 'Reviewed.');
    onReviewReport(selectedReport.id, feedback, decisionMode);
    setSelectedReport(null);
  };

  const counts = {
    all: dailyReports.length,
    submitted: dailyReports.filter((r) => r.status === 'submitted').length,
    approved: dailyReports.filter((r) => r.status === 'approved').length,
    rejected: dailyReports.filter((r) => r.status === 'rejected' || r.status === 'revision_requested').length,
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Daily Standup & Work Reports
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Review completed deliverables, task associations, progress, attachments, and blockers.
          </p>
        </div>

        {/* Search by Employee or Task */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchEmployee}
            onChange={(e) => setSearchEmployee(e.target.value)}
            placeholder="Search by employee, ID, or task..."
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#D9B66F]/40"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#D9B66F] text-black shadow-xs'
              : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          All Reports ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('submitted')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            statusFilter === 'submitted'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Awaiting Approval ({counts.submitted})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Approved ({counts.approved})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Revision Requested ({counts.rejected})
        </button>
      </div>

      {/* Reports Feed */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
          <FileText className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            {dailyReports.length === 0 ? 'No reports submitted yet' : 'No matching reports found'}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            {dailyReports.length === 0
              ? 'Team members will appear here once they log their daily standup deliverables and image attachments.'
              : 'Try clearing your filter or search query to see all submitted reports.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isApproved = report.status === 'approved';
            const isRejected = report.status === 'rejected' || report.status === 'revision_requested';
            const isReviewed = report.status === 'reviewed';

            return (
              <div
                key={report.id}
                className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4 hover:border-[#D9B66F]/40 transition-all shadow-xs"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]/70">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectEmployee && report.employeeId && onSelectEmployee(report.employeeId)}
                        className={`font-bold text-sm text-[var(--text-primary)] hover:text-[#D9B66F] transition-colors flex items-center gap-1.5 ${
                          onSelectEmployee ? 'cursor-pointer' : ''
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-[#D9B66F]" />
                        <span>{report.employeeName || 'Engineering Team Member'}</span>
                      </button>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[#D9B66F]">
                        {report.employeeId || 'EMP'}
                      </span>
                      {report.taskTitle && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-[#D9B66F] border border-amber-300 dark:border-amber-900/60 font-semibold text-[11px] inline-flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>Task: {report.taskTitle}</span>
                        </span>
                      )}
                      {typeof report.progress === 'number' && report.progress > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-semibold text-[11px]">
                          {report.progress}% Progress
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      <span>Date: <strong className="text-[var(--text-primary)]">{report.date}</strong></span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>Submitted at {new Date(report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>{report.hoursWorked || 8}h logged</span>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isApproved ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Approved
                      </span>
                    ) : isRejected ? (
                      <span className="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 font-bold text-xs inline-flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        Revision Requested
                      </span>
                    ) : isReviewed ? (
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        Reviewed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-300 font-bold text-xs inline-flex items-center gap-1 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Awaiting Approval
                      </span>
                    )}

                    {/* Review & Decision Actions */}
                    <div className="flex items-center gap-1.5">
                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => handleOpenDecision(report, 'approved')}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                          title="Approve deliverable and complete assignment"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {!isRejected && (
                        <button
                          type="button"
                          onClick={() => handleOpenDecision(report, 'rejected')}
                          className="px-2.5 py-1 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="Reject and request revision from employee"
                        >
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                          <span>Reject / Revision</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenDecision(report, 'reviewed')}
                        className="px-2.5 py-1 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title="Add manager comments without changing approval state"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#D9B66F]" />
                        <span>Notes</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Work Description (if provided) */}
                {report.description && report.description !== report.completedWork && (
                  <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs">
                    <span className="font-bold text-[var(--text-secondary)] uppercase text-[10px] block mb-1">
                      Overview Description:
                    </span>
                    <p className="text-[var(--text-primary)] leading-relaxed">{report.description}</p>
                  </div>
                )}

                {/* Work Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Completed Deliverables
                    </span>
                    <p className="text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">{report.completedWork}</p>
                  </div>

                  {report.workInProgress && (
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                      <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        Work In Progress
                      </span>
                      <p className="text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">{report.workInProgress}</p>
                    </div>
                  )}

                  {report.blockers && report.blockers !== 'None reported.' && (
                    <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-1">
                      <span className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        Blockers & Impediments
                      </span>
                      <p className="text-red-700 dark:text-red-300 leading-relaxed">{report.blockers}</p>
                    </div>
                  )}

                  {(report.notes || report.nextSteps) && (
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1">
                      <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D9B66F] shrink-0" />
                        Additional Notes & Next Steps
                      </span>
                      <p className="text-[var(--text-secondary)] leading-relaxed">{report.notes || report.nextSteps}</p>
                    </div>
                  )}
                </div>

                {/* Supporting Image Attachments Gallery */}
                {report.imageUrls && report.imageUrls.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-subtle)]/70">
                    <span className="font-bold text-[var(--text-secondary)] block text-[11px] uppercase mb-2 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#D9B66F]" />
                      <span>Attached Images & Proof Screenshots ({report.imageUrls.length})</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {report.imageUrls.map((url, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => setLightboxImageUrl(url)}
                          className="relative group w-24 h-24 rounded-2xl overflow-hidden border border-[var(--border-subtle)] cursor-pointer hover:border-[#D9B66F] transition-all shadow-xs shrink-0"
                          title="Click to view full image"
                        >
                          <img
                            src={url}
                            alt={`Attachment ${imgIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Maximize2 className="w-5 h-5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manager Feedback Note */}
                {report.managerFeedback && (
                  <div className="p-3.5 rounded-2xl bg-[#D9B66F]/10 border border-[#D9B66F]/30 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)] mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-[#D9B66F]" />
                      <span>Lead Review Feedback ({report.reviewedAt ? new Date(report.reviewedAt).toLocaleDateString() : 'Reviewed'})</span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{report.managerFeedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
        >
          <div className="absolute inset-0" onClick={() => setLightboxImageUrl(null)} />
          <div className="relative max-w-4xl max-h-[90vh] z-10 space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setLightboxImageUrl(null)}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
                aria-label="Close enlarged view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImageUrl}
              alt="Enlarged attachment"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

      {/* Decision / Review Dialog */}
      {selectedReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] p-6 space-y-4 animate-scaleUp shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  {decisionMode === 'approved' && (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span>Approve Deliverable for {selectedReport.employeeName}</span>
                    </>
                  )}
                  {decisionMode === 'rejected' && (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span>Reject & Request Revision</span>
                    </>
                  )}
                  {decisionMode === 'reviewed' && (
                    <>
                      <MessageSquare className="w-5 h-5 text-[#D9B66F]" />
                      <span>Add Lead Note for {selectedReport.employeeName}</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Report dated {selectedReport.date} ({selectedReport.submittedAt})
                  {selectedReport.taskTitle ? ` · Task: ${selectedReport.taskTitle}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                aria-label="Close dialog"
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  {decisionMode === 'approved' && 'Approval Comments (Optional)'}
                  {decisionMode === 'rejected' && 'Rejection Reason & Required Corrections *'}
                  {decisionMode === 'reviewed' && 'Manager Review & Directions *'}
                </label>
                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  rows={4}
                  required={decisionMode === 'rejected'}
                  placeholder={
                    decisionMode === 'approved'
                      ? 'e.g. Great progress on the deliverable. Reviewed screenshots and verified completion.'
                      : decisionMode === 'rejected'
                      ? 'e.g. Please re-run the unit tests with coverage report and re-upload the updated dashboard screenshot.'
                      : 'e.g. Please update the team during tomorrow standup on the API latency.'
                  }
                  className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#D9B66F]/40"
                />
              </div>

              {decisionMode === 'rejected' && (
                <p className="text-[11px] text-red-600 dark:text-red-400">
                  Rejecting this report will set the task assignment to &quot;Rejected / Needs Correction&quot; and notify the employee to make fixes and resubmit.
                </p>
              )}

              {decisionMode === 'approved' && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Approving this report will officially mark the employee&apos;s assignment as &quot;Completed&quot; and notify the employee.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setSelectedReport(null)}
                >
                  Cancel
                </Button>
                {decisionMode === 'approved' && (
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Deliverable
                  </button>
                )}
                {decisionMode === 'rejected' && (
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject & Request Revision
                  </button>
                )}
                {decisionMode === 'reviewed' && (
                  <Button variant="primary" size="sm" type="submit">
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Submit Feedback
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
