import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import AdminLayout from '../AdminLayout';

export const metadata: Metadata = {
  title: 'Quote Requests — Admin — Acme Web Studio',
};

export default async function AdminQuoteRequestsPage() {
  const session = await requireAdmin();

  // Fetch all PENDING orders as quote requests
  const orders = await prisma.order.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminLayout adminName={session.client.name}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quote Requests</h1>
        <p className="text-slate-600">Review pending order requests from clients.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Client Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Selected Packages</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Project Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-subtle uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No pending quote requests.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
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
                      <div className="text-sm font-medium text-slate-900">{order.clientName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.clientEmail}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.clientPhone || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="space-y-1">
                        {packages.length > 0 ? packages.map((pkg, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full"></span>
                            {pkg}
                          </div>
                        )) : (
                          <span className="text-slate-400 italic">No packages selected</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted max-w-xs">
                      <p className="line-clamp-3">{order.notes || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-subtle">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/admin/orders/${order.id}`}
                        className="inline-block bg-brand text-brand-fg text-sm px-3 py-1.5 rounded-lg hover:bg-brand hover:opacity-90 transition"
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
