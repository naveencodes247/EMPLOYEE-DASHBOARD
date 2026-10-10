-- Migration: Additional Activity Triggers for Comments, Extensions, Blockers, and Corrections
-- File: 20261010000006_additional_activity_triggers.sql

-- 1. Extend task_assignments trigger to record blocker reporting
CREATE OR REPLACE FUNCTION public.trg_task_assignments_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id uuid;
  v_actor_name text;
  v_actor_role text;
  v_target_name text;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NOT NULL THEN
    SELECT full_name, role INTO v_actor_name, v_actor_role FROM public.profiles WHERE id = v_actor_id;
  END IF;
  SELECT full_name INTO v_target_name FROM public.profiles WHERE id = NEW.user_id;

  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN
      NEW.completed_at := COALESCE(NEW.completed_at, now());
      INSERT INTO public.activity_logs (
        actor_id, actor_name, actor_role, target_employee_id, target_employee_name,
        action_type, entity_type, entity_id, details, created_at
      ) VALUES (
        COALESCE(v_actor_id, NEW.user_id), COALESCE(v_actor_name, v_target_name), COALESCE(v_actor_role, 'employee'),
        NEW.user_id, v_target_name, 'task_completed', 'assignment', NEW.id::text,
        jsonb_build_object('task_id', NEW.task_id, 'previous_status', OLD.status, 'new_status', NEW.status), now()
      );
    ELSE
      INSERT INTO public.activity_logs (
        actor_id, actor_name, actor_role, target_employee_id, target_employee_name,
        action_type, entity_type, entity_id, details, created_at
      ) VALUES (
        COALESCE(v_actor_id, NEW.user_id), COALESCE(v_actor_name, v_target_name), COALESCE(v_actor_role, 'employee'),
        NEW.user_id, v_target_name, 'task_status_changed', 'assignment', NEW.id::text,
        jsonb_build_object('task_id', NEW.task_id, 'previous_status', OLD.status, 'new_status', NEW.status), now()
      );
    END IF;
  END IF;

  IF (OLD.progress IS DISTINCT FROM NEW.progress) THEN
    INSERT INTO public.activity_logs (
      actor_id, actor_name, actor_role, target_employee_id, target_employee_name,
      action_type, entity_type, entity_id, details, created_at
    ) VALUES (
      COALESCE(v_actor_id, NEW.user_id), COALESCE(v_actor_name, v_target_name), COALESCE(v_actor_role, 'employee'),
      NEW.user_id, v_target_name, 'task_progress_updated', 'assignment', NEW.id::text,
      jsonb_build_object('task_id', NEW.task_id, 'previous_progress', OLD.progress, 'new_progress', NEW.progress), now()
    );
  END IF;

  IF (OLD.blockers IS DISTINCT FROM NEW.blockers AND NEW.blockers IS NOT NULL AND NEW.blockers <> '') THEN
    INSERT INTO public.activity_logs (
      actor_id, actor_name, actor_role, target_employee_id, target_employee_name,
      action_type, entity_type, entity_id, details, created_at
    ) VALUES (
      COALESCE(v_actor_id, NEW.user_id), COALESCE(v_actor_name, v_target_name), COALESCE(v_actor_role, 'employee'),
      NEW.user_id, v_target_name, 'blocker_reported', 'assignment', NEW.id::text,
      jsonb_build_object('task_id', NEW.task_id, 'blockers', NEW.blockers), now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Task comments trigger
CREATE OR REPLACE FUNCTION public.trg_task_comments_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_name text;
  v_user_role text;
  v_task_title text;
BEGIN
  SELECT full_name, role INTO v_user_name, v_user_role FROM public.profiles WHERE id = NEW.user_id;
  SELECT title INTO v_task_title FROM public.tasks WHERE id = NEW.task_id;

  INSERT INTO public.activity_logs (
    actor_id, actor_name, actor_role, target_employee_id, target_employee_name,
    action_type, entity_type, entity_id, details, created_at
  ) VALUES (
    NEW.user_id, COALESCE(v_user_name, 'User'), COALESCE(v_user_role, 'employee'),
    NEW.user_id, v_user_name, 'task_comment_added', 'task_comment', NEW.id::text,
    jsonb_build_object('task_id', NEW.task_id, 'task_title', v_task_title, 'comment_preview', substring(NEW.comment, 1, 100)), now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_comments_activity ON public.task_comments;
CREATE TRIGGER trg_task_comments_activity
  AFTER INSERT ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.trg_task_comments_activity();

-- 3. Task extension requests trigger
CREATE OR REPLACE FUNCTION public.trg_task_extensions_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id uuid;
  v_actor_name text;
  v_actor_role text;
  v_target_name text;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NOT NULL THEN
    SELECT full_name, role INTO v_actor_name, v_actor_role FROM public.profiles WHERE id = v_actor_id;
  END IF;
  SELECT full_name INTO v_target_name FROM public.profiles WHERE id = NEW.user_id;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.activity_logs (
      actor_id, actor_name, actor_role, target_employee_id, target_employee_name,
      action_type, entity_type, entity_id, details, created_at
    ) VALUES (
      NEW.user_id, v_target_name, 'employee',
      NEW.user_id, v_target_name, 'deadline_extension_requested', 'extension', NEW.id::text,
      jsonb_build_object('task_id', NEW.task_id, 'proposed_deadline', NEW.proposed_deadline, 'reason', NEW.reason), now()
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.activity_logs (
      actor_id, actor_name, actor_role, target_employee_id, target_employee_name,
      action_type, entity_type, entity_id, details, created_at
    ) VALUES (
      COALESCE(v_actor_id, NEW.reviewed_by), COALESCE(v_actor_name, 'Manager'), COALESCE(v_actor_role, 'manager'),
      NEW.user_id, v_target_name,
      CASE WHEN NEW.status = 'approved' THEN 'deadline_extension_approved' ELSE 'deadline_extension_rejected' END,
      'extension', NEW.id::text,
      jsonb_build_object('task_id', NEW.task_id, 'status', NEW.status, 'proposed_deadline', NEW.proposed_deadline, 'review_note', NEW.review_note), now()
    );
    IF NEW.status = 'approved' THEN
      UPDATE public.tasks SET due_date = NEW.proposed_deadline WHERE id = NEW.task_id;
      INSERT INTO public.activity_logs (
        actor_id, actor_name, actor_role, target_employee_id, target_employee_name,
        action_type, entity_type, entity_id, details, created_at
      ) VALUES (
        COALESCE(v_actor_id, NEW.reviewed_by), COALESCE(v_actor_name, 'Manager'), COALESCE(v_actor_role, 'manager'),
        NEW.user_id, v_target_name, 'deadline_changed', 'task', NEW.task_id::text,
        jsonb_build_object('new_deadline', NEW.proposed_deadline, 'extension_id', NEW.id), now()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_extensions_activity ON public.task_extension_requests;
CREATE TRIGGER trg_task_extensions_activity
  AFTER INSERT OR UPDATE ON public.task_extension_requests
  FOR EACH ROW EXECUTE FUNCTION public.trg_task_extensions_activity();

-- 4. Attendance correction requests trigger
CREATE OR REPLACE FUNCTION public.trg_attendance_corrections_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id uuid;
  v_actor_name text;
  v_actor_role text;
  v_target_name text;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NOT NULL THEN
    SELECT full_name, role INTO v_actor_name, v_actor_role FROM public.profiles WHERE id = v_actor_id;
  END IF;
  SELECT full_name INTO v_target_name FROM public.profiles WHERE id = NEW.user_id;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.activity_logs (
      actor_id, actor_name, actor_role, target_employee_id, target_employee_name,
      action_type, entity_type, entity_id, details, created_at
    ) VALUES (
      NEW.user_id, v_target_name, 'employee',
      NEW.user_id, v_target_name, 'attendance_correction_requested', 'attendance_correction', NEW.id::text,
      jsonb_build_object('attendance_id', NEW.attendance_record_id, 'reason', NEW.reason), now()
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.activity_logs (
      actor_id, actor_name, actor_role, target_employee_id, target_employee_name,
      action_type, entity_type, entity_id, details, created_at
    ) VALUES (
      COALESCE(v_actor_id, NEW.reviewed_by), COALESCE(v_actor_name, 'Manager'), COALESCE(v_actor_role, 'manager'),
      NEW.user_id, v_target_name,
      CASE WHEN NEW.status = 'approved' THEN 'attendance_correction_approved' ELSE 'attendance_correction_rejected' END,
      'attendance_correction', NEW.id::text,
      jsonb_build_object('attendance_id', NEW.attendance_record_id, 'status', NEW.status, 'review_note', NEW.review_note), now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attendance_corrections_activity ON public.attendance_correction_requests;
CREATE TRIGGER trg_attendance_corrections_activity
  AFTER INSERT OR UPDATE ON public.attendance_correction_requests
  FOR EACH ROW EXECUTE FUNCTION public.trg_attendance_corrections_activity();
