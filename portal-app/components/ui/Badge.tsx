import { cn } from './cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'brand' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-canvas text-muted border border-line',
    brand: 'bg-ink text-brand-fg',
    accent: 'bg-accent-soft text-accent',
    emerald: 'bg-success-soft text-success',
    amber: 'bg-warning-soft text-warning',
    red: 'bg-error-soft text-error',
    blue: 'bg-accent-soft text-accent',
    purple: 'bg-canvas text-ink border border-line',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full font-medium', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    PENDING: { label: 'Pending', variant: 'default' },
    CONTACTED: { label: 'Contacted', variant: 'blue' },
    QUOTE_SENT: { label: 'Quote Sent', variant: 'blue' },
    CONFIRMED: { label: 'Confirmed', variant: 'emerald' },
    ADVANCE_PAID: { label: 'Advance Paid', variant: 'emerald' },
    PAID: { label: 'Paid', variant: 'emerald' },
    IN_PROGRESS: { label: 'In Progress', variant: 'amber' },
    READY: { label: 'Ready', variant: 'emerald' },
    ACTIVE: { label: 'Active', variant: 'emerald' },
    CANCELLED: { label: 'Cancelled', variant: 'red' },
    SUSPENDED: { label: 'Suspended', variant: 'amber' },
    ORDER: { label: 'Order', variant: 'blue' },
    QUOTE: { label: 'Quote', variant: 'purple' },
    ACTIVE_SUB: { label: 'Active', variant: 'emerald' },
    PAST_DUE: { label: 'Past Due', variant: 'amber' },
    TRIAL: { label: 'Trial', variant: 'blue' },
    UNPAID: { label: 'Unpaid', variant: 'amber' },
    PAID_INV: { label: 'Paid', variant: 'emerald' },
    CANCELLED_INV: { label: 'Cancelled', variant: 'red' },
    REFUNDED: { label: 'Refunded', variant: 'default' },
  };

  const info = statusMap[status] || { label: status, variant: 'default' };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

export function SourceBadge({ source }: { source: string }) {
  return (
    <Badge variant={source === 'QUOTE' ? 'purple' : 'blue'} size="sm">
      {source}
    </Badge>
  );
}
