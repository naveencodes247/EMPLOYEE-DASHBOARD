import { supabase } from '../lib/supabase';
import type {
  SignInFormData,
  SignUpFormData,
  ResetPasswordFormData,
  IAuthService,
  SignInResult,
  SignUpResult,
  AccountStatusResult,
} from '../types/auth';

/**
 * Authentication Service & Validation Utilities
 * Fully integrated with Supabase Auth and PostgreSQL Row-Level Security.
 */

export const validateEmployeeId = (id: string): string | null => {
  if (!id || !id.trim()) {
    return 'Employee ID is required';
  }
  const clean = id.trim().toUpperCase();
  if (clean.length < 3) {
    return 'Please enter a valid Employee ID (e.g. EMP01, MAN01, ADM01)';
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email || !email.trim()) {
    return 'Work email address is required';
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid work email address (e.g. name@company.com)';
  }
  return null;
};

export const validateFullName = (name: string): string | null => {
  if (!name || !name.trim()) {
    return 'Full name is required';
  }
  if (name.trim().length < 2) {
    return 'Full name must be at least 2 characters';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasUpper || !hasLower || !hasNumber) {
    return 'Password must include uppercase, lowercase, and numeric characters';
  }
  return null;
};

export const validateDepartment = (department?: string): string | null => {
  if (!department || !department.trim()) {
    return 'Organizational department is required';
  }
  return null;
};

export const validateJobTitle = (title?: string): string | null => {
  if (!title || !title.trim()) {
    return 'Professional job title is required';
  }
  if (title.trim().length < 2) {
    return 'Job title must be at least 2 characters';
  }
  return null;
};

/**
 * Masks an email address for safe display on verification screens.
 * e.g. "alex.morgan@company.com" -> "a***n@company.com"
 */
export const maskEmail = (email: string): string => {
  if (!email) return '';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return email;
  const [localPart, domain] = parts;
  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  }
  const first = localPart[0];
  const last = localPart[localPart.length - 1];
  return `${first}***${last}@${domain}`;
};

export interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

export const FALLBACK_DEPARTMENTS: DepartmentOption[] = [
  { id: '10000000-0000-0000-0000-000000000001', name: 'Product Engineering', code: 'ENG' },
  { id: '10000000-0000-0000-0000-000000000002', name: 'UI/UX Design', code: 'DSN' },
  { id: '10000000-0000-0000-0000-000000000003', name: 'Operations & Logistics', code: 'OPS' },
  { id: '10000000-0000-0000-0000-000000000004', name: 'Marketing & Growth', code: 'MKT' },
  { id: '10000000-0000-0000-0000-000000000005', name: 'Security & Infrastructure', code: 'SEC' },
  { id: '10000000-0000-0000-0000-000000000006', name: 'Quality Assurance', code: 'QA' },
];

/**
 * Dynamically fetches company departments from the Supabase database.
 */
export const fetchAvailableDepartments = async (): Promise<DepartmentOption[]> => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code')
      .order('name');

    if (error || !data || data.length === 0) {
      return FALLBACK_DEPARTMENTS;
    }
    return data;
  } catch {
    return FALLBACK_DEPARTMENTS;
  }
};

export const authService: IAuthService = {
  async signIn(data: SignInFormData): Promise<SignInResult> {
    const rawId = (data.employeeId || data.email || '').trim().toUpperCase();
    const idErr = validateEmployeeId(rawId);
    if (idErr) return { success: false, error: idErr };

    const passwordErr = validatePassword(data.password);
    if (passwordErr) return { success: false, error: passwordErr };

    try {
      let sessionData: any = null;
      let authenticatedProfile: any = null;

      // 1. First attempt trusted server endpoint (/api/login)
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: rawId,
            password: data.password,
          }),
        });

        const resJson = await response.json();

        if (response.status === 429) {
          return {
            success: false,
            error: resJson.error || 'Too many login attempts. Please wait 15 minutes before trying again.',
          };
        }

        if (response.ok && resJson.success && resJson.session) {
          sessionData = resJson.session;
          authenticatedProfile = resJson.profile;

          // Hydrate client-side Supabase SDK with session tokens
          await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
          });
        } else if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            return {
              success: false,
              error: resJson.error || 'Invalid Employee ID or password.',
            };
          }
        }
      } catch {
        // Network or standalone dev fallback
      }

      // 2. Direct Supabase RPC fallback if server endpoint was bypassed
      if (!sessionData) {
        const { data: resolvedEmail, error: rpcError } = await (supabase.rpc as any)('resolve_employee_email', {
          p_employee_id: rawId,
        });

        if (rpcError || !resolvedEmail || typeof resolvedEmail !== 'string') {
          return {
            success: false,
            error: 'Invalid Employee ID or password.',
          };
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: resolvedEmail as string,
          password: data.password,
        });

        if (authError || !authData.user || !authData.session) {
          return {
            success: false,
            error: 'Invalid Employee ID or password.',
          };
        }

        sessionData = authData.session;
      }

      // 3. Confirm profile and active role from trusted backend
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || sessionData?.user?.id;

      if (!userId) {
        return { success: false, error: 'User session could not be established.' };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const finalProfile = profile || authenticatedProfile;

      if (profileError && !authenticatedProfile) {
        return {
          success: false,
          error: 'Your user profile could not be located in organizational records. Contact IT Support.',
        };
      }

      if (finalProfile.account_status !== 'active') {
        await supabase.auth.signOut();
        return {
          success: false,
          status: finalProfile.account_status,
          error: `Account is inactive (${finalProfile.account_status}). Please contact IT Support.`,
        };
      }

      return {
        success: true,
        role: finalProfile.role,
        status: 'active',
        profile: finalProfile,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unable to connect to authentication server. Please check your network connection.',
      };
    }
  },

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to sign out.' };
    }
  },

  async getCurrentUser(): Promise<{ user: any; profile: any; role?: 'employee' | 'manager' | 'admin' } | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) return null;

      const user = sessionData.session.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) return null;
      return {
        user,
        profile,
        role: profile.role,
      };
    } catch {
      return null;
    }
  },

  async signUp(data: SignUpFormData): Promise<SignUpResult> {
    // 1. Strict Admin Registration Prevention (Defense-in-depth)
    if ((data.requestedRole as any) === 'admin') {
      return {
        success: false,
        error:
          'Administrative accounts cannot be self-registered. Initial Admin provisioning is governed by controlled database administration procedures. Please contact infrastructure security.',
      };
    }

    // 2. Frontend & Client-side Validation
    const nameErr = validateFullName(data.fullName);
    if (nameErr) return { success: false, error: nameErr };

    const emailErr = validateEmail(data.email);
    if (emailErr) return { success: false, error: emailErr };

    const passwordErr = validatePassword(data.password);
    if (passwordErr) return { success: false, error: passwordErr };

    if (data.password !== data.confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }

    const titleErr = validateJobTitle(data.jobTitle);
    if (titleErr) return { success: false, error: titleErr };

    // 3. Security Sanitize: Role must strictly be 'employee' or 'manager'
    const sanitizedRole: 'employee' | 'manager' =
      data.requestedRole === 'manager' ? 'manager' : 'employee';

    const redirectUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:3000/';

    try {
      // 4. Call Supabase Auth API
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            role: sanitizedRole,
            job_title: data.jobTitle?.trim(),
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        if (
          authError.message.toLowerCase().includes('already registered') ||
          authError.message.toLowerCase().includes('already exists') ||
          authError.status === 422
        ) {
          return {
            success: false,
            error: 'An account with this email address already exists. Please sign in or reset your password.',
          };
        }

        if (authError.status === 429 || authError.message.toLowerCase().includes('rate limit')) {
          return {
            success: false,
            error: 'Too many registration requests. Please wait a few minutes before trying again.',
          };
        }

        return {
          success: false,
          error: authError.message,
        };
      }

      if (
        authData.user &&
        Array.isArray(authData.user.identities) &&
        authData.user.identities.length === 0
      ) {
        return {
          success: false,
          error: 'An account with this email address already exists. Please sign in or reset your password.',
        };
      }

      const isEmailConfirmed = Boolean(authData.user?.email_confirmed_at);

      return {
        success: true,
        emailConfirmed: isEmailConfirmed,
        userId: authData.user?.id,
        userRole: sanitizedRole,
        accountStatus: isEmailConfirmed ? 'pending_approval' : 'pending_verification',
      };
    } catch (err: any) {
      return {
        success: false,
        error:
          err?.message ||
          'A network error occurred while communicating with the authentication service. Please check your connection and try again.',
      };
    }
  },

  async requestPasswordReset(identifier: string): Promise<{ success: boolean; error?: string }> {
    const raw = (identifier || '').trim();
    if (!raw) {
      return { success: false, error: 'Please enter your Employee ID or registered work email.' };
    }

    let targetEmail = raw;
    if (!raw.includes('@')) {
      // Resolve employee ID (EMP1-EMP10, MAN01, ADM01) to registered email via Postgres RPC
      try {
        const { data: resolved, error: rpcErr } = await (supabase.rpc as any)('resolve_employee_email', {
          p_employee_id: raw.toUpperCase(),
        });
        if (rpcErr || !resolved || typeof resolved !== 'string') {
          return { success: false, error: `Employee ID "${raw}" not recognized in organizational directory.` };
        }
        targetEmail = resolved;
      } catch (err: any) {
        return { success: false, error: 'Failed to resolve employee account.' };
      }
    } else {
      const emailErr = validateEmail(raw);
      if (emailErr) return { success: false, error: emailErr };
    }

    try {
      const redirectUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/reset` : 'http://localhost:3000/reset';
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Unable to request password reset.' };
    }
  },

  async resetPassword(data: ResetPasswordFormData): Promise<{ success: boolean; error?: string }> {
    const passwordErr = validatePassword(data.password);
    if (passwordErr) return { success: false, error: passwordErr };

    if (data.password !== data.confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update password.' };
    }
  },

  async resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    const emailErr = validateEmail(email);
    if (emailErr) return { success: false, error: emailErr };

    try {
      const redirectUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:3000/';
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
          return {
            success: false,
            error: 'Verification email rate limit exceeded. Please wait a few moments before requesting another link.',
          };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Network error while attempting to resend verification email.',
      };
    }
  },

  async checkAccountStatus(emailOrUserId?: string): Promise<AccountStatusResult> {
    try {
      // 1. Inspect current Supabase auth session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;

      if (!currentUser) {
        // If unauthenticated, cannot inspect private profile due to RLS
        return { status: 'unknown' };
      }

      const uid = currentUser.id;

      // 2. Fetch profile from database
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, account_status, system_id, department_id, departments!profiles_department_id_fkey(name)')
        .eq('id', uid)
        .maybeSingle();

      if (profileErr || !profile) {
        // Check if approval request is in queue
        const { data: approval } = await supabase
          .from('account_approvals')
          .select('status, decision_reason, requested_role')
          .eq('applicant_id', uid)
          .maybeSingle();

        if (approval) {
          return {
            status: approval.status === 'approved' ? 'active' : 'pending_approval',
            role: approval.requested_role,
            rejectionReason: approval.decision_reason || undefined,
            emailVerified: Boolean(currentUser.email_confirmed_at),
          };
        }

        return {
          status: currentUser.email_confirmed_at ? 'pending_approval' : 'pending_verification',
          emailVerified: Boolean(currentUser.email_confirmed_at),
        };
      }

      // Check for approval record rejection note if rejected
      let rejectionReason: string | undefined;
      if (profile.account_status === 'rejected') {
        const { data: approval } = await supabase
          .from('account_approvals')
          .select('decision_reason')
          .eq('applicant_id', uid)
          .eq('status', 'rejected')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        rejectionReason = approval?.decision_reason || 'Application rejected by reviewing administrator/manager.';
      }

      const deptName = (profile.departments as any)?.name;

      return {
        status: profile.account_status,
        role: profile.role,
        systemId: profile.system_id || undefined,
        department: deptName,
        rejectionReason,
        emailVerified: Boolean(currentUser.email_confirmed_at),
      };
    } catch {
      return { status: 'unknown' };
    }
  },

  async signInWithGoogle(params?: {
    requestedRole?: 'employee' | 'manager';
    jobTitle?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const redirectTo = `${window.location.origin}`;
      const role = params?.requestedRole || 'employee';
      const jobTitle = params?.jobTitle || (role === 'manager' ? 'Engineering Manager' : 'Associate');

      if (typeof window !== 'undefined') {
        localStorage.setItem('pending_oauth_role', role);
        localStorage.setItem('pending_oauth_job_title', jobTitle);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to initiate Google authentication. Please check Google OAuth settings in Supabase.',
      };
    }
  },
};
