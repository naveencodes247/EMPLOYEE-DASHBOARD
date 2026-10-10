import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface ChangePasswordSectionProps {
  userEmail: string;
  employeeId?: string;
  roleName?: string;
}

export const ChangePasswordSection: React.FC<ChangePasswordSectionProps> = ({
  userEmail,
  employeeId,
  roleName = 'Personnel',
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validation checks
    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters in length.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage('New password must be different from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // 2. Cryptographically verify current password against Supabase Auth
      const { data: verifyData, error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (verifyError || !verifyData.session) {
        setErrorMessage('Current password verification failed. Please verify your existing password.');
        setIsLoading(false);
        return;
      }

      // 3. Securely update password using authenticated Supabase session
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setErrorMessage(updateError.message || 'Unable to update password.');
        setIsLoading(false);
        return;
      }

      // 4. Clear sensitive state immediately on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password successfully updated. Your permanent Employee ID remains unchanged.');
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch {
      setErrorMessage('An unexpected error occurred communicating with authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#C5A059]" />
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Change Account Password
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Securely update your credentials while keeping Employee ID ({employeeId || 'Assigned ID'}) unchanged.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" />
          <span>Supabase Auth Backend</span>
        </div>
      </div>

      {successMessage && (
        <div
          role="status"
          className="p-3.5 rounded-2xl bg-[var(--success-bg)] border border-[var(--success-border)] flex items-center gap-2 text-xs text-[var(--success-text)] animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-[var(--error-bg)] border border-[var(--error-border)] flex items-center gap-2 text-xs text-[var(--error-text)] animate-fadeIn"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        {/* Field 1: Current Password */}
        <div>
          <Input
            id="current-password-input"
            type={showCurrent ? 'text' : 'password'}
            label="Current Password"
            name="currentPassword"
            autoComplete="current-password"
            placeholder="Enter your current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isLoading}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        {/* Field 2: New Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              id="new-password-input"
              type={showNew ? 'text' : 'password'}
              label="New Password"
              name="newPassword"
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
              helperText="Must be at least 8 characters"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>

          {/* Field 3: Confirm New Password */}
          <div>
            <Input
              id="confirm-password-input"
              type={showConfirm ? 'text' : 'password'}
              label="Confirm New Password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              helperText="Must match new password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C5A059]" />
          <div>
            <span>Your {roleName} account ID is permanently bonded. Changing this password will update your credentials in Supabase Auth GoTrue without altering permissions or profile records.</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </div>
  );
};
