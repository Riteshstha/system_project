import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { formatPaisa } from '@/lib/money';
import AdminLayout from '../../AdminLayout';

export const metadata: Metadata = {
  title: 'Client Detail — Admin — Acme Web Studio',
};

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      orders: { include: { package: true }, orderBy: { createdAt: 'desc' } },
      subscriptions: { include: { order: { include: { package: true } } }, orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
      sessions: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!client) {
    return (
      <AdminLayout adminName={session.client.name}>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-ink">Client not found</h1>
          <a href="/admin/clients" className="text-accent hover:underline">Back to clients</a>
        </div>
      </AdminLayout>
    );
  }

  const totalSpent = client.invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amountCents, 0);

  return (
    <AdminLayout adminName={session.client.name}>
      <div className="mb-6">
        <a href="/admin/clients" className="text-sm text-accent hover:underline">← Back to clients</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-line shadow-sm p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Client Info</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <dt className="text-subtle">Name</dt>
            <dd className="font-medium text-ink">{client.name}</dd>
            <dt className="text-subtle">Email</dt>
            <dd className="font-medium text-ink">{client.email}</dd>
            <dt className="text-subtle">Phone</dt>
            <dd className="font-medium text-ink">{client.phone || '—'}</dd>
            <dt className="text-subtle">Roles</dt>
            <dd className="font-medium text-ink">{client.roles}</dd>
            <dt className="text-subtle">2FA Enabled</dt>
            <dd className="font-medium text-ink">{client.mfaEnabled ? 'Yes' : 'No'}</dd>
            <dt className="text-subtle">Total Spent</dt>
            <dd className="font-bold text-ink">{formatPaisa(totalSpent)}</dd>
            <dt className="text-subtle">Orders</dt>
            <dd className="font-medium text-ink">{client.orders.length}</dd>
            <dt className="text-subtle">Subscriptions</dt>
            <dd className="font-medium text-ink">{client.subscriptions.length}</dd>
            <dt className="text-subtle">Registered</dt>
            <dd className="font-medium text-ink">{new Date(client.createdAt).toLocaleString()}</dd>
          </dl>
        </div>

        <div className="bg-surface rounded-xl border border-line shadow-sm p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Recent Sessions</h2>
          {client.sessions.length === 0 ? (
            <p className="text-subtle">No sessions.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {client.sessions.map((s) => (
                <li key={s.id} className="flex justify-between text-muted">
                  <span>{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</span>
                  <span className="font-medium">{s.expiresAt > new Date() ? 'Active' : 'Expired'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Orders */}
      <div className="bg-surface rounded-xl border border-line shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-ink mb-4">Orders ({client.orders.length})</h2>
        {client.orders.length === 0 ? (
          <p className="text-subtle">No orders.</p>
        ) : (
          <div className="space-y-3">
            {client.orders.map((order) => (
              <a
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex justify-between items-center p-4 bg-canvas rounded-lg hover:bg-canvas transition-colors"
              >
                <div>
                  <p className="font-medium text-ink">{order.package.name}</p>
                  <p className="text-sm text-subtle">
                    {order.status} · {formatPaisa(order.totalCents)} · {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm text-accent hover:underline">View →</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Subscriptions */}
      <div className="bg-surface rounded-xl border border-line shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-ink mb-4">Subscriptions ({client.subscriptions.length})</h2>
        {client.subscriptions.length === 0 ? (
          <p className="text-subtle">No subscriptions.</p>
        ) : (
          <div className="space-y-3">
            {client.subscriptions.map((sub) => (
              <div
                key={sub.id}
                className={`flex justify-between items-center p-4 rounded-lg ${
                  sub.status === 'SUSPENDED' ? 'bg-error-soft border border-error/20' :
                  sub.status === 'PAST_DUE' ? 'bg-amber-50 border border-amber-200' :
                  'bg-canvas'
                }`}
              >
                <div>
                  <p className="font-medium text-ink">{sub.order?.package?.name || 'Subscription'}</p>
                  <p className="text-sm text-subtle">
                    {sub.status} · {new Date(sub.currentPeriodStart).toLocaleDateString()} → {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    sub.status === 'ACTIVE' ? 'bg-success-soft text-success' :
                    sub.status === 'PAST_DUE' ? 'bg-warning-soft text-warning' :
                    sub.status === 'SUSPENDED' ? 'bg-red-100 text-error' :
                    'bg-canvas text-muted'
                  }`}
                >
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-surface rounded-xl border border-line shadow-sm p-6">
        <h2 className="text-lg font-bold text-ink mb-4">Invoices ({client.invoices.length})</h2>
        {client.invoices.length === 0 ? (
          <p className="text-subtle">No invoices.</p>
        ) : (
          <div className="space-y-3">
            {client.invoices.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center p-4 bg-canvas rounded-lg">
                <div>
                  <p className="font-medium text-ink">
                    Invoice #{inv.id.slice(0, 8)} — {inv.description}
                  </p>
                  <p className="text-sm text-subtle">
                    Due: {new Date(inv.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-ink">{formatPaisa(inv.amountCents)}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    inv.status === 'PAID' ? 'bg-success-soft text-success' :
                    inv.status === 'UNPAID' ? 'bg-warning-soft text-warning' :
                    inv.status === 'CANCELLED' ? 'bg-red-100 text-error' :
                    'bg-canvas text-muted'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}