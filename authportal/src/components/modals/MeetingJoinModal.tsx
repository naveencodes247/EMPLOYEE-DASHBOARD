import React from 'react';
import { X, Video, Users, Mic, Camera, PhoneOff, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';

interface MeetingJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingTitle?: string;
  meetingTime?: string;
}

export const MeetingJoinModal: React.FC<MeetingJoinModalProps> = ({
  isOpen,
  onClose,
  meetingTitle = 'Design Review Meeting',
  meetingTime = '09:00 AM - 10:00 AM',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Live Meeting Session</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Stage Preview */}
        <div className="p-6 text-center space-y-4">
          <div className="w-full h-44 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-[var(--border-subtle)] flex flex-col items-center justify-center text-neutral-300 relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-[#D9B66F] mb-2 backdrop-blur-sm">
              <Video className="w-8 h-8" />
            </div>
            <p className="text-xs font-semibold text-white">{meetingTitle}</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">{meetingTime} · Team Meeting Online</p>

            {/* Quick AV Controls */}
            <div className="absolute bottom-3 flex items-center gap-2">
              <span className="p-2 rounded-full bg-neutral-800/80 border border-white/10 text-white cursor-pointer hover:bg-neutral-700">
                <Mic className="w-3.5 h-3.5" />
              </span>
              <span className="p-2 rounded-full bg-neutral-800/80 border border-white/10 text-white cursor-pointer hover:bg-neutral-700">
                <Camera className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Users className="w-4 h-4" />
            <span>4 participants currently in the waiting room</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]/50 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Dismiss
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              alert(`Connecting to ${meetingTitle} live video bridge...`);
              onClose();
            }}
            className="text-xs shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" />
            <span>Enter Conference Room</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
