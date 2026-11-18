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
        <div className="bg-surface rounded-xl p-6 border border-line shadow-sm">
          <p className="text-sm text-subtle">Total Clients</p>
          <p className="text-3xl font-bold text-ink mt-1">{clients.length}</p>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-line shadow-sm">
          <p className="text-sm text-subtle">Pending Orders</p>
          <p className="text-3xl font-bold text-warning mt-1">{pendingOrders.length}</p>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-line shadow-sm">
          <p className="text-sm text-subtle">Active Packages</p>
          <p className="text-3xl font-bold text-ink mt-1">{packages.length}</p>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-line shadow-sm">
          <p className="text-sm text-subtle">Admin</p>
          <p className="text-lg font-bold text-ink mt-1">{session.client.name}</p>
        </div>
      </div>

      {/* Pending orders queue */}
      <div className="bg-surface rounded-xl border border-line shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-line">
          <h2 className="font-bold text-ink">Pending Orders — Needs Review</h2>
        </div>
        {orders.length === 0 ? (
          <div className="px-6 py-8 text-center text-subtle">No pending orders.</div>
        ) : (
          <div className="divide-y divide-line">
            {orders.map((order) => (
              <div key={order.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-ink">{order.package.name}</p>
                  <p className="text-sm text-subtle">
                    {order.clientName} · {order.clientEmail} · {order.clientPhone || '—'}
                  </p>
                  <p className="text-xs text-subtle">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-ink">
                    {formatCents(order.totalCents || 0)}
                  </span>
                  <a
                    href={`/admin/orders/${order.id}`}
                    className="text-sm bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent/90"
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
      <div className="bg-surface rounded-xl border border-line shadow-sm">
        <div className="px-6 py-4 border-b border-line">
          <h2 className="font-bold text-ink">Recent Clients</h2>
        </div>
        <div className="divide-y divide-line">
          {clients.slice(0, 10).map((client) => (
            <div key={client.id} className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-ink">{client.name}</p>
                <p className="text-sm text-subtle">{client.email}</p>
              </div>
              <span className="text-xs text-subtle">
                {new Date(client.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}