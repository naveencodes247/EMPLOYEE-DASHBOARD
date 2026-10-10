import React, { useRef, useState } from 'react';
import { Camera, Trash2, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { portalApi } from '../../services/portalApi';

interface ProfilePictureUploaderProps {
  currentAvatarUrl: string | null;
  userName: string;
  userId?: string;
  onUpdateAvatar: (newUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB limit (enforced by Supabase storage bucket)
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

export const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  currentAvatarUrl,
  userName,
  userId,
  onUpdateAvatar,
  size = 'md',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFeedback(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    if (!ALLOWED_FORMATS.includes(file.type.toLowerCase())) {
      setError('Please select a valid image format (PNG, JPG, WebP, GIF).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (< 2MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('Image file is too large. Maximum permitted file size is 2 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);

    try {
      if (userId) {
        // Upload directly to Supabase Storage avatars bucket
        const res = await portalApi.uploadAvatar(userId, file);
        if (res.success && res.avatarUrl) {
          onUpdateAvatar(res.avatarUrl);
          setFeedback('Profile picture uploaded and saved to Supabase Storage.');
        } else {
          setError(res.error || 'Failed to upload image. Please try again.');
        }
      } else {
        // Preview fallback if userId not yet bound
        const previewUrl = URL.createObjectURL(file);
        onUpdateAvatar(previewUrl);
        setFeedback('Profile picture preview updated.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while processing image upload.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setError(null);
    setFeedback(null);
    setIsUploading(true);

    try {
      if (userId) {
        await portalApi.removeAvatar(userId);
      }
      onUpdateAvatar(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFeedback('Profile picture removed. Neutral initials avatar restored.');
    } catch (err: any) {
      setError(err?.message || 'Failed to remove avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-16 h-16 text-sm',
    md: 'w-24 h-24 text-xl',
    lg: 'w-32 h-32 text-2xl',
  }[size];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar Display */}
        <div className="relative group">
          <div
            className={`${sizeClasses} rounded-full border-2 border-[var(--border-subtle)] bg-[#C5A059]/20 flex items-center justify-center font-bold text-[#C5A059] overflow-hidden shadow-xs shrink-0 select-none relative`}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
            ) : currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt={userName}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <span>{getInitials(userName)}</span>
            )}
          </div>

          {/* Quick Camera Action Badge */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            title="Upload new photo"
            aria-label="Upload new profile picture"
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1A1D20] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer border border-white/20 disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Controls & Guidelines */}
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Upload profile image"
            />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={isUploading}
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              className="cursor-pointer"
            >
              {currentAvatarUrl ? 'Replace Photo' : 'Upload Photo'}
            </Button>

            {currentAvatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploading}
                onClick={handleRemove}
                className="text-red-600 dark:text-red-400 hover:text-red-700 cursor-pointer"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Remove
              </Button>
            )}
          </div>

          <p className="text-[11px] text-[var(--text-muted)]">
            Permitted formats: JPG, PNG, WebP, GIF. Maximum file size: 2 MB.
          </p>
        </div>
      </div>

      {/* Error or Feedback Alerts */}
      {error && (
        <div
          role="alert"
          className="p-2.5 rounded-lg bg-[var(--error-bg)] border border-[var(--error-border)] flex items-start gap-2 text-xs text-[var(--error-text)] animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {feedback && !error && (
        <div
          role="status"
          className="p-2.5 rounded-lg bg-[var(--success-bg)] border border-[var(--success-border)] flex items-start gap-2 text-xs text-[var(--success-text)] animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
};
