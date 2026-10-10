-- Migration: Support pending_approval and rejected statuses across tasks, task_assignments, and daily_reports
-- File: 20261010000007_task_approval_statuses.sql

-- 1. Update task_assignments_status_check
ALTER TABLE public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_status_check;
ALTER TABLE public.task_assignments 
  ADD CONSTRAINT task_assignments_status_check 
  CHECK (status IN ('not_started', 'in_progress', 'blocked', 'pending_approval', 'completed', 'rejected'));

-- 2. Update tasks_status_check
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks 
  ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('not_started', 'in_progress', 'blocked', 'pending_approval', 'completed', 'rejected'));

-- 3. Update daily_reports_status_check
ALTER TABLE public.daily_reports DROP CONSTRAINT IF EXISTS daily_reports_status_check;
ALTER TABLE public.daily_reports 
  ADD CONSTRAINT daily_reports_status_check 
  CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected', 'revision_requested'));
