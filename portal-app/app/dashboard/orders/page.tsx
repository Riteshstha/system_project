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
    PENDING: 'bg-amber-100 text-amber-700',
    QUOTE_SENT: 'bg-blue-100 text-blue-700',
    ADVANCE_PAID: 'bg-indigo-100 text-indigo-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    READY: 'bg-cyan-100 text-cyan-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-slate-200 text-slate-700',
  };

  return (
    <DashboardLayout clientName={client.name}>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Orders & Projects</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-500 mb-4">You have no orders yet.</p>
          <Link
            href="/pricing"
            className="inline-block bg-brand text-brand-fg font-semibold px-6 py-3 rounded-lg hover:bg-brand hover:opacity-90"
          >
            Start an Order
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900">{order.package.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Order #{order.id.slice(0, 8)} · {order.package.category} ·{' '}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  {order.notes && (
                    <p className="text-sm text-slate-600 mt-2">{order.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      statusColors[order.status] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {order.status}
                  </span>
                  <p className="mt-2 font-bold text-slate-900">
                    {formatCents(order.totalCents)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Advance (50%): </span>
                  <span className="font-medium text-slate-900">
                    {formatCents(order.advanceCents)}
                  </span>
                </div>
                {order.subscription && (
                  <div>
                    <span className="text-slate-500">Subscription: </span>
                    <span className="font-medium text-slate-900">
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