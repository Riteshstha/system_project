import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { formatCents } from '@/lib/money';
import AdminLayout from './AdminLayout';

export const metadata: Metadata = {
  title: 'Admin — Acme Web Studio',
};

export default async function AdminPage() {
  const session = await requireAdmin();

  const [clients, orders, packages, pendingOrders] = await Promise.all([
    prisma.client.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.order.findMany({
      where: { status: 'PENDING' },
      include: { package: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.package.findMany({ where: { active: true }, orderBy: { category: 'asc' } }),
    prisma.order.findMany({
      where: { status: 'PENDING' },
      include: { package: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return (
    <AdminLayout adminName={session.client.name}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Total Clients</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{clients.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Pending Orders</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{pendingOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Active Packages</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{packages.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Admin</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{session.client.name}</p>
        </div>
      </div>

      {/* Pending orders queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">Pending Orders — Needs Review</h2>
        </div>
        {orders.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-500">No pending orders.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div key={order.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">{order.package.name}</p>
                  <p className="text-sm text-slate-500">
                    {order.clientName} · {order.clientEmail} · {order.clientPhone || '—'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">
                    {formatCents(order.totalCents || 0)}
                  </span>
                  <a
                    href={`/admin/orders/${order.id}`}
                    className="text-sm bg-brand text-brand-fg px-3 py-1.5 rounded-lg hover:bg-brand hover:opacity-90"
                  >
                    Review
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent clients */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">Recent Clients</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {clients.slice(0, 10).map((client) => (
            <div key={client.id} className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-900">{client.name}</p>
                <p className="text-sm text-slate-500">{client.email}</p>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(client.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}