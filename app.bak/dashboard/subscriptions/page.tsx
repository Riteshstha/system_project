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
      <h1 className="text-2xl font-bold text-ink mb-6">Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line shadow-sm p-12 text-center">
          <p className="text-subtle">You have no active subscriptions.</p>
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
                className={`bg-surface rounded-xl border shadow-sm p-6 ${
                  isSuspended ? 'border-red-300 bg-error-soft' : 'border-line'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-ink">
                      {pkg?.name || 'Subscription'}
                    </h3>
                    <p className="text-sm text-subtle mt-1">
                      {pkg?.category} · {pkg?.billingCycle?.toLowerCase()}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      sub.status === 'ACTIVE'
                        ? 'bg-success-soft text-success'
                        : sub.status === 'PAST_DUE'
                        ? 'bg-warning-soft text-warning'
                        : sub.status === 'SUSPENDED'
                        ? 'bg-red-100 text-error'
                        : 'bg-canvas text-muted'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-subtle">Price</p>
                    <p className="font-semibold text-ink">
                      {pkg ? formatCents(pkg.priceCents) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-subtle">Renewal</p>
                    <p className="font-semibold text-ink">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-subtle">Grace ends</p>
                    <p className="font-semibold text-ink">
                      {sub.graceEndsAt
                        ? new Date(sub.graceEndsAt).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-subtle">Suspended</p>
                    <p className="font-semibold text-ink">
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
                  <div className="mt-4 bg-warning-soft text-amber-800 text-sm px-4 py-2 rounded-lg">
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