import React, { useState } from 'react';
import {
  Shield,
  Save,
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ProfilePictureUploader } from './ProfilePictureUploader';
import { ChangePasswordSection } from '../common/ChangePasswordSection';
import { useTheme } from '../../context/ThemeContext';
import { portalApi } from '../../services/portalApi';
import type { UserProfile } from '../../types/work';

interface EmployeeProfileSettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const EmployeeProfileSettings: React.FC<EmployeeProfileSettingsProps> = ({
  userProfile,
  onUpdateProfile,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [jobTitle, setJobTitle] = useState(userProfile.jobTitle);
  const [timezone, setTimezone] = useState(userProfile.timezone || 'Asia/Kolkata');
  const [isSaving, setIsSaving] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);
    setSaveFeedback(null);

    if (!name.trim()) {
      setErrorFeedback('Full Name cannot be empty.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorFeedback('Please enter a valid work email format.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await portalApi.updateUserProfile(userProfile.id, {
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        job_title: jobTitle.trim(),
        timezone,
      });

      if (res.success && res.profile) {
        onUpdateProfile({
          name: res.profile.name,
          email: res.profile.email,
          phone: res.profile.phone,
          jobTitle: res.profile.jobTitle,
          timezone: res.profile.timezone,
        });

        if (res.emailVerificationPending) {
          setSaveFeedback('Profile details saved! A verification link has been dispatched to your new email address to confirm the change.');
        } else {
          setSaveFeedback('Profile details successfully updated and saved.');
        }
        setTimeout(() => setSaveFeedback(null), 5000);
      } else {
        setErrorFeedback(res.error || 'Failed to persist profile changes.');
      }
    } catch (err: any) {
      setErrorFeedback(err?.message || 'Unexpected error while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Profile &amp; Account Settings
          </h2>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Manage your workplace display profile, avatar, and system preferences.
        </p>
      </div>

      {saveFeedback && (
        <div
          role="status"
          className="p-3.5 rounded-2xl bg-[var(--success-bg)] border border-[var(--success-border)] flex items-center gap-2 text-xs text-[var(--success-text)] animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {errorFeedback && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* 1. Customizable Profile Picture Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          Profile Photo
        </h3>
        <ProfilePictureUploader
          userId={userProfile.id}
          currentAvatarUrl={userProfile.avatarUrl}
          userName={userProfile.name}
          onUpdateAvatar={(newUrl) => onUpdateProfile({ avatarUrl: newUrl })}
        />
      </div>

      {/* 2. Personal Information Form */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-5">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          Personal &amp; Workplace Information
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />

            <Input
              label="Work Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              helperText="Contact email for notifications"
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              helperText="Official contact number"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Job Title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
            />

            <Input
              label="Department (Assigned)"
              value={userProfile.department}
              disabled
              helperText="Managed by HR"
            />

            <Input
              label="Employee ID"
              value={userProfile.employeeId}
              disabled
              helperText="Permanent identifier"
            />
          </div>

          {/* Role Status (Strict Security Demonstration) */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D9B66F]" />
              <div>
                <span className="font-bold text-[var(--text-primary)] block">
                  Assigned Portal Access Tier: Employee
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Role elevation requires authorized backend promotion. Users cannot modify permissions from the client.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Secure Change Password Section */}
      <ChangePasswordSection
        userEmail={userProfile.email}
        employeeId={userProfile.employeeId}
        roleName="Employee"
      />

      {/* 4. Theme & Interface Preferences */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          Interface &amp; Visual Preferences
        </h3>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
          <div>
            <p className="text-xs font-bold text-[var(--text-primary)]">
              Application Theme: {theme === 'dark' ? 'Deep Charcoal Dark' : 'Warm Cream Light'}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Toggle between high-contrast dark surfaces and warm neutral light mode.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
            leftIcon={theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#D9B66F]" /> : <Moon className="w-3.5 h-3.5" />}
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </Button>
        </div>
      </div>
    </div>
  );
};
