import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { authService, maskEmail } from '../../services/auth';
import type { BrandConfig } from '../../types/auth';

interface EmailVerificationViewProps {
  email: string;
  brandConfig: BrandConfig;
  onNavigateToSignIn: () => void;
  onChangeEmail: () => void;
  onEmailVerified?: () => void;
}

export const EmailVerificationView: React.FC<EmailVerificationViewProps> = ({
  email,
  brandConfig,
  onNavigateToSignIn,
  onChangeEmail,
  onEmailVerified,
}) => {
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setResendStatus(null);

    try {
      const response = await authService.resendVerificationEmail(email);
      if (response.success) {
        setCooldown(60);
        setResendStatus({
          type: 'success',
          message: 'A fresh confirmation link has been sent to your email address.',
        });
      } else {
        setResendStatus({
          type: 'error',
          message: response.error || 'Unable to resend confirmation email at this time.',
        });
      }
    } catch {
      setResendStatus({
        type: 'error',
        message: 'Network communication error. Please check your connection.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const masked = maskEmail(email);

  return (
    <div className="w-full text-center">
      {/* Official outFyt Logo */}
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

      {/* Company Name & Welcome Message */}
      <div className="space-y-1 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {brandConfig.companyName}
        </h1>
        <p className="text-sm font-semibold text-[#C5A059] dark:text-[#D4AF37]">
          Welcome to {brandConfig.companyName}
        </p>
        <p className="text-xs text-[var(--text-secondary)] pt-1">
          Please confirm your email address to activate your account.
        </p>
      </div>

      {/* Masked Email Badge */}
      <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-center space-y-2 mb-5">
        <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Confirmation link sent to:</span>
        </div>
        {masked && (
          <p className="font-mono text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] py-1.5 px-3 rounded-lg border border-[var(--border-subtle)] inline-block">
            {masked}
          </p>
        )}
      </div>

      {/* Status Feedback */}
      {resendStatus && (
        <div
          role="status"
          className={`p-3 rounded-xl text-xs flex items-center justify-center gap-2 mb-4 animate-fadeIn ${
            resendStatus.type === 'success'
              ? 'bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success-text)]'
              : 'bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)]'
          }`}
        >
          {resendStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          )}
          <span>{resendStatus.message}</span>
        </div>
      )}

      {/* Clean Actions */}
      <div className="space-y-2.5">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="w-full font-medium"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          isLoading={isResending}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />}
        >
          {cooldown > 0 ? `Resend Email (${cooldown}s)` : 'Resend Email'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="md"
          className="w-full text-xs"
          onClick={onChangeEmail}
        >
          Use Different Email
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
  );
};
