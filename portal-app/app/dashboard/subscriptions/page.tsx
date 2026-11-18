import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { formatCents } from '@/lib/money';
import DashboardLayout from '../DashboardLayout';

export const metadata: Metadata = {
  title: 'Subscriptions — Acme Web Studio',
};

export default async function SubscriptionsPage() {
  const session = await requireSession();
  const client = session.client;

  const subscriptions = await prisma.subscription.findMany({
    where: { clientId: client.id },
    include: { order: { include: { package: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <DashboardLayout clientName={client.name}>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-500">You have no active subscriptions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const pkg = sub.order?.package;
            const isPastDue = sub.status === 'PAST_DUE';
            const isSuspended = sub.status === 'SUSPENDED';

            return (
              <div
                key={sub.id}
                className={`bg-white rounded-xl border shadow-sm p-6 ${
                  isSuspended ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {pkg?.name || 'Subscription'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {pkg?.category} · {pkg?.billingCycle?.toLowerCase()}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      sub.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : sub.status === 'PAST_DUE'
                        ? 'bg-amber-100 text-amber-700'
                        : sub.status === 'SUSPENDED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Price</p>
                    <p className="font-semibold text-slate-900">
                      {pkg ? formatCents(pkg.priceCents) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Renewal</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Grace ends</p>
                    <p className="font-semibold text-slate-900">
                      {sub.graceEndsAt
                        ? new Date(sub.graceEndsAt).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Suspended</p>
                    <p className="font-semibold text-slate-900">
                      {sub.suspendedAt
                        ? new Date(sub.suspendedAt).toLocaleDateString()
                        : 'No'}
                    </p>
                  </div>
                </div>

                {isSuspended && (
                  <div className="mt-4 bg-red-100 text-red-800 text-sm px-4 py-2 rounded-lg">
                    ⚠️ This subscription has been suspended due to payment failure.
                    Please update your payment method to restore service.
                  </div>
                )}
                {isPastDue && (
                  <div className="mt-4 bg-amber-100 text-amber-800 text-sm px-4 py-2 rounded-lg">
                    ⚠️ Payment is past due. Service continues during the grace period.
                    Please settle the outstanding amount to avoid suspension.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}