-- Migration: 20261010000001_domain_tables_and_work_foundation.sql
-- Description: Creates operational domain tables (tasks, attendance, daily reports, leave requests, calendar, notifications, settings)
-- with comprehensive Row Level Security (RLS) enforcement.

-- 1. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  project text NOT NULL DEFAULT 'Operations',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'blocked', 'completed')),
  progress int NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date date NOT NULL DEFAULT (CURRENT_DATE + interval '7 days'),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Subtasks Table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_time timestamptz,
  check_out_time timestamptz,
  break_minutes int NOT NULL DEFAULT 0,
  total_hours numeric(4,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'on_leave', 'remote', 'on_break', 'not_checked_in')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_attendance_date UNIQUE (user_id, date)
);

-- 4. Daily Reports Table
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  completed_work text NOT NULL,
  work_in_progress text NOT NULL,
  blockers text,
  next_steps text,
  hours_worked numeric(4,2) NOT NULL DEFAULT 8.00,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved', 'revision_requested')),
  manager_feedback text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  leave_type text NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'unpaid')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days int NOT NULL DEFAULT 1,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_note text,
  requested_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Calendar Events Table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_type text NOT NULL DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'deadline', 'activity')),
  date date NOT NULL DEFAULT CURRENT_DATE,
  start_time text NOT NULL DEFAULT '10:00 AM',
  end_time text NOT NULL DEFAULT '11:00 AM',
  meeting_link text,
  attendees text[] DEFAULT ARRAY[]::text[],
  project text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Work Notifications Table
CREATE TABLE IF NOT EXISTS public.work_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'announcement' CHECK (type IN ('task_assignment', 'deadline_reminder', 'manager_message', 'meeting', 'announcement', 'approval_update')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Portal Settings Table
CREATE TABLE IF NOT EXISTS public.portal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enforce_2fa boolean NOT NULL DEFAULT true,
  session_timeout_minutes int NOT NULL DEFAULT 30,
  password_expiry_days int NOT NULL DEFAULT 90,
  ip_allowlist_enabled boolean NOT NULL DEFAULT false,
  allowed_ip_ranges text NOT NULL DEFAULT '192.168.1.0/24, 10.0.0.0/16',
  work_hours_start text NOT NULL DEFAULT '09:00',
  work_hours_end text NOT NULL DEFAULT '18:00',
  allow_remote_check_in boolean NOT NULL DEFAULT true,
  daily_reports_required boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 9. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_employee ON public.daily_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.daily_reports(date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dept ON public.leave_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON public.calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.work_notifications(user_id);

-- 10. Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;

-- 11. Row Level Security Policies

-- Tasks Policies
CREATE POLICY "Admins can manage all tasks"
  ON public.tasks FOR ALL
  USING ((SELECT app_security.is_admin()))
  WITH CHECK ((SELECT app_security.is_admin()));

CREATE POLICY "Managers can manage department tasks"
  ON public.tasks FOR ALL
  USING (
    (SELECT app_security.is_manager()) AND
    department_id = (SELECT app_security.get_manager_department_id())
  )
  WITH CHECK (
    (SELECT app_security.is_manager()) AND
    department_id = (SELECT app_security.get_manager_department_id())
  );

CREATE POLICY "Employees can view assigned tasks"
  ON public.tasks FOR SELECT
  USING (
    assigned_to = (SELECT auth.uid()) OR
    (SELECT app_security.is_active_user())
  );

CREATE POLICY "Employees can update assigned task status"
  ON public.tasks FOR UPDATE
  USING (assigned_to = (SELECT auth.uid()))
  WITH CHECK (assigned_to = (SELECT auth.uid()));

-- Subtasks Policies
CREATE POLICY "Users can view subtasks of visible tasks"
  ON public.subtasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = subtasks.task_id));

CREATE POLICY "Managers and Admins can manage subtasks"
  ON public.subtasks FOR ALL
  USING ((SELECT app_security.is_admin()) OR (SELECT app_security.is_manager()))
  WITH CHECK ((SELECT app_security.is_admin()) OR (SELECT app_security.is_manager()));

CREATE POLICY "Assignees can toggle subtasks"
  ON public.subtasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = subtasks.task_id AND t.assigned_to = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = subtasks.task_id AND t.assigned_to = (SELECT auth.uid())));

-- Attendance Policies
CREATE POLICY "Admins can manage all attendance"
  ON public.attendance_records FOR ALL
  USING ((SELECT app_security.is_admin()))
  WITH CHECK ((SELECT app_security.is_admin()));

CREATE POLICY "Managers can view department attendance"
  ON public.attendance_records FOR SELECT
  USING (
    (SELECT app_security.is_manager()) AND
    user_id IN (
      SELECT id FROM public.profiles WHERE department_id = (SELECT app_security.get_manager_department_id())
    )
  );

CREATE POLICY "Users can manage own attendance"
  ON public.attendance_records FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Daily Reports Policies
CREATE POLICY "Admins can manage all daily reports"
  ON public.daily_reports FOR ALL
  USING ((SELECT app_security.is_admin()))
  WITH CHECK ((SELECT app_security.is_admin()));

CREATE POLICY "Managers can review department reports"
  ON public.daily_reports FOR ALL
  USING (
    (SELECT app_security.is_manager()) AND
    employee_id IN (
      SELECT id FROM public.profiles WHERE department_id = (SELECT app_security.get_manager_department_id())
    )
  )
  WITH CHECK (
    (SELECT app_security.is_manager()) AND
    employee_id IN (
      SELECT id FROM public.profiles WHERE department_id = (SELECT app_security.get_manager_department_id())
    )
  );

CREATE POLICY "Employees can manage own daily reports"
  ON public.daily_reports FOR ALL
  USING (employee_id = (SELECT auth.uid()))
  WITH CHECK (employee_id = (SELECT auth.uid()));

-- Leave Requests Policies
CREATE POLICY "Admins can manage all leave requests"
  ON public.leave_requests FOR ALL
  USING ((SELECT app_security.is_admin()))
  WITH CHECK ((SELECT app_security.is_admin()));

CREATE POLICY "Managers can review department leave requests"
  ON public.leave_requests FOR ALL
  USING (
    (SELECT app_security.is_manager()) AND
    department_id = (SELECT app_security.get_manager_department_id())
  )
  WITH CHECK (
    (SELECT app_security.is_manager()) AND
    department_id = (SELECT app_security.get_manager_department_id())
  );

CREATE POLICY "Employees can manage own leave requests"
  ON public.leave_requests FOR ALL
  USING (employee_id = (SELECT auth.uid()))
  WITH CHECK (employee_id = (SELECT auth.uid()));

-- Calendar Events Policies
CREATE POLICY "Active users can view calendar events"
  ON public.calendar_events FOR SELECT
  USING ((SELECT app_security.is_active_user()));

CREATE POLICY "Managers and Admins can manage calendar events"
  ON public.calendar_events FOR ALL
  USING ((SELECT app_security.is_admin()) OR (SELECT app_security.is_manager()))
  WITH CHECK ((SELECT app_security.is_admin()) OR (SELECT app_security.is_manager()));

-- Work Notifications Policies
CREATE POLICY "Users can view and manage own notifications"
  ON public.work_notifications FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Managers and Admins can create notifications"
  ON public.work_notifications FOR INSERT
  WITH CHECK ((SELECT app_security.is_admin()) OR (SELECT app_security.is_manager()));

-- Portal Settings Policies
CREATE POLICY "Active users can view portal settings"
  ON public.portal_settings FOR SELECT
  USING ((SELECT app_security.is_active_user()));

CREATE POLICY "Admins can manage portal settings"
  ON public.portal_settings FOR ALL
  USING ((SELECT app_security.is_admin()))
  WITH CHECK ((SELECT app_security.is_admin()));

-- 12. Seed Initial Portal Settings
INSERT INTO public.portal_settings (
  enforce_2fa,
  session_timeout_minutes,
  password_expiry_days,
  ip_allowlist_enabled,
  allowed_ip_ranges,
  work_hours_start,
  work_hours_end,
  allow_remote_check_in,
  daily_reports_required
) VALUES (
  true,
  30,
  90,
  false,
  '192.168.1.0/24, 10.0.0.0/16',
  '09:00',
  '18:00',
  true,
  true
) ON CONFLICT DO NOTHING;
