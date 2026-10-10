-- Migration: Multi-Employee Task Assignment, Subtasks, Activity Tracking, and Extensions
-- File: 20261010000005_multi_assign_and_activity_tracking.sql

-- 1. Extend task_assignments table
ALTER TABLE public.task_assignments 
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS blockers text DEFAULT '',
  ADD COLUMN IF NOT EXISTS extension_requested_date date,
  ADD COLUMN IF NOT EXISTS extension_reason text DEFAULT '',
  ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]'::jsonb;

-- 2. Create activity_logs table for persistent audit & activity history
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name text,
  actor_role text,
  target_employee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_employee_name text,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexing for high-performance filtering and pagination
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON public.activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target_id ON public.activity_logs(target_employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Managers view relevant activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Employees view own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users insert activity logs" ON public.activity_logs;

-- Policies for activity_logs
CREATE POLICY "Admins view all activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Managers view relevant activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
    AND (
      actor_id = auth.uid()
      OR target_employee_id IN (
        SELECT id FROM public.profiles 
        WHERE department_id = (SELECT department_id FROM public.profiles WHERE id = auth.uid())
      )
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
    )
  );

CREATE POLICY "Employees view own activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (
    target_employee_id = auth.uid()
    OR actor_id = auth.uid()
  );

CREATE POLICY "Authenticated users insert activity logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid() OR actor_id IS NULL
  );

-- 3. Create task_comments table for collaboration
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage task comments" ON public.task_comments;
DROP POLICY IF EXISTS "Managers manage task comments" ON public.task_comments;
DROP POLICY IF EXISTS "Assignees view and create task comments" ON public.task_comments;

CREATE POLICY "Admins manage task comments"
  ON public.task_comments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Managers manage task comments"
  ON public.task_comments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager'));

CREATE POLICY "Assignees view and create task comments"
  ON public.task_comments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.task_assignments ta 
      WHERE ta.task_id = task_comments.task_id AND ta.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- 4. Create task_extension_requests table
CREATE TABLE IF NOT EXISTS public.task_extension_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  proposed_deadline date NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.task_extension_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage extension requests" ON public.task_extension_requests;
DROP POLICY IF EXISTS "Managers manage extension requests" ON public.task_extension_requests;
DROP POLICY IF EXISTS "Employees manage own extension requests" ON public.task_extension_requests;

CREATE POLICY "Admins manage extension requests"
  ON public.task_extension_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Managers manage extension requests"
  ON public.task_extension_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager'));

CREATE POLICY "Employees manage own extension requests"
  ON public.task_extension_requests FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Create attendance_correction_requests table
CREATE TABLE IF NOT EXISTS public.attendance_correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id uuid REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_check_in timestamptz,
  requested_check_out timestamptz,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.attendance_correction_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage correction requests" ON public.attendance_correction_requests;
DROP POLICY IF EXISTS "Managers manage correction requests" ON public.attendance_correction_requests;
DROP POLICY IF EXISTS "Employees manage own correction requests" ON public.attendance_correction_requests;

CREATE POLICY "Admins manage correction requests"
  ON public.attendance_correction_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Managers manage correction requests"
  ON public.attendance_correction_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager'));

CREATE POLICY "Employees manage own correction requests"
  ON public.attendance_correction_requests FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. Atomic Transactional Task Assignment Function
CREATE OR REPLACE FUNCTION public.assign_task_transactional(
  p_title text,
  p_description text,
  p_project text,
  p_priority text,
  p_due_date date,
  p_start_date date,
  p_assignee_ids uuid[],
  p_department_id uuid DEFAULT NULL,
  p_created_by uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id uuid;
  v_actor_role text;
  v_actor_name text;
  v_task_id uuid;
  v_target_id uuid;
  v_target_name text;
  v_count integer := 0;
  v_primary_assignee uuid;
BEGIN
  -- Authenticate actor
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    v_actor_id := p_created_by;
  END IF;

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to assign deliverables.';
  END IF;

  -- Validate role
  SELECT role, full_name INTO v_actor_role, v_actor_name
  FROM public.profiles
  WHERE id = v_actor_id;

  IF v_actor_role NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only managers and admins can create and assign deliverables.';
  END IF;

  IF p_assignee_ids IS NULL OR cardinality(p_assignee_ids) = 0 THEN
    RAISE EXCEPTION 'At least one eligible employee must be selected for assignment.';
  END IF;

  v_primary_assignee := p_assignee_ids[1];

  -- 1. Insert parent task
  INSERT INTO public.tasks (
    title,
    description,
    project,
    priority,
    status,
    progress,
    due_date,
    start_date,
    created_by,
    department_id,
    assigned_to,
    created_at,
    updated_at
  ) VALUES (
    trim(p_title),
    COALESCE(trim(p_description), ''),
    COALESCE(trim(p_project), 'Core Operations'),
    p_priority,
    'not_started',
    0,
    p_due_date,
    COALESCE(p_start_date, CURRENT_DATE),
    v_actor_id,
    p_department_id,
    v_primary_assignee,
    now(),
    now()
  )
  RETURNING id INTO v_task_id;

  -- 2. Insert assignments for each employee atomically
  FOREACH v_target_id IN ARRAY p_assignee_ids
  LOOP
    INSERT INTO public.task_assignments (
      task_id,
      user_id,
      assigned_by,
      status,
      progress,
      completion_notes,
      assigned_at,
      updated_at
    ) VALUES (
      v_task_id,
      v_target_id,
      v_actor_id,
      'not_started',
      0,
      '',
      now(),
      now()
    )
    ON CONFLICT (task_id, user_id) DO NOTHING;

    v_count := v_count + 1;

    -- Lookup target employee name for activity log
    SELECT full_name INTO v_target_name FROM public.profiles WHERE id = v_target_id;

    -- Log task_assigned activity for each employee
    INSERT INTO public.activity_logs (
      actor_id,
      actor_name,
      actor_role,
      target_employee_id,
      target_employee_name,
      action_type,
      entity_type,
      entity_id,
      details,
      created_at
    ) VALUES (
      v_actor_id,
      v_actor_name,
      v_actor_role,
      v_target_id,
      v_target_name,
      'task_assigned',
      'task',
      v_task_id::text,
      jsonb_build_object(
        'task_id', v_task_id,
        'title', p_title,
        'priority', p_priority,
        'due_date', p_due_date
      ),
      now()
    );

    -- Send notification
    INSERT INTO public.work_notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      created_at
    ) VALUES (
      v_target_id,
      'task_assignment',
      'New Task Assigned',
      'You were assigned deliverable: "' || trim(p_title) || '" (Due: ' || p_due_date::text || ')',
      '/tasks',
      now()
    );
  END LOOP;

  -- Log task_created overall
  INSERT INTO public.activity_logs (
    actor_id,
    actor_name,
    actor_role,
    target_employee_id,
    target_employee_name,
    action_type,
    entity_type,
    entity_id,
    details,
    created_at
  ) VALUES (
    v_actor_id,
    v_actor_name,
    v_actor_role,
    NULL,
    NULL,
    'task_created',
    'task',
    v_task_id::text,
    jsonb_build_object(
      'task_id', v_task_id,
      'title', p_title,
      'priority', p_priority,
      'due_date', p_due_date,
      'assigned_count', v_count
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'task_id', v_task_id,
    'assigned_count', v_count,
    'message', 'Task assigned successfully to ' || v_count || ' employees.'
  );
END;
$$;
