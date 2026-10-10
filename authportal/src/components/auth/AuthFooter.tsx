import React from 'react';
import type { BrandConfig } from '../../types/auth';

interface AuthFooterProps {
  brandConfig: BrandConfig;
}

export const AuthFooter: React.FC<AuthFooterProps> = ({ brandConfig }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full max-w-md mx-auto px-4 py-6 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-4">
        <p>© {currentYear} {brandConfig.companyName}.</p>
        {brandConfig.supportEmail && (
          <a
            href={`mailto:${brandConfig.supportEmail}`}
            className="hover:text-[var(--accent-gold)] transition-colors"
          >
            Contact Support
          </a>
        )}
      </div>
    </footer>
  );
};
