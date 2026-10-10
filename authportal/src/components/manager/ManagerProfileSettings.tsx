import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Building,
  Bell,
  Lock,
  CheckCircle2,
  Sliders,
  Calendar,
  Save,
  Clock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { UserProfile } from '../../types/work';

import { ProfilePictureUploader } from '../employee/ProfilePictureUploader';
import { ChangePasswordSection } from '../common/ChangePasswordSection';
import { portalApi } from '../../services/portalApi';

interface ManagerProfileSettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const ManagerProfileSettings: React.FC<ManagerProfileSettingsProps> = ({
  userProfile,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [jobTitle, setJobTitle] = useState(userProfile.jobTitle);
  const [department, setDepartment] = useState(userProfile.department);
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [blockerAlerts, setBlockerAlerts] = useState(true);
  const [reportReminders, setReportReminders] = useState(true);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userProfile.id) {
      await portalApi.updateUserProfile(userProfile.id, {
        full_name: name,
        job_title: jobTitle,
        phone: phone.trim(),
      });
    }
    onUpdateProfile({
      name,
      jobTitle,
      department,
      phone: phone.trim(),
    });
    setSavedNotice('Management profile and preferences updated successfully.');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Lead Profile & Management Settings
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage your personal credentials, supervisory notifications, and team governance policies.
          </p>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-[var(--success-bg)] border border-[var(--success-border)] text-xs text-[var(--success-text)] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{savedNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSavedNotice(null)}
            className="font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal & Organizational Identity Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <User className="w-4 h-4 text-[#C5A059]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Identity & Role Authorization
            </h3>
          </div>

          <div className="pb-2">
            <ProfilePictureUploader
              userId={userProfile.id}
              currentAvatarUrl={userProfile.avatarUrl}
              userName={userProfile.name}
              onUpdateAvatar={(newUrl) => onUpdateProfile({ avatarUrl: newUrl })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Full Legal / Directory Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Supervisory Title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Assigned Business Department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Contact Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <Input
                label="Internal Corporate Email"
                type="email"
                value={userProfile.email}
                disabled
                className="opacity-70 cursor-not-allowed bg-[var(--bg-card-subtle)]"
              />
              <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                Email is managed by company root administrator.
              </span>
            </div>
          </div>
        </div>

        {/* Team Supervisory Preferences Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <Bell className="w-4 h-4 text-[#D9B66F]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Operational Alert & Notification Rules
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <div>
                <div className="font-bold text-[var(--text-primary)]">Instant Blocker Alerts</div>
                <div className="text-[var(--text-secondary)] text-[11px]">
                  Receive high-priority notifications when an engineer marks a deliverable as blocked.
                </div>
              </div>
              <input
                type="checkbox"
                checked={blockerAlerts}
                onChange={(e) => setBlockerAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-[#D9B66F] accent-[#D9B66F] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <div>
                <div className="font-bold text-[var(--text-primary)]">Daily Standup Digest</div>
                <div className="text-[var(--text-secondary)] text-[11px]">
                  Automate end-of-day summary digest of all team member reports.
                </div>
              </div>
              <input
                type="checkbox"
                checked={reportReminders}
                onChange={(e) => setReportReminders(e.target.checked)}
                className="w-4 h-4 rounded text-[#D9B66F] accent-[#D9B66F] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <div>
                <div className="font-bold text-[var(--text-primary)]">Approval Request Pings</div>
                <div className="text-[var(--text-secondary)] text-[11px]">
                  Alert when an employee registers and completes email verification awaiting your signoff.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-[#D9B66F] accent-[#D9B66F] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Security & Authentication Protocol Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <Lock className="w-4 h-4 text-[#D9B66F]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Session Governance & Security
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)] block text-[11px]">Authentication Method</span>
              <span className="font-bold text-[var(--text-primary)] mt-1 block">Enterprise Single-Sign On</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)] block text-[11px]">Two-Factor Verification</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">Enforced & Active</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)] block text-[11px]">Session Timeout</span>
              <span className="font-bold text-[var(--text-primary)] mt-1 block">60 Minutes Inactivity</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Secure Change Password Section */}
      <ChangePasswordSection
        userEmail={userProfile.email}
        employeeId={userProfile.employeeId}
        roleName="Manager"
      />
    </div>
  );
};
