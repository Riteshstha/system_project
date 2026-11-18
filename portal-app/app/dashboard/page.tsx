import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { formatCents } from '@/lib/money';
import DashboardLayout from './DashboardLayout';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard — Acme Web Studio',
};

export default async function DashboardPage() {
  const session = await requireSession();
  const client = session.client;

  // All queries filtered by clientId — tenant isolation anchor
  const [orders, subscriptions, invoices] = await Promise.all([
    prisma.order.findMany({
      where: { clientId: client.id },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.subscription.findMany({
      where: { clientId: client.id },
      include: { order: { include: { package: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amountCents, 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amountCents, 0);

  return (
    <DashboardLayout clientName={client.name}>
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Total Orders</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Active Subscriptions</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {subscriptions.filter((s) => s.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Invoices Paid</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {formatCents(totalPaid)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Total Invoiced</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {formatCents(totalInvoiced)}
          </p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-slate-900">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-accent hover:underline">
            View all →
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No orders yet.{' '}
            <Link href="/pricing" className="text-accent hover:underline">
              Start an order →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">{order.package.name}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {formatCents(order.totalCents)}
                  </p>
                  <Link
                    href="/dashboard/orders"
                    className="text-xs text-accent hover:underline"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active subscriptions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">Active Subscriptions</h2>
        </div>
        {subscriptions.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No active subscriptions.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {subscriptions.slice(0, 5).map((sub) => (
              <div key={sub.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">
                    {sub.order?.package?.name || 'Subscription'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    sub.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : sub.status === 'PAST_DUE'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}