-- Migration: 20261009000001_initial_database_foundation.sql
-- Description: Unit 5A Database Foundation for Employee Work Management Portal (WorkSphere)
-- Implements multi-tier role hierarchy (Employee, Manager, Admin) with Row Level Security,
-- approval workflows, account lifecycle management, private app_security schema, and immutable audit logging.

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'employee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM (
    'pending_verification',
    'pending_approval',
    'active',
    'suspended',
    'deactivated',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.audit_severity AS ENUM ('info', 'warning', 'security');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  domain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  manager_id uuid, -- Reference added after profiles table
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_departments_code UNIQUE (code)
);

-- 4. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  system_id text UNIQUE,
  role public.user_role NOT NULL DEFAULT 'employee',
  account_status public.account_status NOT NULL DEFAULT 'pending_verification',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  job_title text,
  avatar_url text,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add foreign key constraint from departments.manager_id to profiles(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_departments_manager'
  ) THEN
    ALTER TABLE public.departments
      ADD CONSTRAINT fk_departments_manager
      FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Organization Membership Table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'employee',
  status public.account_status NOT NULL DEFAULT 'pending_verification',
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_org_members_user_org UNIQUE (organization_id, user_id)
);

-- 6. Account Approvals Table
CREATE TABLE IF NOT EXISTS public.account_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_role public.user_role NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  status public.approval_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  decision_reason text,
  assigned_system_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_no_self_approval CHECK (reviewed_by IS NULL OR reviewed_by <> applicant_id)
);

-- 7. Audit Events Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  performed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  severity public.audit_severity NOT NULL DEFAULT 'info',
  ip_address text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Performance & Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON public.profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON public.departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON public.departments(manager_id);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_account_approvals_applicant ON public.account_approvals(applicant_id);
CREATE INDEX IF NOT EXISTS idx_account_approvals_reviewer ON public.account_approvals(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_account_approvals_status ON public.account_approvals(status);
CREATE INDEX IF NOT EXISTS idx_account_approvals_dept ON public.account_approvals(department_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON public.audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 9. Private Security Schema & Helper Functions
CREATE SCHEMA IF NOT EXISTS app_security;
REVOKE ALL ON SCHEMA app_security FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA app_security TO authenticated;

CREATE OR REPLACE FUNCTION app_security.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION app_security.current_account_status()
RETURNS public.account_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT account_status FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION app_security.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'::public.user_role
      AND account_status = 'active'::public.account_status
  );
$$;

CREATE OR REPLACE FUNCTION app_security.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'manager'::public.user_role
      AND account_status = 'active'::public.account_status
  );
$$;

CREATE OR REPLACE FUNCTION app_security.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND account_status = 'active'::public.account_status
  );
$$;

CREATE OR REPLACE FUNCTION app_security.get_manager_department_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT department_id FROM public.profiles
  WHERE id = (SELECT auth.uid())
    AND role = 'manager'::public.user_role
    AND account_status = 'active'::public.account_status;
$$;

REVOKE ALL ON FUNCTION app_security.current_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_security.current_account_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_security.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_security.is_manager() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_security.is_active_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_security.get_manager_department_id() FROM PUBLIC, anon;

-- Public compatibility wrappers (marked SECURITY INVOKER to prevent public RPC escalation)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.current_account_status()
RETURNS public.account_status
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT account_status FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'::public.user_role
      AND account_status = 'active'::public.account_status
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'manager'::public.user_role
      AND account_status = 'active'::public.account_status
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND account_status = 'active'::public.account_status
  );
$$;

CREATE OR REPLACE FUNCTION public.get_manager_department_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT department_id FROM public.profiles
  WHERE id = (SELECT auth.uid())
    AND role = 'manager'::public.user_role
    AND account_status = 'active'::public.account_status;
$$;

-- 10. Audit Log Immutability Trigger
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be updated or deleted.';
END;
$$;

CREATE OR REPLACE TRIGGER trg_prevent_audit_log_modification
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

REVOKE ALL ON FUNCTION public.prevent_audit_log_modification() FROM PUBLIC, anon, authenticated;

-- 11. Profile Security Trigger: Prevent untrusted role/status tampering
CREATE OR REPLACE FUNCTION public.enforce_profile_update_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_is_admin boolean;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;

  v_caller_is_admin := app_security.is_admin();

  IF NOT v_caller_is_admin THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      RAISE EXCEPTION 'Security violation: User role cannot be modified by non-administrators.';
    END IF;

    IF OLD.account_status IS DISTINCT FROM NEW.account_status THEN
      RAISE EXCEPTION 'Security violation: Account status cannot be modified directly. Must go through the approval workflow.';
    END IF;

    IF OLD.system_id IS DISTINCT FROM NEW.system_id THEN
      RAISE EXCEPTION 'Security violation: System ID cannot be changed.';
    END IF;

    IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'Security violation: Organization membership cannot be modified directly.';
    END IF;

    IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
      RAISE EXCEPTION 'Security violation: Department assignment cannot be changed directly.';
    END IF;

    IF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
      RAISE EXCEPTION 'Security violation: Manager assignment cannot be changed directly.';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_enforce_profile_update_security
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_update_security();

REVOKE ALL ON FUNCTION public.enforce_profile_update_security() FROM PUBLIC, anon, authenticated;

-- 12. Trigger on auth.users for Automatic Profile & Approval Creation
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_requested_role public.user_role;
  v_department_id uuid;
  v_full_name text;
  v_status public.account_status;
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'manager' THEN
    v_requested_role := 'manager'::public.user_role;
  ELSE
    v_requested_role := 'employee'::public.user_role;
  END IF;

  IF NEW.email_confirmed_at IS NOT NULL THEN
    v_status := 'pending_approval'::public.account_status;
  ELSE
    v_status := 'pending_verification'::public.account_status;
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName',
    split_part(NEW.email, '@', 1)
  );

  IF NEW.raw_user_meta_data->>'department_id' IS NOT NULL THEN
    BEGIN
      v_department_id := (NEW.raw_user_meta_data->>'department_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_department_id := NULL;
    END;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    account_status,
    department_id
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_requested_role,
    v_status,
    v_department_id
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.account_approvals (
    applicant_id,
    requested_role,
    department_id,
    status
  ) VALUES (
    NEW.id,
    v_requested_role,
    v_department_id,
    'pending'::public.approval_status
  );

  INSERT INTO public.audit_logs (
    action,
    performed_by,
    target_user_id,
    severity,
    details
  ) VALUES (
    'USER_REGISTRATION_SUBMITTED',
    NEW.id,
    NEW.id,
    'info'::public.audit_severity,
    jsonb_build_object(
      'email', NEW.email,
      'requested_role', v_requested_role,
      'status', v_status
    )
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_handle_new_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_auth_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.profiles
    SET account_status = 'pending_approval'::public.account_status,
        updated_at = now()
    WHERE id = NEW.id
      AND account_status = 'pending_verification'::public.account_status;

    INSERT INTO public.audit_logs (
      action,
      performed_by,
      target_user_id,
      severity,
      details
    ) VALUES (
      'EMAIL_VERIFIED',
      NEW.id,
      NEW.id,
      'info'::public.audit_severity,
      jsonb_build_object('email', NEW.email)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_handle_auth_user_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_email_confirmed();

REVOKE ALL ON FUNCTION public.handle_auth_user_email_confirmed() FROM PUBLIC, anon, authenticated;

-- 13. Approval Workflow Trigger: enforce approval authority & auto-activate account
CREATE OR REPLACE FUNCTION public.process_account_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reviewer_id uuid;
  v_is_admin boolean;
  v_is_mgr boolean;
  v_mgr_dept uuid;
  v_applicant_email text;
  v_email_confirmed boolean;
  v_generated_system_id text;
BEGIN
  v_reviewer_id := (SELECT auth.uid());

  IF v_reviewer_id IS NOT NULL THEN
    IF v_reviewer_id = OLD.applicant_id THEN
      RAISE EXCEPTION 'Security violation: Self-approval is strictly forbidden.';
    END IF;

    v_is_admin := app_security.is_admin();
    v_is_mgr := app_security.is_manager();
    v_mgr_dept := app_security.get_manager_department_id();

    IF OLD.requested_role = 'manager'::public.user_role THEN
      IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Security violation: Manager accounts can only be approved or rejected by an Administrator.';
      END IF;
    ELSIF OLD.requested_role = 'employee'::public.user_role THEN
      IF NOT v_is_admin AND NOT (v_is_mgr AND OLD.department_id IS NOT DISTINCT FROM v_mgr_dept) THEN
        RAISE EXCEPTION 'Security violation: Employee approvals require an Administrator or the designated Department Manager.';
      END IF;
    END IF;

    NEW.reviewed_by := v_reviewer_id;
  END IF;

  NEW.reviewed_at := COALESCE(NEW.reviewed_at, now());
  NEW.updated_at := now();

  IF NEW.status = 'approved'::public.approval_status AND OLD.status = 'pending'::public.approval_status THEN
    SELECT email_confirmed_at IS NOT NULL, email INTO v_email_confirmed, v_applicant_email
    FROM auth.users
    WHERE id = OLD.applicant_id;

    IF NOT COALESCE(v_email_confirmed, false) THEN
      RAISE EXCEPTION 'Action blocked: User email must be verified before the account can be approved.';
    END IF;

    IF NEW.assigned_system_id IS NULL THEN
      IF NEW.requested_role = 'manager'::public.user_role THEN
        v_generated_system_id := 'MGR-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0');
      ELSE
        v_generated_system_id := 'EMP-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0');
      END IF;
      NEW.assigned_system_id := v_generated_system_id;
    END IF;

    UPDATE public.profiles
    SET role = NEW.requested_role,
        account_status = 'active'::public.account_status,
        system_id = COALESCE(profiles.system_id, NEW.assigned_system_id),
        department_id = COALESCE(NEW.department_id, profiles.department_id),
        manager_id = CASE
          WHEN NEW.requested_role = 'employee'::public.user_role AND v_is_mgr THEN v_reviewer_id
          ELSE profiles.manager_id
        END,
        updated_at = now()
    WHERE id = OLD.applicant_id;

    INSERT INTO public.audit_logs (
      action,
      performed_by,
      target_user_id,
      severity,
      details
    ) VALUES (
      'ACCOUNT_APPROVED',
      NEW.reviewed_by,
      OLD.applicant_id,
      'security'::public.audit_severity,
      jsonb_build_object(
        'role', NEW.requested_role,
        'system_id', NEW.assigned_system_id,
        'department_id', NEW.department_id,
        'decision_reason', NEW.decision_reason
      )
    );

  ELSIF NEW.status = 'rejected'::public.approval_status AND OLD.status = 'pending'::public.approval_status THEN
    UPDATE public.profiles
    SET account_status = 'rejected'::public.account_status,
        updated_at = now()
    WHERE id = OLD.applicant_id;

    INSERT INTO public.audit_logs (
      action,
      performed_by,
      target_user_id,
      severity,
      details
    ) VALUES (
      'ACCOUNT_REJECTED',
      NEW.reviewed_by,
      OLD.applicant_id,
      'warning'::public.audit_severity,
      jsonb_build_object(
        'rejection_reason', NEW.decision_reason
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_process_account_approval
BEFORE UPDATE ON public.account_approvals
FOR EACH ROW EXECUTE FUNCTION public.process_account_approval();

REVOKE ALL ON FUNCTION public.process_account_approval() FROM PUBLIC, anon, authenticated;

-- 14. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 15. RLS Policies

-- organizations policies
CREATE POLICY "Active users can view organizations"
  ON public.organizations FOR SELECT
  USING ((SELECT app_security.is_active_user()));

CREATE POLICY "Admins can manage organizations"
  ON public.organizations FOR ALL
  USING ((SELECT app_security.is_admin()))
  WITH CHECK ((SELECT app_security.is_admin()));

-- departments policies
CREATE POLICY "Authenticated users can view departments"
  ON public.departments FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  USING ((SELECT app_security.is_admin()))
  WITH CHECK ((SELECT app_security.is_admin()));

-- profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Admins have full view of all profiles"
  ON public.profiles FOR SELECT
  USING ((SELECT app_security.is_admin()));

CREATE POLICY "Managers can view team profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT app_security.is_manager()) AND (
      department_id = (SELECT app_security.get_manager_department_id())
      OR manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Active employees can view department directory"
  ON public.profiles FOR SELECT
  USING (
    (SELECT app_security.is_active_user()) AND
    department_id = (SELECT department_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING ((SELECT app_security.is_admin()))
  WITH CHECK ((SELECT app_security.is_admin()));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK ((SELECT app_security.is_admin()) OR id = (SELECT auth.uid()));

-- organization_members policies
CREATE POLICY "Members can view own membership"
  ON public.organization_members FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view and manage all memberships"
  ON public.organization_members FOR ALL
  USING ((SELECT app_security.is_admin()))
  WITH CHECK ((SELECT app_security.is_admin()));

-- account_approvals policies
CREATE POLICY "Applicants can view own approval requests"
  ON public.account_approvals FOR SELECT
  USING (applicant_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all approval requests"
  ON public.account_approvals FOR SELECT
  USING ((SELECT app_security.is_admin()));

CREATE POLICY "Managers can view employee requests in their department"
  ON public.account_approvals FOR SELECT
  USING (
    (SELECT app_security.is_manager()) AND
    requested_role = 'employee'::public.user_role AND
    department_id = (SELECT app_security.get_manager_department_id())
  );

CREATE POLICY "Applicants can submit initial approval request"
  ON public.account_approvals FOR INSERT
  WITH CHECK (
    applicant_id = (SELECT auth.uid()) AND
    status = 'pending'::public.approval_status
  );

CREATE POLICY "Admins can update approval requests"
  ON public.account_approvals FOR UPDATE
  USING ((SELECT app_security.is_admin()))
  WITH CHECK ((SELECT app_security.is_admin()));

CREATE POLICY "Managers can update employee requests in their department"
  ON public.account_approvals FOR UPDATE
  USING (
    (SELECT app_security.is_manager()) AND
    requested_role = 'employee'::public.user_role AND
    department_id = (SELECT app_security.get_manager_department_id())
  )
  WITH CHECK (
    (SELECT app_security.is_manager()) AND
    requested_role = 'employee'::public.user_role AND
    department_id = (SELECT app_security.get_manager_department_id())
  );

-- audit_logs policies
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING ((SELECT app_security.is_admin()));

CREATE POLICY "Managers can view department audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    (SELECT app_security.is_manager()) AND (
      performed_by = (SELECT auth.uid()) OR
      target_user_id IN (
        SELECT id FROM public.profiles WHERE department_id = (SELECT app_security.get_manager_department_id())
      )
    )
  );

CREATE POLICY "Users can view audit events targeting their account"
  ON public.audit_logs FOR SELECT
  USING (target_user_id = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (performed_by = (SELECT auth.uid()) OR performed_by IS NULL)
  );
