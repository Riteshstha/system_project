import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import AdminLayout from '../AdminLayout';
import OrderStatusForm from './OrderStatusForm';

export const metadata: Metadata = {
  title: 'Orders — Admin — Acme Web Studio',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; q?: string }>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;

  const where: any = {};
  if (params.status) where.status = params.status;
  if (params.source) where.source = params.source;
  if (params.q) {
    where.OR = [
      { clientName: { contains: params.q, mode: 'insensitive' } },
      { clientEmail: { contains: params.q, mode: 'insensitive' } },
      { company: { contains: params.q, mode: 'insensitive' } },
      { orderNumber: { contains: params.q, mode: 'insensitive' } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: { package: true, client: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const statuses = [
    'PENDING',
    'CONTACTED',
    'QUOTE_SENT',
    'CONFIRMED',
    'ADVANCE_PAID',
    'PAID',
    'IN_PROGRESS',
    'READY',
    'ACTIVE',
    'CANCELLED',
    'SUSPENDED',
  ];

  return (
    <AdminLayout adminName={session.client.name}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ink">Orders</h1>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/admin/orders"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              !params.status && !params.source
                ? 'bg-accent text-white'
                : 'bg-surface text-text border border-line hover:bg-canvas'
            }`}
          >
            All
          </a>
          <a
            href="/admin/orders?source=QUOTE"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              params.source === 'QUOTE'
                ? 'bg-accent text-white'
                : 'bg-surface text-text border border-line hover:bg-canvas'
            }`}
          >
            Quote Requests
          </a>
          {statuses.map((s) => (
            <a
              key={s}
              href={`/admin/orders?status=${s}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                params.status === s
                  ? 'bg-accent text-white'
                  : 'bg-surface text-text border border-line hover:bg-canvas'
              }`}
            >
              {s}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-canvas">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Selected Packages</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-subtle uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((order) => {
              let selection: any = {};
              try {
                selection = JSON.parse(order.selectionJson || '{}');
              } catch {}

              const packages = [];
              if (selection.services) {
                selection.services.forEach((svc: any) => packages.push(svc.name));
              } else {
                if (selection.website) packages.push(selection.website.name);
                if (selection.hosting) packages.push(selection.hosting.name);
                if (selection.dns) packages.push(selection.dns.name);
              }

              return (
                <tr key={order.id} className="hover:bg-canvas">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-ink">
                      {order.orderNumber || `#${order.id.slice(0, 8)}`}
                    </div>
                    <div className="text-xs text-subtle">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink">
                    {order.clientName}
                    <div className="text-xs text-subtle">{order.clientEmail}</div>
                    {order.clientPhone && <div className="text-xs text-subtle">{order.clientPhone}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {order.company || '—'}
                  </td>
                  <td className="px-6 py-4">
                    {order.source === 'QUOTE' ? (
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-canvas text-ink">
                        QUOTE
                      </span>
                    ) : (
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-canvas text-muted">
                        ORDER
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink">
                    <div className="space-y-1">
                      {packages.length > 0 ? packages.map((pkg, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs">
                          <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full"></span>
                          {pkg}
                        </div>
                      )) : (
                        <span>{order.package.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <OrderStatusForm
                      orderId={order.id}
                      currentStatus={order.status}
                      clientId={order.clientId}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`/admin/orders/${order.id}`}
                      className="text-sm text-accent hover:underline"
                    >
                      View →
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="px-6 py-12 text-center text-subtle">No orders found.</div>
        )}
      </div>
    </AdminLayout>
  );
}
