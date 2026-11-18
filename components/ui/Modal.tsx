'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal aria-labelledby="modal-title">
      <button type="button" className="absolute inset-0 bg-ink/40" onClick={onClose} aria-label="Close dialog" />
      <div className="relative w-full max-w-lg rounded-lg border border-line bg-surface p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="font-display text-lg font-semibold text-ink">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="text-subtle hover:text-ink" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
