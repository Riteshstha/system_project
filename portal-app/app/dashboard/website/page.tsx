import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import DashboardLayout from '../DashboardLayout';

export const metadata: Metadata = {
  title: 'Website Status — Acme Web Studio',
};

export default async function WebsiteStatusPage() {
  const session = await requireSession();
  const client = session.client;

  const orders = await prisma.order.findMany({
    where: { clientId: client.id },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
  });

  const readyOrders = orders.filter((o) => o.status === 'READY' || o.status === 'ACTIVE');

  return (
    <DashboardLayout clientName={client.name}>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Website Status</h1>

      {readyOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-500">
            No websites are ready yet. Your site will appear here once our team
            completes the design and launches it.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {readyOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900">{order.package.name}</h3>
                  <p className="text-sm text-slate-500">
                    Order #{order.id.slice(0, 8)} ·{' '}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    order.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-cyan-100 text-cyan-700'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
                >
                  View Live Site
                </button>
                <button
                  type="button"
                  className="text-sm border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
                >
                  View Admin Panel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}