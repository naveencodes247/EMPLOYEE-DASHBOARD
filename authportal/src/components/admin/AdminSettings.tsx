import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Clock,
  Database,
  CheckCircle2,
  Lock,
  Save,
  Server,
  Globe,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { ProfilePictureUploader } from '../employee/ProfilePictureUploader';
import { ChangePasswordSection } from '../common/ChangePasswordSection';
import { portalApi } from '../../services/portalApi';
import type { PortalSecuritySettings, UserProfile } from '../../types/work';
import type { BrandConfig } from '../../types/auth';

interface AdminSettingsProps {
  brandConfig: BrandConfig;
  settings: PortalSecuritySettings;
  onUpdateSettings: (newSettings: PortalSecuritySettings) => void;
  onOpenBrandCustomizer: () => void;
  adminProfile?: UserProfile;
  onUpdateAdminProfile?: (updated: Partial<UserProfile>) => void;
  userEmail?: string;
  employeeId?: string;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  brandConfig,
  settings,
  onUpdateSettings,
  onOpenBrandCustomizer,
  adminProfile,
  onUpdateAdminProfile,
  userEmail = '',
  employeeId = '',
}) => {
  // Admin Personal Profile State
  const [adminName, setAdminName] = useState(adminProfile?.name || '');
  const [adminEmail, setAdminEmail] = useState(adminProfile?.email || userEmail);
  const [adminJobTitle, setAdminJobTitle] = useState(
    adminProfile?.jobTitle || 'System Administrator'
  );
  const [adminDepartment, setAdminDepartment] = useState(
    adminProfile?.department || 'Executive Governance'
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security Governance State
  const [localSettings, setLocalSettings] = useState<PortalSecuritySettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveGovernance = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!adminName.trim()) {
      setProfileError('Full Name cannot be empty.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail.trim())) {
      setProfileError('Please provide a valid contact email address.');
      return;
    }

    setIsSavingProfile(true);
    try {
      if (adminProfile?.id) {
        const res = await portalApi.updateUserProfile(adminProfile.id, {
          full_name: adminName.trim(),
          email: adminEmail.trim(),
          job_title: adminJobTitle.trim(),
          department_id: adminDepartment.trim(),
        });

        if (res.success && res.profile) {
          if (onUpdateAdminProfile) {
            onUpdateAdminProfile({
              name: res.profile.name,
              email: res.profile.email,
              jobTitle: res.profile.jobTitle,
              department: res.profile.department,
            });
          }
          setProfileSuccess('Personal administrator profile successfully updated.');
          setTimeout(() => setProfileSuccess(null), 3000);
        } else {
          setProfileError(res.error || 'Failed to persist administrator profile.');
        }
      } else {
        setProfileSuccess('Profile preferences updated.');
        setTimeout(() => setProfileSuccess(null), 3000);
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Error occurred while saving profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Profile &amp; Governance Settings
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Manage your administrator profile, security policies, access parameters, and branding.
        </p>
      </div>

      {/* 1. Admin's Personal Profile & Avatar Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <User className="w-4 h-4 text-[#C5A059]" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Administrator Personal Profile
          </h3>
        </div>

        {profileSuccess && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2 animate-fadeIn"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2 animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        {/* Avatar Uploader */}
        <div className="pb-2">
          <ProfilePictureUploader
            userId={adminProfile?.id}
            currentAvatarUrl={adminProfile?.avatarUrl || null}
            userName={adminName}
            onUpdateAvatar={(newUrl) => {
              if (onUpdateAdminProfile) {
                onUpdateAdminProfile({ avatarUrl: newUrl });
              }
            }}
          />
        </div>

        {/* Admin Details Form */}
        <form onSubmit={handleSaveAdminProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Legal / Directory Name"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              required
            />

            <Input
              label="Contact / Work Email Address"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              helperText="Official administrative contact address"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Executive Title"
              value={adminJobTitle}
              onChange={(e) => setAdminJobTitle(e.target.value)}
              required
            />

            <Input
              label="Department"
              value={adminDepartment}
              onChange={(e) => setAdminDepartment(e.target.value)}
              required
            />

            <Input
              label="System Identifier"
              value={adminProfile?.employeeId || employeeId}
              disabled
              helperText="Immutable administrator ID"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-bold text-[var(--text-primary)] block">
                  Assigned Portal Access Tier: Administrator (Executive Governance)
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Holds organization-wide operational oversight and directory provisioning authority.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSavingProfile}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Administrator Profile
            </Button>
          </div>
        </form>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>Security parameters and system policies successfully updated.</span>
        </div>
      )}

      {/* 2. Security Governance Form */}
      <form onSubmit={handleSaveGovernance} className="space-y-6">
        {/* Security Policy Section */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#D9B66F]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Authentication &amp; Session Security
            </h3>
          </div>

          <div className="space-y-3">
            <Checkbox
              id="enforce-2fa"
              label="Enforce Mandatory Multi-Factor Authentication (2FA) for all accounts"
              checked={localSettings.enforce2FA}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, enforce2FA: e.target.checked })
              }
            />

            <Checkbox
              id="ip-allowlist"
              label="Restrict Portal Access to Corporate Virtual Private Network / IP Allowlist"
              checked={localSettings.ipAllowlistEnabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, ipAllowlistEnabled: e.target.checked })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Input
              label="Session Timeout (Minutes)"
              type="number"
              value={localSettings.sessionTimeoutMinutes}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  sessionTimeoutMinutes: parseInt(e.target.value) || 60,
                })
              }
              helperText="Idle period before session token revocation"
            />

            <Input
              label="Password Expiry Rotation (Days)"
              type="number"
              value={localSettings.passwordExpiryDays}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  passwordExpiryDays: parseInt(e.target.value) || 90,
                })
              }
              helperText="Forces credential refresh after set interval"
            />
          </div>

          {localSettings.ipAllowlistEnabled && (
            <div className="pt-2">
              <Input
                label="Permitted CIDR Subnets"
                value={localSettings.allowedIpRanges}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, allowedIpRanges: e.target.value })
                }
                helperText="Comma-separated IPv4 / IPv6 subnets"
              />
            </div>
          )}
        </div>

        {/* Workplace Operational Rules */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D9B66F]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Workplace Attendance &amp; Reporting Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Core Shift Start (EST)"
              type="time"
              value={localSettings.workHoursStart}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, workHoursStart: e.target.value })
              }
            />

            <Input
              label="Core Shift End (EST)"
              type="time"
              value={localSettings.workHoursEnd}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, workHoursEnd: e.target.value })
              }
            />
          </div>

          <div className="space-y-3 pt-1">
            <Checkbox
              id="allow-remote"
              label="Permit remote check-in outside corporate office networks"
              checked={localSettings.allowRemoteCheckIn}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, allowRemoteCheckIn: e.target.checked })
              }
            />

            <Checkbox
              id="require-reports"
              label="Require mandatory daily standup report submission prior to shift checkout"
              checked={localSettings.dailyReportsRequired}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  dailyReportsRequired: e.target.checked,
                })
              }
            />
          </div>
        </div>

        {/* Branding Configuration */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#D9B66F]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Organization Identity &amp; Portal Customizer
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenBrandCustomizer}
              className="text-xs"
            >
              Configure Identity
            </Button>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Active Entity: <strong>{brandConfig.companyName}</strong> (Customizable brand identity)
          </p>
        </div>

        {/* Save Governance Button */}
        <div className="flex justify-end pt-2">
          <Button variant="primary" size="md" type="submit" className="shadow-xs">
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save Governance Policies</span>
          </Button>
        </div>
      </form>

      {/* 3. Secure Change Password Section */}
      <ChangePasswordSection
        userEmail={adminProfile?.email || userEmail}
        employeeId={adminProfile?.employeeId || employeeId}
        roleName="Administrator"
      />
    </div>
  );
};
