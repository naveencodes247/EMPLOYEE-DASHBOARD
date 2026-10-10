import React, { useState, useEffect } from 'react';
import { X, Building2, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { BrandConfig } from '../../types/auth';

interface CompanyCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandConfig;
  onSave: (config: BrandConfig) => void;
}

export const CompanyCustomizerModal: React.FC<CompanyCustomizerModalProps> = ({
  isOpen,
  onClose,
  brandConfig,
  onSave,
}) => {
  const [name, setName] = useState(brandConfig.companyName);
  const [subtitle, setSubtitle] = useState(brandConfig.portalSubtitle);
  const [supportEmail, setSupportEmail] = useState(brandConfig.supportEmail);

  useEffect(() => {
    if (isOpen) {
      setName(brandConfig.companyName);
      setSubtitle(brandConfig.portalSubtitle);
      setSupportEmail(brandConfig.supportEmail);
    }
  }, [isOpen, brandConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...brandConfig,
      companyName: name.trim() || 'Enterprise Work',
      portalSubtitle: subtitle.trim() || 'Employee Work Management Portal',
      supportEmail: supportEmail.trim() || 'it-support@organization.internal',
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] shadow-xl p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-gold-subtle)] border border-[var(--accent-gold-border)] flex items-center justify-center text-[var(--accent-gold)]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="brand-modal-title" className="text-sm font-semibold text-[var(--text-primary)]">
                Brand & Placeholder Settings
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Customize placeholder details for review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Company / Product Name Placeholder"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Corp, Crextio, WorkSphere"
            helperText="Appears on the portal header, sign-in title, and browser title."
            required
          />

          <Input
            label="Portal Subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Employee Work Management Portal"
            required
          />

          <Input
            label="IT Help Desk Contact Email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="e.g. support@company.com"
          />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Update Placeholder
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
