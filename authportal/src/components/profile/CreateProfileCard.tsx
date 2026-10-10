import React, { useState, useRef } from 'react';
import { UserPlus, Camera, Upload, Trash2, AlertCircle, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { portalApi } from '../../services/portalApi';
import type { UserProfile, PortalRole } from '../../types/work';

interface CreateProfileCardProps {
  userEmail: string;
  employeeId?: string;
  initialRole?: PortalRole;
  onProfileCreated: (profile: UserProfile) => void;
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

export const CreateProfileCard: React.FC<CreateProfileCardProps> = ({
  userEmail,
  employeeId = 'EMP-NEW',
  initialRole = 'employee',
  onProfileCreated,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('Engineering Operations');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FORMATS.includes(file.type.toLowerCase())) {
      setError('Invalid image format. Allowed formats: PNG, JPG, WebP, GIF.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('Image file is too large. Maximum file size is 2 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please provide your full legal or work name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid work email address.');
      return;
    }

    if (!jobTitle.trim()) {
      setError('Please specify your current job title or designation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createRes = await portalApi.createProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        jobTitle: jobTitle.trim(),
        departmentId: department.trim(),
      });

      if (!createRes.success || !createRes.profile) {
        throw new Error(createRes.error || 'Failed to initialize profile in Supabase database.');
      }

      let finalAvatarUrl = createRes.profile.avatarUrl;

      // If a photo was selected, upload it using the new profile's ID
      if (avatarFile && createRes.profile.id) {
        const uploadRes = await portalApi.uploadAvatar(createRes.profile.id, avatarFile);
        if (uploadRes.success && uploadRes.avatarUrl) {
          finalAvatarUrl = uploadRes.avatarUrl;
        }
      }

      setSuccessMsg('Profile created and provisioned successfully!');
      setTimeout(() => {
        onProfileCreated({
          ...createRes.profile!,
          avatarUrl: finalAvatarUrl,
          role: initialRole,
        });
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Error creating profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-md space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] shrink-0">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Create Your Profile
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Complete your workplace account information to activate your dashboard.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile Photo Uploader */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Profile Photo
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] flex items-center justify-center overflow-hidden shrink-0 relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-[var(--text-muted)]" />
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                onChange={handlePhotoSelect}
                className="sr-only"
                aria-label="Upload profile image"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                >
                  {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </Button>
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="text-red-600 hover:text-red-700"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                JPG, PNG, WebP, GIF up to 2 MB.
              </p>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3.5">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Alex Johnson"
            required
          />

          <Input
            label="Work Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            helperText="Maintained for internal workplace communications"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Job Title / Designation"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Systems Engineer"
              required
            />

            <Input
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering Operations"
            />
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#C5A059]" />
              <span className="text-[var(--text-secondary)]">Assigned System ID:</span>
            </div>
            <span className="font-mono font-bold text-[var(--text-primary)]">{employeeId}</span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Save &amp; Complete Profile
          </Button>
        </div>
      </form>
    </div>
  );
};
