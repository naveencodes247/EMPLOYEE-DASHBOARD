import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { authService, validateEmail } from '../../services/auth';
import type { BrandConfig } from '../../types/auth';

interface ForgotPasswordViewProps {
  brandConfig: BrandConfig;
  onNavigateToSignIn: () => void;
  onNavigateToResetPassword?: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  brandConfig,
  onNavigateToSignIn,
  onNavigateToResetPassword,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your Employee ID (e.g. EMP1, EMP01, MAN01, ADM01) or work email.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await authService.requestPasswordReset(email.trim());
      if (res && res.success === false) {
        setError(res.error || 'Failed to dispatch password recovery.');
      } else {
        setIsSubmitted(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Brand & Heading */}
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
          Reset password
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          {isSubmitted
            ? 'Recovery instructions dispatched'
            : 'Enter your Employee ID (e.g. EMP1, EMP01, MAN01, ADM01) or work email'}
        </p>
      </div>

      {isSubmitted ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Check your inbox
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              If an account exists for this identifier, a password reset link has been dispatched to the registered work email.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full font-medium"
              onClick={onNavigateToSignIn}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Sign In
            </Button>

            {onNavigateToResetPassword && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full text-xs"
                onClick={onNavigateToResetPassword}
              >
                Preview Reset Password Screen
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[var(--error-bg)] border border-[var(--error-border)] flex items-start gap-2 text-xs text-[var(--error-text)] animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <Input
            id="forgot-email"
            type="text"
            label="Employee ID or Work Email"
            name="email"
            placeholder="e.g. EMP01, EMP1, MAN01, ADM01, or name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            error={error || undefined}
            required
            rightElement={<Mail className="w-4 h-4 text-[var(--text-muted)] mr-2 pointer-events-none" />}
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
              Send reset link
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="md"
              className="w-full text-xs text-[var(--text-secondary)]"
              onClick={onNavigateToSignIn}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Sign In
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
