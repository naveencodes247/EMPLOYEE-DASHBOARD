import React from 'react';
import { CheckCircle2, Circle, Clock, Check } from 'lucide-react';

export interface TaskItemData {
  id: string;
  title: string;
  dateStr: string;
  completed: boolean;
  categoryIcon?: React.ReactNode;
}

export interface TaskListProps {
  title?: string;
  completedCount?: number;
  totalCount?: number;
  tasks: TaskItemData[];
  onToggleTask?: (id: string) => void;
  darkVariant?: boolean;
  className?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  title = 'Onboarding Task',
  completedCount = 2,
  totalCount = 8,
  tasks,
  onToggleTask,
  darkVariant = true,
  className = '',
}) => {
  return (
    <div
      className={`p-5 rounded-3xl border transition-all duration-200 ${
        darkVariant
          ? 'bg-[#222222] dark:bg-[#1A1C22] border-[#33353D] text-white shadow-sm'
          : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-primary)]'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10 dark:border-white/5">
        <span className="text-sm font-semibold tracking-tight">
          {title}
        </span>
        <span className="text-base font-bold tracking-tight text-[#F8E7A1] dark:text-[#D9B66F] font-mono">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Task List Items */}
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onToggleTask?.(task.id)}
            role={onToggleTask ? 'button' : undefined}
            tabIndex={onToggleTask ? 0 : undefined}
            onKeyDown={(e) => {
              if (onToggleTask && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onToggleTask(task.id);
              }
            }}
            className={`flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all cursor-pointer select-none ${
              darkVariant
                ? 'hover:bg-white/5'
                : 'hover:bg-[var(--bg-card-subtle)]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Category Icon or Bullet */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  darkVariant
                    ? 'bg-white/10 text-white/80'
                    : 'bg-[var(--bg-app)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                }`}
              >
                {task.categoryIcon || <Clock className="w-3.5 h-3.5" />}
              </div>

              <div className="min-w-0 flex flex-col">
                <span
                  className={`text-xs font-medium truncate ${
                    task.completed && darkVariant
                      ? 'text-white/70 line-through'
                      : task.completed
                      ? 'text-[var(--text-muted)] line-through'
                      : darkVariant
                      ? 'text-white'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {task.title}
                </span>
                <span className={`text-[10px] ${darkVariant ? 'text-white/50' : 'text-[var(--text-muted)]'}`}>
                  {task.dateStr}
                </span>
              </div>
            </div>

            {/* Checkmark indicator */}
            <div className="shrink-0">
              {task.completed ? (
                <div className="w-4 h-4 rounded-full bg-[#F8E7A1] text-[#222222] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : (
                <div
                  className={`w-4 h-4 rounded-full border ${
                    darkVariant ? 'border-white/30' : 'border-[var(--border-subtle)]'
                  }`}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
