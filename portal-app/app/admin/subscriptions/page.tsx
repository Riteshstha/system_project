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
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  TRIAL: 'bg-blue-100 text-blue-700',
  PAST_DUE: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">All Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-500">No subscriptions yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Package</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Grace Ends</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{sub.client?.name || '—'}</div>
                    <div className="text-xs text-slate-500">{sub.client?.email || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {sub.order?.package?.name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {sub.order?.package ? formatPaisa(sub.order.package.priceCents) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        STATUS_COLORS[sub.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(sub.currentPeriodStart).toLocaleDateString()} →{' '}
                    {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {sub.graceEndsAt ? new Date(sub.graceEndsAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {sub.status === 'ACTIVE' || sub.status === 'PAST_DUE' ? (
                      <CancelSubscriptionButton subId={sub.id} />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
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