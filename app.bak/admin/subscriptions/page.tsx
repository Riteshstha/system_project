import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { formatPaisa } from '@/lib/money';
import AdminLayout from '../AdminLayout';
import CancelSubscriptionButton from './CancelSubscriptionButton';

export const metadata: Metadata = {
  title: 'Subscriptions — Admin — Acme Web Studio',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-success-soft text-success',
  TRIAL: 'bg-accent-soft text-accent',
  PAST_DUE: 'bg-warning-soft text-warning',
  SUSPENDED: 'bg-red-100 text-error',
  CANCELLED: 'bg-canvas text-muted',
};

export default async function AdminSubscriptionsPage() {
  const session = await requireAdmin();

  const subscriptions = await prisma.subscription.findMany({
    include: {
      client: { select: { id: true, name: true, email: true } },
      order: { include: { package: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminLayout adminName={session.client.name}>
      <h1 className="text-2xl font-bold text-ink mb-6">All Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line shadow-sm p-12 text-center">
          <p className="text-subtle">No subscriptions yet.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-canvas">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Package</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Grace Ends</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-subtle uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-canvas">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-ink">{sub.client?.name || '—'}</div>
                    <div className="text-xs text-subtle">{sub.client?.email || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink">
                    {sub.order?.package?.name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-ink">
                    {sub.order?.package ? formatPaisa(sub.order.package.priceCents) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        STATUS_COLORS[sub.status] || 'bg-canvas text-muted'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {new Date(sub.currentPeriodStart).toLocaleDateString()} →{' '}
                    {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {sub.graceEndsAt ? new Date(sub.graceEndsAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {sub.status === 'ACTIVE' || sub.status === 'PAST_DUE' ? (
                      <CancelSubscriptionButton subId={sub.id} />
                    ) : (
                      <span className="text-xs text-subtle">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}