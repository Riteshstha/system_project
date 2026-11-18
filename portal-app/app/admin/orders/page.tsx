import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { formatPaisa } from '@/lib/money';
import AdminLayout from '../AdminLayout';
import OrderStatusForm from './OrderStatusForm';

export const metadata: Metadata = {
  title: 'Orders — Admin — Acme Web Studio',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;

  const where = params.status ? { status: params.status as any } : {};

  const orders = await prisma.order.findMany({
    where,
    include: { package: true, client: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const statuses = [
    'PENDING',
    'QUOTE_SENT',
    'ADVANCE_PAID',
    'IN_PROGRESS',
    'READY',
    'ACTIVE',
    'CANCELLED',
    'SUSPENDED',
  ];

  return (
    <AdminLayout adminName={session.client.name}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <div className="flex gap-2">
          <a
            href="/admin/orders"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              !params.status
                ? 'bg-brand text-brand-fg'
                : 'bg-surface text-ink border border-line hover:bg-canvas'
            }`}
          >
            All
          </a>
          {statuses.map((s) => (
            <a
              key={s}
              href={`/admin/orders?status=${s}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                params.status === s
                  ? 'bg-brand text-brand-fg'
                  : 'bg-surface text-ink border border-line hover:bg-canvas'
              }`}
            >
              {s}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Selected Packages
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-subtle uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((order) => {
              let selection: any = {};
              try {
                selection = JSON.parse(order.selectionJson || '{}');
              } catch {}

              const packages = [];
              if (selection.website) packages.push(selection.website.name);
              if (selection.hosting) packages.push(selection.hosting.name);
              if (selection.dns) packages.push(selection.dns.name);

              return (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">
                      #{order.id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {order.clientName}
                    <div className="text-xs text-slate-500">{order.clientEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
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
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {formatPaisa(order.totalCents || 0)}
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
          <div className="px-6 py-12 text-center text-slate-500">No orders found.</div>
        )}
      </div>
    </AdminLayout>
  );
}
