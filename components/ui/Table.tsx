import type { ReactNode } from 'react';
import { cn } from './cn';

export function Table({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-md border border-line bg-surface shadow-sm', className)}>
      <table className="min-w-full divide-y divide-line">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-canvas/80">{children}</thead>;
}

export function Th({ children, className = '', sticky = false }: { children: ReactNode; className?: string; sticky?: boolean }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-subtle',
        sticky && 'sticky left-0 z-10 bg-canvas',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function Tr({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={cn('hover:bg-canvas/70', className)}>{children}</tr>;
}

export function Td({ children, className = '', sticky = false }: { children: ReactNode; className?: string; sticky?: boolean }) {
  return (
    <td className={cn('px-4 py-4 text-sm text-muted', sticky && 'sticky left-0 z-10 bg-surface', className)}>
      {children}
    </td>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  );
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-sm border border-error/20 bg-error-soft px-4 py-3 text-sm text-error" role="alert">
      {children}
    </div>
  );
}

export function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label={label}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  );
}
