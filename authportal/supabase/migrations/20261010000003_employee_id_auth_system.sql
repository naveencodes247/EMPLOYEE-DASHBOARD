-- ============================================================================
-- Migration: 20261010000003_employee_id_auth_system.sql
-- Description: Employee ID resolution RPC and Administrative Account Provisioning
-- ============================================================================

-- 1. Ensure unique constraint on system_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_system_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_system_id_key UNIQUE (system_id);
  END IF;
END $$;

-- 2. Function to resolve employee ID to account email for authentication
CREATE OR REPLACE FUNCTION public.resolve_employee_email(p_employee_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email text;
BEGIN
  IF p_employee_id IS NULL OR TRIM(p_employee_id) = '' THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email
  FROM public.profiles
  WHERE UPPER(TRIM(system_id)) = UPPER(TRIM(p_employee_id))
    AND account_status = 'active'
  LIMIT 1;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_employee_email(text) TO anon, authenticated, service_role;

-- 3. Administrator-controlled account provisioning function
CREATE OR REPLACE FUNCTION public.admin_provision_user(
  p_email text,
  p_password text,
  p_system_id text,
  p_full_name text,
  p_role public.user_role,
  p_job_title text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_enc_password text;
  v_org_id uuid;
  v_dept_id uuid;
BEGIN
  -- Hash password with bcrypt (cost factor 10)
  v_enc_password := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'worksphere-corp' LIMIT 1;
  SELECT id INTO v_dept_id FROM public.departments ORDER BY created_at LIMIT 1;

  -- Check if user exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(p_email) LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET 
      encrypted_password = v_enc_password,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now(),
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      email_change_token_current = '',
      phone_change_token = '',
      reauthentication_token = ''
    WHERE id = v_user_id;

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id, 'email', p_email),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    ) ON CONFLICT (provider, provider_id) DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      updated_at = now();

  ELSE
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      phone_change_token,
      reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      p_email,
      v_enc_password,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', p_role::text, 'full_name', p_full_name, 'job_title', p_job_title),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id, 'email', p_email),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  -- Upsert profile record with verified system_id and role
  INSERT INTO public.profiles (
    id,
    organization_id,
    email,
    full_name,
    role,
    account_status,
    system_id,
    job_title,
    department_id
  ) VALUES (
    v_user_id,
    v_org_id,
    p_email,
    p_full_name,
    p_role,
    'active',
    p_system_id,
    p_job_title,
    v_dept_id
  ) ON CONFLICT (id) DO UPDATE SET
    system_id = EXCLUDED.system_id,
    role = EXCLUDED.role,
    account_status = 'active',
    full_name = EXCLUDED.full_name,
    job_title = EXCLUDED.job_title,
    updated_at = now();

  RETURN v_user_id;
END;
$$;

-- Restrict provisioning function strictly to service_role and database administrators
REVOKE ALL ON FUNCTION public.admin_provision_user(text, text, text, text, public.user_role, text) FROM public, anon, authenticated;
