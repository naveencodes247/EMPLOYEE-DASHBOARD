-- Migration: 20261010000002_task_assignments_and_work_permissions.sql
-- Description: Multi-assignee support, task assignments table, and organization-wide manager access policies.

-- 1. Create task_assignments table
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  CONSTRAINT uq_task_assignment UNIQUE (task_id, user_id)
);

-- 2. Add start_date to tasks if not present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN start_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON public.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON public.task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);

-- 4. Backfill existing task assignments from tasks.assigned_to
INSERT INTO public.task_assignments (task_id, user_id, assigned_by)
SELECT id, assigned_to, created_by 
FROM public.tasks 
WHERE assigned_to IS NOT NULL
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 5. Enable RLS on task_assignments
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- 6. Task Assignment RLS Policies
DROP POLICY IF EXISTS "Admins can manage all task_assignments" ON public.task_assignments;
CREATE POLICY "Admins can manage all task_assignments"
  ON public.task_assignments FOR ALL
  USING ((SELECT app_security.is_admin()))
  WITH CHECK ((SELECT app_security.is_admin()));

DROP POLICY IF EXISTS "Managers can manage all task_assignments" ON public.task_assignments;
CREATE POLICY "Managers can manage all task_assignments"
  ON public.task_assignments FOR ALL
  USING ((SELECT app_security.is_manager()))
  WITH CHECK ((SELECT app_security.is_manager()));

DROP POLICY IF EXISTS "Employees can view assigned task_assignments" ON public.task_assignments;
CREATE POLICY "Employees can view assigned task_assignments"
  ON public.task_assignments FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT app_security.is_active_user()));

DROP POLICY IF EXISTS "Employees can update assigned task_assignments" ON public.task_assignments;
CREATE POLICY "Employees can update assigned task_assignments"
  ON public.task_assignments FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 7. Tasks Table Policies
DROP POLICY IF EXISTS "Managers can manage department tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can manage all tasks" ON public.tasks;
CREATE POLICY "Managers can manage all tasks"
  ON public.tasks FOR ALL
  USING ((SELECT app_security.is_manager()))
  WITH CHECK ((SELECT app_security.is_manager()));

DROP POLICY IF EXISTS "Employees can view assigned tasks" ON public.tasks;
CREATE POLICY "Employees can view assigned tasks"
  ON public.tasks FOR SELECT
  USING (
    assigned_to = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM public.task_assignments ta WHERE ta.task_id = tasks.id AND ta.user_id = (SELECT auth.uid())) OR
    (SELECT app_security.is_active_user())
  );

DROP POLICY IF EXISTS "Employees can update assigned task status" ON public.tasks;
CREATE POLICY "Employees can update assigned task status"
  ON public.tasks FOR UPDATE
  USING (
    assigned_to = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM public.task_assignments ta WHERE ta.task_id = tasks.id AND ta.user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    assigned_to = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM public.task_assignments ta WHERE ta.task_id = tasks.id AND ta.user_id = (SELECT auth.uid()))
  );

-- 8. Profiles: Managers can view all active employee & manager profiles
DROP POLICY IF EXISTS "Managers can view all active profiles" ON public.profiles;
CREATE POLICY "Managers can view all active profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT app_security.is_manager()) AND
    account_status = 'active'::public.account_status
  );

-- 9. Attendance: Managers can view all attendance records
DROP POLICY IF EXISTS "Managers can view all attendance" ON public.attendance_records;
CREATE POLICY "Managers can view all attendance"
  ON public.attendance_records FOR SELECT
  USING ((SELECT app_security.is_manager()));

-- 10. Daily Reports: Managers can review and manage all daily reports
DROP POLICY IF EXISTS "Managers can review all daily reports" ON public.daily_reports;
CREATE POLICY "Managers can review all daily reports"
  ON public.daily_reports FOR ALL
  USING ((SELECT app_security.is_manager()))
  WITH CHECK ((SELECT app_security.is_manager()));
