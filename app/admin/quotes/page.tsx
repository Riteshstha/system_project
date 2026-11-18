import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import AdminLayout from '../AdminLayout';

export const metadata: Metadata = {
  title: 'Quote Requests — Admin — Acme Web Studio',
};

export default async function AdminQuoteRequestsPage() {
  const session = await requireAdmin();

  // Fetch all orders (both ORDER and QUOTE sources)
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminLayout adminName={session.client.name}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Quote Requests</h1>
        <p className="text-muted">Review quote requests from clients. These are orders marked as QUOTE source.</p>
      </div>

      <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-canvas">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Client Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Selected Packages</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Project Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Terms</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-subtle uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-subtle">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
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
                    <td className="px-6 py-4 text-sm font-medium text-ink">
                      {order.orderNumber || `#${order.id.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-ink">{order.clientName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {order.clientEmail}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {order.clientPhone || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {order.company || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      <div className="space-y-1">
                        {packages.length > 0 ? packages.map((pkg, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full"></span>
                            {pkg}
                          </div>
                        )) : (
                          <span className="text-subtle italic">No packages selected</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted max-w-xs">
                      <p className="line-clamp-3">{order.notes || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {order.source === 'QUOTE' ? (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-canvas text-ink">
                          QUOTE
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-accent-soft text-accent">
                          ORDER
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        order.status === 'PENDING' ? 'bg-canvas text-muted' :
                        order.status === 'QUOTE_SENT' ? 'bg-accent-soft text-accent' :
                        order.status === 'CONFIRMED' ? 'bg-success-soft text-success' :
                        'bg-canvas text-muted'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {order.termsAccepted ? (
                        <span className="text-success text-xs">✓</span>
                      ) : (
                        <span className="text-subtle text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-subtle">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/admin/orders/${order.id}`}
                        className="inline-block bg-accent text-white text-sm px-3 py-1.5 rounded-lg hover:bg-accent/90 transition"
                      >
                        Review
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
