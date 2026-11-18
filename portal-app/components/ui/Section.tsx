import type { ReactNode } from 'react';
import { cn } from './cn';

export function Section({
  children,
  className = '',
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('py-16 md:py-24', className)}>
      <div className="page-container">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={cn('mb-10 max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
      )}
      <h2 className="section-heading">{title}</h2>
      {subtitle && <p className="section-subtitle mx-auto">{subtitle}</p>}
    </div>
  );
}
