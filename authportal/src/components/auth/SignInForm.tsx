import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertTriangle, ArrowRight, ShieldCheck, Lock, Clock } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { validateEmployeeId, validatePassword, authService } from '../../services/auth';
import type { SignInFormData, AuthValidationErrors, BrandConfig } from '../../types/auth';

interface SignInFormProps {
  brandConfig: BrandConfig;
  onNavigateToForgotPassword?: () => void;
  onSignInSuccess?: (role: 'employee' | 'manager' | 'admin', profile?: any) => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  brandConfig,
  onSignInSuccess,
}) => {
  const [formData, setFormData] = useState<SignInFormData>({
    employeeId: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<AuthValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);

  // Handle client-side lockout countdown timer
  useEffect(() => {
    if (lockoutTimer === null || lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleInputChange = (field: keyof SignInFormData, value: any) => {
    // Auto-uppercase Employee ID for ease of input
    const formattedValue = field === 'employeeId' ? String(value).toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    if (errors[field as keyof AuthValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLock(e.getModifierState('CapsLock'));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: AuthValidationErrors = {};
    const idErr = validateEmployeeId(formData.employeeId);
    if (idErr) newErrors.employeeId = idErr;

    const passwordErr = validatePassword(formData.password);
    if (passwordErr) newErrors.password = passwordErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutTimer !== null && lockoutTimer > 0) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.signIn(formData);

      if (!result.success) {
        if (result.error?.toLowerCase().includes('wait') || result.error?.toLowerCase().includes('too many')) {
          setLockoutTimer(60); // 60 seconds UI cooldown
        }

        setErrors((prev) => ({
          ...prev,
          general: result.error || 'Authentication failed. Please verify your Employee ID and password.',
        }));
        return;
      }

      if (onSignInSuccess && result.role) {
        onSignInSuccess(result.role, result.profile);
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: 'Unable to communicate with authentication service.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top Brand & Screen Heading */}
      <div className="mb-6 text-center space-y-2">
        <div
          className="w-14 h-14 mx-auto rounded-full overflow-hidden border border-[var(--border-subtle)] flex items-center justify-center shadow-xs select-none mb-3 bg-[var(--bg-card)]"
          aria-hidden="true"
        >
          {brandConfig.logoUrl ? (
            <img
              src={brandConfig.logoUrl}
              alt={brandConfig.companyName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold tracking-wider text-[#C5A059] dark:text-[#D4AF37]">
              {brandConfig.companyName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          WorkSphere Portal
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          Sign in using your assigned Employee ID and password
        </p>
      </div>

      {/* General Alert / Rate Limit Lockout Banner */}
      {errors.general && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-[var(--error-bg)] border border-[var(--error-border)] flex items-start gap-2.5 text-xs text-[var(--error-text)] animate-fadeIn"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-semibold">Sign In Notice</p>
            <p className="mt-0.5">{errors.general}</p>
          </div>
        </div>
      )}

      {lockoutTimer !== null && lockoutTimer > 0 && (
        <div
          role="status"
          className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 animate-fadeIn"
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Security rate-limiting active. Please wait <strong>{lockoutTimer}s</strong> before retrying.</span>
        </div>
      )}

      {/* Shared Login Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* 1. Employee ID Input */}
        <div>
          <Input
            id="signin-employee-id"
            type="text"
            label="Employee ID"
            name="employeeId"
            autoComplete="username"
            placeholder="e.g. EMP01, MAN01, ADM01"
            value={formData.employeeId}
            onChange={(e) => handleInputChange('employeeId', e.target.value)}
            error={errors.employeeId}
            disabled={isLoading || (lockoutTimer !== null && lockoutTimer > 0)}
            required
            helperText="Assigned by corporate IT (EMP01–EMP10, MAN01, or ADM01)"
          />
        </div>

        {/* 2. Password Input with Show/Hide Toggle */}
        <div>
          <Input
            id="signin-password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your account password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            onKeyDown={handlePasswordKeyDown}
            onKeyUp={handlePasswordKeyDown}
            error={errors.password}
            disabled={isLoading || (lockoutTimer !== null && lockoutTimer > 0)}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isLoading}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            }
          />

          {isCapsLock && (
            <div
              role="status"
              className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 mt-1.5 px-1 font-medium"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Caps Lock is ON</span>
            </div>
          )}
        </div>

        {/* Remember me & Security Badge */}
        <div className="flex items-center justify-between gap-2.5 pt-1">
          <Checkbox
            id="signin-remember"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
            label="Remember ID on this device"
            disabled={isLoading}
          />

          <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] font-medium">
            <Lock className="w-3 h-3 text-[#C5A059]" />
            <span>Encrypted Session</span>
          </div>
        </div>

        {/* Primary Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full font-medium cursor-pointer"
            isLoading={isLoading}
            disabled={isLoading || (lockoutTimer !== null && lockoutTimer > 0)}
            rightIcon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
          >
            {isLoading ? 'Verifying Credentials...' : 'Sign In'}
          </Button>
        </div>
      </form>

      {/* Corporate Access Notice */}
      <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Restricted Organizational System</span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          Authorized personnel only. Contact the System Administrator (ADM01) for credential inquiries.
        </p>
      </div>
    </div>
  );
};
