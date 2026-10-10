import React, { useState } from 'react';
import {
  FileText,
  Send,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  History,
  Upload,
  Image as ImageIcon,
  X,
  Maximize2,
  Layers,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { DailyReport, Task } from '../../types/work';

interface EmployeeDailyReportsProps {
  reports: DailyReport[];
  tasks?: Task[];
  onSubmitReport: (report: {
    date?: string;
    taskId?: string;
    description?: string;
    completedWork: string;
    workInProgress?: string;
    progress?: number;
    blockers?: string;
    notes?: string;
    nextSteps?: string;
    hoursWorked?: number;
    files?: File[];
  }) => Promise<{ success: boolean; error?: string } | void> | void;
}

export const EmployeeDailyReports: React.FC<EmployeeDailyReportsProps> = ({
  reports,
  tasks = [],
  onSubmitReport,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [reportDate, setReportDate] = useState(todayStr);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [completedWork, setCompletedWork] = useState('');
  const [workInProgress, setWorkInProgress] = useState('');
  const [taskProgress, setTaskProgress] = useState(50);
  const [blockers, setBlockers] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [hoursWorked, setHoursWorked] = useState(8);

  // Image attachments state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<{ name: string; url: string; size: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Lightbox preview for attachments
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const validFiles: File[] = [];
    const newPreviews: { name: string; url: string; size: number }[] = [];

    for (const f of newFiles) {
      if (!f.type.startsWith('image/')) {
        setErrorMessage(`"${f.name}" is not a valid image file.`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        setErrorMessage(`"${f.name}" exceeds the 10MB size limit.`);
        continue;
      }
      validFiles.push(f);
      newPreviews.push({
        name: f.name,
        url: URL.createObjectURL(f),
        size: f.size,
      });
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index].url);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedWork.trim()) {
      setErrorMessage('Please summarize your completed work for today before submitting.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await onSubmitReport({
        date: reportDate,
        taskId: selectedTaskId || undefined,
        description: workDescription.trim() || completedWork.trim(),
        completedWork: completedWork.trim(),
        workInProgress: workInProgress.trim(),
        progress: taskProgress,
        blockers: blockers.trim() || 'None reported.',
        notes: additionalNotes.trim(),
        nextSteps: additionalNotes.trim(),
        hoursWorked,
        files: selectedFiles,
      });

      if (res && (res as any).success === false) {
        setErrorMessage((res as any).error || 'Failed to submit report. Please retry.');
      } else {
        // Clear form on success
        setWorkDescription('');
        setCompletedWork('');
        setWorkInProgress('');
        setBlockers('');
        setAdditionalNotes('');
        setSelectedTaskId('');
        setTaskProgress(50);
        previewUrls.forEach((p) => URL.revokeObjectURL(p.url));
        setSelectedFiles([]);
        setPreviewUrls([]);
        setSuccessMessage('Daily report and supporting attachments submitted to Supabase successfully!');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Submission error. Please verify network connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Daily Standup & Work Reports
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Submit your daily deliverables, progress, blockers, and supporting images to management.
          </p>
        </div>
      </div>

      {/* Validation / Submission Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between gap-3 text-xs text-red-700 dark:text-red-300 animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Submission Success Alert */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-300 animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold hover:underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Complete Report Submission Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D9B66F]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Create Daily Work Report
            </h3>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Verified Backend Persistence</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Date & Related Task */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                Report Date <span className="text-[#D9B66F]">*</span>
              </label>
              <input
                type="date"
                required
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#D9B66F] outline-none text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                Related Task (Optional)
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  setSelectedTaskId(e.target.value);
                  const matched = tasks.find((t) => t.id === e.target.value);
                  if (matched) setTaskProgress(matched.progress || 50);
                }}
                className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#D9B66F] outline-none text-[var(--text-primary)] cursor-pointer"
              >
                <option value="">General Work / No specific task</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.priority} priority - Due: {task.dueDate})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Work Description & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                Work Description & Overview
              </label>
              <input
                type="text"
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="High-level description of today's focus or feature area"
                className="w-full h-10 px-3 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#D9B66F] outline-none text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--text-secondary)] uppercase">Progress Level</span>
                <span className="font-mono text-[#D9B66F]">{taskProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={taskProgress}
                onChange={(e) => setTaskProgress(Number(e.target.value))}
                className="w-full accent-[#D9B66F] cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Completed Work */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
              Completed Work Today <span className="text-[#D9B66F]">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={completedWork}
              onChange={(e) => setCompletedWork(e.target.value)}
              placeholder="What specific tasks, components, code commits, or deliverables did you complete?"
              className="w-full p-3 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#D9B66F] outline-none text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Work in Progress */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
              Work in Progress (Continuing Next)
            </label>
            <textarea
              rows={2}
              value={workInProgress}
              onChange={(e) => setWorkInProgress(e.target.value)}
              placeholder="What are you currently developing or actively testing?"
              className="w-full p-3 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#D9B66F] outline-none text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Blockers & Difficulties */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
              Blockers or Difficulties Encountered
            </label>
            <textarea
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Any dependencies, pending reviews, infrastructure issues, or blockers?"
              className="w-full p-3 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#D9B66F] outline-none text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
              Additional Notes & Next Steps
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Next shift goals, documentation links, or extra notes..."
              className="w-full p-3 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#D9B66F] outline-none text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Supporting Images Upload Zone */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold uppercase text-[var(--text-secondary)] flex items-center justify-between">
              <span>Supporting Image Attachments (Screenshots, UI, Deliverables)</span>
              <span className="text-[11px] text-[var(--text-muted)] font-normal">Max 10MB per image</span>
            </label>

            {/* Dropzone / Picker */}
            <label className="border-2 border-dashed border-[var(--border-subtle)] hover:border-[#D9B66F] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-[var(--bg-card-subtle)] group">
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-[#D9B66F] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Click or drag images to attach
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Supports PNG, JPG, JPEG, WEBP, GIF
              </span>
            </label>

            {/* Previews List */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {previewUrls.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1.5"
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span className="truncate max-w-[90px]">{file.name}</span>
                      <span>{(file.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-2 right-2 p-1 rounded-md bg-black/70 text-white hover:bg-red-600 transition-colors cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <div className="text-[11px] text-[var(--text-muted)]">
              {selectedFiles.length > 0 && `${selectedFiles.length} images queued for Supabase Storage.`}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit Daily Report
            </Button>
          </div>
        </form>
      </div>

      {/* Submitted Reports History */}
      <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#D9B66F]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Previous Submitted Reports
            </h3>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{reports.length} reports logged</span>
        </div>

        {reports.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2">
            <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <h4 className="text-xs font-bold text-[var(--text-primary)]">No reports submitted yet</h4>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Use the form above to submit your first daily work report and upload deliverables.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-3 text-xs"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]/70">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--text-primary)] font-mono text-sm">
                      {rep.date}
                    </span>
                    {rep.taskTitle && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-[#D9B66F] border border-amber-300 dark:border-amber-900/60 font-semibold text-[11px] inline-flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>Task: {rep.taskTitle}</span>
                      </span>
                    )}
                    {typeof rep.progress === 'number' && rep.progress > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-semibold text-[11px]">
                        {rep.progress}% Progress
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Submitted: {new Date(rep.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Content grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="font-bold text-[var(--text-secondary)] block text-[11px] uppercase mb-1">
                      Completed Work:
                    </span>
                    <p className="text-[var(--text-primary)] whitespace-pre-line leading-relaxed">
                      {rep.completedWork}
                    </p>
                  </div>

                  {rep.workInProgress && (
                    <div>
                      <span className="font-bold text-[var(--text-secondary)] block text-[11px] uppercase mb-1">
                        In Progress:
                      </span>
                      <p className="text-[var(--text-primary)] whitespace-pre-line leading-relaxed">
                        {rep.workInProgress}
                      </p>
                    </div>
                  )}

                  {rep.blockers && rep.blockers !== 'None reported.' && (
                    <div>
                      <span className="font-bold text-red-600 dark:text-red-400 block text-[11px] uppercase mb-1">
                        Blockers & Impediments:
                      </span>
                      <p className="text-red-700 dark:text-red-300 leading-relaxed">
                        {rep.blockers}
                      </p>
                    </div>
                  )}

                  {rep.notes && (
                    <div>
                      <span className="font-bold text-[var(--text-secondary)] block text-[11px] uppercase mb-1">
                        Additional Notes:
                      </span>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        {rep.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Attached Images Gallery */}
                {rep.imageUrls && rep.imageUrls.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-subtle)]/70">
                    <span className="font-bold text-[var(--text-secondary)] block text-[11px] uppercase mb-2 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#D9B66F]" />
                      <span>Attached Images ({rep.imageUrls.length})</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {rep.imageUrls.map((url, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => setLightboxImageUrl(url)}
                          className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[var(--border-subtle)] cursor-pointer hover:border-[#D9B66F] transition-all shrink-0"
                        >
                          <img
                            src={url}
                            alt={`Attachment ${imgIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
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
    </div>
  );
};
