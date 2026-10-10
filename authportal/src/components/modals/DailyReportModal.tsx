import React, { useState, useEffect } from 'react';
import { X, Send, FileText, CheckCircle2, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import type { DailyReport, Task } from '../../types/work';

interface DailyReportModalProps {
  isOpen: boolean;
  tasks?: Task[];
  initialTaskId?: string;
  isMandatoryCompletion?: boolean;
  onClose: () => void;
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
    isCompletionSubmission?: boolean;
  }) => Promise<{ success: boolean; error?: string } | void> | void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  tasks = [],
  initialTaskId,
  isMandatoryCompletion = false,
  onClose,
  onSubmitReport,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [reportDate, setReportDate] = useState(todayStr);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId || '');
  const [workDescription, setWorkDescription] = useState('');
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [inProgressSummary, setInProgressSummary] = useState('');
  const [blockers, setBlockers] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [taskProgress, setTaskProgress] = useState(isMandatoryCompletion ? 100 : 50);
  const [hoursWorked, setHoursWorked] = useState(8);

  // Files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<{ name: string; url: string; size: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialTaskId) {
      setSelectedTaskId(initialTaskId);
      const matched = tasks.find((t) => t.id === initialTaskId);
      if (matched) {
        setWorkDescription(`Deliverable submission for: ${matched.title}`);
        if (isMandatoryCompletion) setTaskProgress(100);
      }
    }
  }, [initialTaskId, tasks, isMandatoryCompletion]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const validFiles: File[] = [];
    const newPreviews: { name: string; url: string; size: number }[] = [];

    for (const f of newFiles) {
      if (!f.type.startsWith('image/')) {
        setErrorMessage(`"${f.name}" is not an image file.`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        setErrorMessage(`"${f.name}" exceeds the 10MB limit.`);
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
    if (!tasksCompleted.trim()) {
      setErrorMessage('Please summarize your completed work for today before submitting.');
      return;
    }

    // Strict validation: proof image upload is mandatory for task deliverable completion
    if ((isMandatoryCompletion || selectedTaskId || taskProgress === 100) && selectedFiles.length === 0) {
      setErrorMessage('A supporting proof image (screenshot or deliverable picture) is mandatory for this report.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await onSubmitReport({
        date: reportDate,
        taskId: selectedTaskId || undefined,
        description: workDescription.trim() || tasksCompleted.trim(),
        completedWork: tasksCompleted.trim(),
        workInProgress: inProgressSummary.trim(),
        progress: isMandatoryCompletion ? 100 : taskProgress,
        blockers: blockers.trim() || 'None reported.',
        notes: additionalNotes.trim(),
        nextSteps: additionalNotes.trim(),
        hoursWorked,
        files: selectedFiles,
        isCompletionSubmission: Boolean(isMandatoryCompletion || taskProgress === 100),
      });

      if (res && (res as any).success === false) {
        setErrorMessage((res as any).error || 'Failed to submit report. Please retry.');
      } else {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          previewUrls.forEach((p) => URL.revokeObjectURL(p.url));
          setSelectedFiles([]);
          setPreviewUrls([]);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Submission error. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#D9B66F]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Submit Daily Work Report
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Record your daily deliverables & attachments for management review
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Daily Report Submitted!</h3>
            <p className="text-xs text-[var(--text-secondary)]">Your work report and attachments were recorded in Supabase.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Row 1: Date & Related Task */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Report Date <span className="text-[#D9B66F]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none focus:border-[#D9B66F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Related Task (Optional)
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => {
                    setSelectedTaskId(e.target.value);
                    const matched = tasks.find((t) => t.id === e.target.value);
                    if (matched) setTaskProgress(matched.progress || 50);
                  }}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none focus:border-[#D9B66F] cursor-pointer"
                >
                  <option value="">General Work (No specific task)</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} (Due: {task.dueDate})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Work Description & Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Work Description
                </label>
                <input
                  type="text"
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Summary of today's focus..."
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none focus:border-[#D9B66F]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
                  <span>Progress</span>
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

            {/* Completed Tasks */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Completed Deliverables & Tasks <span className="text-[#D9B66F]">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={tasksCompleted}
                onChange={(e) => setTasksCompleted(e.target.value)}
                placeholder="• Completed frontend design updates&#10;• Pushed pull request #14"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none focus:border-[#D9B66F] resize-none"
              />
            </div>

            {/* In Progress Tasks */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                In-Progress Work (Continuing Next)
              </label>
              <textarea
                rows={2}
                value={inProgressSummary}
                onChange={(e) => setInProgressSummary(e.target.value)}
                placeholder="• Writing automated test specs&#10;• API authentication review"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none focus:border-[#D9B66F] resize-none"
              />
            </div>

            {/* Blockers & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Blockers or Difficulties
                </label>
                <input
                  type="text"
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  placeholder="None reported"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none focus:border-[#D9B66F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Additional Notes
                </label>
                <input
                  type="text"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Extra context or next steps..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none focus:border-[#D9B66F]"
                />
              </div>
            </div>

            {/* Supporting Images */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Supporting Images (Screenshots / Deliverables)
              </label>
              <label className="border border-dashed border-[var(--border-subtle)] hover:border-[#D9B66F] rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-[var(--bg-card-subtle)] transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-4 h-4 text-[#D9B66F]" />
                <span className="text-xs text-[var(--text-secondary)]">Click to add screenshots or images</span>
              </label>

              {previewUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {previewUrls.map((p, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-1 right-1 p-0.5 rounded bg-black/70 text-white hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onClose}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
                className="text-xs shadow-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5 text-[#D9B66F]" />
                <span>Submit Report</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
