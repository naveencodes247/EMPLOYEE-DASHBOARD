import React from 'react';

export interface UserProfileCardProps {
  name: string;
  role: string;
  compensationChip?: string;
  statusText?: string;
  avatarUrl?: string;
  className?: string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  name = 'Lora Piterson',
  role = 'UX/UI Designer',
  compensationChip = '$1,200',
  statusText = 'Active Member',
  avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] group ${className}`}>
      {/* Background Image / Portrait */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[var(--bg-app)]">
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover object-center filter saturate-90 transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient shadow for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Floating Compensation / Rate Chip (from reference: "$1,200") */}
        {compensationChip && (
          <div className="absolute bottom-5 right-5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold text-xs tracking-wide shadow-sm">
            {compensationChip}
          </div>
        )}

        {/* Profile Info Overlay */}
        <div className="absolute bottom-5 left-5 text-white pr-16">
          <h3 className="text-base font-bold tracking-tight leading-tight">
            {name}
          </h3>
          <p className="text-xs text-white/80 font-medium mt-0.5">
            {role}
          </p>
          {statusText && (
            <p className="text-[10px] text-white/60 mt-1">
              {statusText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
