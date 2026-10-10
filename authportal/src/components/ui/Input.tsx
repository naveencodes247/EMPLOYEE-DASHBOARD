import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, helperText, rightElement, className = '', containerClassName = '', ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none"
          >
            {label}
            {props.required && <span className="ml-1 text-[#C5A059] dark:text-[#D4AF37]">*</span>}
          </label>
        </div>

        <div className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full h-11 px-3.5 text-sm rounded-lg border transition-all duration-150 outline-none
              bg-[var(--bg-input)] text-[var(--text-primary)]
              ${
                error
                  ? 'border-[var(--error-border)] focus:border-[var(--error-border)] focus:ring-2 focus:ring-red-500/20'
                  : 'border-[var(--border-subtle)] hover:border-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20'
              }
              ${rightElement ? 'pr-11' : ''}
              placeholder:text-[var(--text-muted)] placeholder:text-sm
              disabled:opacity-60 disabled:cursor-not-allowed
              ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-1.5 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <div
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mt-0.5 animate-fadeIn"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-[var(--text-muted)] mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
