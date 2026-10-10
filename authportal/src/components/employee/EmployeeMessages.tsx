import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Code,
  Calendar,
} from 'lucide-react';
import { Button } from '../ui/Button';

import type { UserProfile } from '../../types/work';

interface DirectChatMessage {
  id: string;
  sender: 'employee' | 'manager';
  senderName: string;
  message: string;
  timestamp: string;
  category?: 'general' | 'blocker' | 'review' | 'schedule';
}

interface EmployeeMessagesProps {
  userProfile?: UserProfile;
}

export const EmployeeMessages: React.FC<EmployeeMessagesProps> = ({ userProfile }) => {
  const [messages, setMessages] = useState<DirectChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`messages_${userProfile?.id || 'default'}`);
        if (saved) return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [messageCategory, setMessageCategory] = useState<'general' | 'blocker' | 'review' | 'schedule'>('general');
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: DirectChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'employee',
      senderName: userProfile?.name || 'You',
      message: inputMessage.trim(),
      timestamp: 'Just now',
      category: messageCategory,
    };

    setMessages((prev) => {
      const updated = [...prev, newMsg];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`messages_${userProfile?.id || 'default'}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
    setInputMessage('');
    setSentNotice('Direct message dispatched to Manager.');
    setTimeout(() => setSentNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Direct Team & Lead Messaging
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Internal direct communication channel with your Engineering Manager and Leads.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Channel: Encrypted Internal Workspace</span>
        </div>
      </div>

      {sentNotice && (
        <div className="p-3.5 rounded-2xl bg-[var(--success-bg)] border border-[var(--success-border)] text-xs text-[var(--success-text)] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{sentNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSentNotice(null)}
            className="font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Messaging Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Manager Info & Direct Quick Topics */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div className="w-12 h-12 rounded-2xl bg-[#D9B66F]/20 border border-[#D9B66F]/40 flex items-center justify-center font-bold text-base text-[#222222] dark:text-[#F8E7A1] shrink-0">
                OM
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Operations &amp; Engineering Manager
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Reporting Manager
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Available on Duty</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[var(--text-muted)] font-semibold uppercase text-[10px] tracking-wider block">
                Quick Action Prompts
              </span>
              <button
                type="button"
                onClick={() => {
                  setMessageCategory('blocker');
                  setInputMessage('Hi, I hit an unexpected blocker on the task and would appreciate 5 minutes of input.');
                }}
                className="w-full text-left p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] hover:border-[#D9B66F] text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-2"
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>Report Blocker / Need Help</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessageCategory('review');
                  setInputMessage('Hi Rajesh, deliverable is ready for review with all tests passing.');
                }}
                className="w-full text-left p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] hover:border-[#D9B66F] text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-2"
              >
                <Code className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Request Deliverable Review</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessageCategory('schedule');
                  setInputMessage('Hi Rajesh, I submitted a planned leave request in the attendance section.');
                }}
                className="w-full text-left p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] hover:border-[#D9B66F] text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-[#D9B66F] shrink-0" />
                <span>Schedule / Leave Update</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): Conversation Feed & Composer */}
        <div className="lg:col-span-2 flex flex-col rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden shadow-xs min-h-[500px]">
          {/* Feed Header */}
          <div className="p-4 px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#D9B66F]" />
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Thread: Manager Direct Communication
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Auto-saved
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[420px]">
            {messages.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)]">No Direct Messages Yet</h4>
                <p className="text-[11px] text-[var(--text-secondary)] max-w-xs">
                  Communicate with your manager regarding deliverables, blockers, or schedule questions below.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === 'employee';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text-secondary)]">
                        {msg.senderName}
                      </span>
                      <span>·</span>
                      <span className="font-mono">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3.5 px-4 rounded-2xl max-w-lg text-xs leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-[#222222] dark:bg-[#F7F7F8] text-white dark:text-[#222222] rounded-tr-none'
                          : 'bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Composer */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold">
                Topic:
              </span>
              <div className="flex gap-1.5 text-[11px]">
                {(['general', 'blocker', 'review', 'schedule'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMessageCategory(cat)}
                    className={`px-2 py-0.5 rounded-full capitalize font-medium transition-colors cursor-pointer ${
                      messageCategory === cat
                        ? 'bg-[#D9B66F] text-[#222222] font-bold'
                        : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a direct message to your reporting manager..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#D9B66F]"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!inputMessage.trim()}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
