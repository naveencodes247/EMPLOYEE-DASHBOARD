/**
 * Type definitions for the Employee Work Management Portal Authentication Interface.
 * Designed for clean future integration with Supabase Auth via Google Antigravity.
 */

export type ThemeMode = 'light' | 'dark';

export type AuthScreen =
  | 'signIn'
  | 'signUp'
  | 'verifyEmail'
  | 'forgotPassword'
  | 'resetPassword'
  | 'expiredVerification';

export interface SignInFormData {
  employeeId: string;
  password: string;
  rememberMe: boolean;
  email?: string;
}

export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  requestedRole?: 'employee' | 'manager';
  department?: string;
  departmentId?: string;
  jobTitle?: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface AuthValidationErrors {
  employeeId?: string;
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  department?: string;
  jobTitle?: string;
  general?: string;
}

export interface BrandConfig {
  companyName: string;
  portalSubtitle: string;
  supportEmail: string;
  logoUrl?: string;
}

export interface SignUpResult {
  success: boolean;
  error?: string;
  emailConfirmed?: boolean;
  userId?: string;
  userRole?: 'employee' | 'manager';
  accountStatus?: 'pending_verification' | 'pending_approval' | 'active';
}

export interface AccountStatusResult {
  status:
    | 'pending_verification'
    | 'pending_approval'
    | 'active'
    | 'suspended'
    | 'deactivated'
    | 'rejected'
    | 'unknown';
  role?: 'employee' | 'manager' | 'admin';
  rejectionReason?: string;
  systemId?: string;
  department?: string;
  emailVerified?: boolean;
}

export interface SignInResult {
  success: boolean;
  error?: string;
  role?: 'employee' | 'manager' | 'admin';
  status?: 'active' | 'pending_verification' | 'pending_approval' | 'rejected' | 'suspended';
  profile?: any;
}

export interface IAuthService {
  signIn(data: SignInFormData): Promise<SignInResult>;
  signUp(data: SignUpFormData): Promise<SignUpResult>;
  signOut(): Promise<{ success: boolean; error?: string }>;
  getCurrentUser(): Promise<{ user: any; profile: any; role?: 'employee' | 'manager' | 'admin' } | null>;
  requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }>;
  resetPassword(data: ResetPasswordFormData, token?: string): Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }>;
  checkAccountStatus(emailOrUserId?: string): Promise<AccountStatusResult>;
  signInWithGoogle(params?: {
    requestedRole?: 'employee' | 'manager';
    jobTitle?: string;
  }): Promise<{ success: boolean; error?: string }>;
}
