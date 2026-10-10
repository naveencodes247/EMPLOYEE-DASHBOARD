import React, { useState } from 'react';
import { Eye, EyeOff, Check, X, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { authService, validatePassword } from '../../services/auth';
import type { ResetPasswordFormData, AuthValidationErrors, BrandConfig } from '../../types/auth';

export type RecoveryTokenState = 'valid' | 'expired' | 'invalid';

interface ResetPasswordViewProps {
  brandConfig: BrandConfig;
  onNavigateToSignIn: () => void;
  onRequestNewLink: () => void;
  initialTokenState?: RecoveryTokenState;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  brandConfig,
  onNavigateToSignIn,
  onRequestNewLink,
  initialTokenState = 'valid',
}) => {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<AuthValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenState, setTokenState] = useState<RecoveryTokenState>(initialTokenState);

  const hasMinLength = formData.password.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasLower = /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const passwordsMatch = Boolean(
    formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
  );

  const handleInputChange = (field: keyof ResetPasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof AuthValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: AuthValidationErrors = {};

    const passwordErr = validatePassword(formData.password);
    if (passwordErr) newErrors.password = passwordErr;

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your new password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(formData);
      if (response.success) {
        setIsSuccess(true);
      } else {
        setErrors((prev) => ({ ...prev, general: response.error }));
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: 'An unexpected error occurred while resetting password.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Brand & Heading */}
      <div className="mb-6 text-center space-y-2">
        <div
          className={`w-14 h-14 mx-auto rounded-full overflow-hidden border flex items-center justify-center shadow-xs select-none mb-3 ${
            tokenState !== 'valid'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
              : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'
          }`}
          aria-hidden="true"
        >
          {tokenState !== 'valid' ? (
            <ShieldAlert className="w-6 h-6" />
          ) : brandConfig.logoUrl ? (
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
          {tokenState === 'expired'
            ? 'Password Reset Link Expired'
            : tokenState === 'invalid'
            ? 'Invalid Recovery Link'
            : 'Set new password'}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          {tokenState !== 'valid'
            ? 'This recovery link cannot be used'
            : `Create a new password for your ${brandConfig.companyName} account`}
        </p>
      </div>

      {tokenState !== 'valid' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--error-bg)] border border-[var(--error-border)] space-y-1.5 text-xs text-[var(--error-text)] animate-fadeIn">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              {tokenState === 'expired' ? 'Link Expired' : 'Link Invalid'}
            </p>
            <p className="leading-relaxed">
              {tokenState === 'expired'
                ? 'This password reset link has expired. For your security, recovery tokens are time-limited. Please request a new reset link.'
                : 'This password reset link is invalid or has already been used. Please request a fresh reset link.'}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full font-medium"
              onClick={onRequestNewLink}
            >
              Request New Reset Link
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="md"
              className="w-full text-xs text-[var(--text-secondary)]"
              onClick={onNavigateToSignIn}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Return to Sign In
            </Button>
          </div>
        </div>
      ) : isSuccess ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--success-bg)] border border-[var(--success-border)] text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto" />
            <h2 className="text-sm font-semibold text-green-950 dark:text-green-200">
              Password updated
            </h2>
            <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">
              Your password has been successfully updated. You can now use your new credentials to sign in.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full font-medium"
              onClick={onNavigateToSignIn}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Return to Sign In
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {errors.general && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[var(--error-bg)] border border-[var(--error-border)] text-xs text-[var(--error-text)]"
            >
              {errors.general}
            </div>
          )}

          {/* New Password */}
          <div>
            <Input
              id="reset-new-password"
              type={showPassword ? 'text' : 'password'}
              label="New Password"
              name="password"
              autoComplete="new-password"
              placeholder="Enter new password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              }
            />

            {/* Password checklist */}
            {formData.password && (
              <div className="mt-2 p-2.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-[11px]">
                <div className="grid grid-cols-2 gap-1.5 text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1.5">
                    {hasMinLength ? (
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )}
                    <span className={hasMinLength ? 'text-green-700 dark:text-green-400 font-medium' : ''}>
                      8+ characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasUpper && hasLower ? (
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )}
                    <span className={hasUpper && hasLower ? 'text-green-700 dark:text-green-400 font-medium' : ''}>
                      Upper & lower
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasNumber ? (
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )}
                    <span className={hasNumber ? 'text-green-700 dark:text-green-400 font-medium' : ''}>
                      Number included
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordsMatch ? (
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )}
                    <span className={passwordsMatch ? 'text-green-700 dark:text-green-400 font-medium' : ''}>
                      Passwords match
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <Input
            id="reset-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm New Password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat new password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPassword}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            }
          />

          <div className="pt-2 space-y-2.5">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full font-medium"
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
            >
              Update Password
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="md"
              className="w-full text-xs text-[var(--text-secondary)]"
              onClick={onNavigateToSignIn}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Return to Sign In
            </Button>
          </div>
        </form>
      )}

      {/* Preview Link States Bar at bottom of card */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        <span>Preview token states:</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTokenState('valid')}
            className={`cursor-pointer px-1.5 py-0.5 rounded text-[11px] transition-colors ${
              (tokenState as string) === 'valid'
                ? 'font-semibold text-[var(--accent-gold)] underline'
                : 'hover:text-[var(--text-primary)]'
            }`}
          >
            Valid
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setTokenState('expired')}
            className={`cursor-pointer px-1.5 py-0.5 rounded text-[11px] transition-colors ${
              (tokenState as string) === 'expired'
                ? 'font-semibold text-red-600 dark:text-red-400 underline'
                : 'hover:text-[var(--text-primary)]'
            }`}
          >
            Expired
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setTokenState('invalid')}
            className={`cursor-pointer px-1.5 py-0.5 rounded text-[11px] transition-colors ${
              (tokenState as string) === 'invalid'
                ? 'font-semibold text-red-600 dark:text-red-400 underline'
                : 'hover:text-[var(--text-primary)]'
            }`}
          >
            Invalid
          </button>
        </div>
      </div>
    </div>
  );
};
