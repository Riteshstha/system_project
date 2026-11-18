import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from './cn';

const fieldClass =
  'w-full rounded-sm border bg-surface px-4 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-subtle';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-subtle">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            fieldClass,
            leftIcon ? 'pl-10' : undefined,
            rightIcon ? 'pr-10' : undefined,
            error
              ? 'border-error bg-error-soft/40 focus:ring-2 focus:ring-error'
              : 'border-line hover:border-ink/20 focus:border-accent focus:ring-2 focus:ring-accent/20',
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {rightIcon && <div className="absolute inset-y-0 right-3 flex items-center text-subtle">{rightIcon}</div>}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 flex items-center gap-1 text-xs text-error">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-subtle">
          {hint}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  className?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          fieldClass,
          'resize-none',
          error
            ? 'border-error bg-error-soft/40 focus:ring-2 focus:ring-error'
            : 'border-line hover:border-ink/20 focus:border-accent focus:ring-2 focus:ring-accent/20',
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  className?: string;
}

export function Select({ label, error, className = '', id, children, ...props }: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          fieldClass,
          'appearance-none',
          error
            ? 'border-error bg-error-soft/40 focus:ring-2 focus:ring-error'
            : 'border-line hover:border-ink/20 focus:border-accent focus:ring-2 focus:ring-accent/20',
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
