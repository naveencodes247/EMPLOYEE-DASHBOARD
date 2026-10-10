import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
  className = '',
  disabled,
  ...props
}) => {
  const checkboxId = id || Math.random().toString(36).substring(2, 9);

  return (
    <label
      htmlFor={checkboxId}
      className={`relative inline-flex items-start gap-2.5 cursor-pointer select-none group ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      } ${className}`}
    >
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <div
          className={`w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center
            border-[var(--border-subtle)] bg-[var(--bg-card)] group-hover:border-[var(--text-muted)]
            peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent-gold)] peer-focus-visible:ring-offset-1
            ${
              checked
                ? '!bg-[#18191B] dark:!bg-[#F4F4F6] !border-[#18191B] dark:!border-[#F4F4F6]'
                : ''
            }`}
        >
          {checked && (
            <Check className="w-3 h-3 text-white dark:text-[#18191B] stroke-[3]" aria-hidden="true" />
          )}
        </div>
      </div>
      <div className="flex flex-col text-xs leading-tight">
        <span className="font-normal text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
          {label}
        </span>
        {description && (
          <span className="text-[var(--text-muted)] mt-0.5 text-[11px]">{description}</span>
        )}
      </div>
    </label>
  );
};
