import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { formatCents } from '@/lib/money';
import DashboardLayout from '../DashboardLayout';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Orders — Acme Web Studio',
};

export default async function OrdersPage() {
  const session = await requireSession();
  const client = session.client;

  const orders = await prisma.order.findMany({
    where: { clientId: client.id },
    include: { package: true, subscription: true },
    orderBy: { createdAt: 'desc' },
  });

  const statusColors: Record<string, string> = {
    PENDING: 'bg-warning-soft text-warning',
    QUOTE_SENT: 'bg-accent-soft text-accent',
    ADVANCE_PAID: 'bg-indigo-100 text-indigo-700',
    IN_PROGRESS: 'bg-canvas text-ink',
    READY: 'bg-cyan-100 text-cyan-700',
    ACTIVE: 'bg-success-soft text-success',
    CANCELLED: 'bg-red-100 text-error',
    SUSPENDED: 'bg-line text-ink',
  };

  return (
    <DashboardLayout clientName={client.name}>
      <h1 className="text-2xl font-bold text-ink mb-6">Orders & Projects</h1>

      {orders.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line shadow-sm p-12 text-center">
          <p className="text-subtle mb-4">You have no orders yet.</p>
          <Link
            href="/pricing"
            className="inline-block bg-accent text-white font-semibold px-6 py-3 rounded-lg hover:bg-accent/90"
          >
            Start an Order
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-surface rounded-xl border border-line shadow-sm p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-ink">{order.package.name}</h3>
                  <p className="text-sm text-subtle mt-1">
                    Order #{order.id.slice(0, 8)} · {order.package.category} ·{' '}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  {order.notes && (
                    <p className="text-sm text-muted mt-2">{order.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      statusColors[order.status] || 'bg-canvas text-muted'
                    }`}
                  >
                    {order.status}
                  </span>
                  <p className="mt-2 font-bold text-ink">
                    {formatCents(order.totalCents)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <span className="text-subtle">Advance (50%): </span>
                  <span className="font-medium text-ink">
                    {formatCents(order.advanceCents)}
                  </span>
                </div>
                {order.subscription && (
                  <div>
                    <span className="text-subtle">Subscription: </span>
                    <span className="font-medium text-ink">
                      {order.subscription.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}