import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { formatCents, formatPaisa } from '@/lib/money';
import { getGateway } from '@/lib/payments/registry';
import DashboardLayout from '../DashboardLayout';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Invoices — Acme Web Studio',
};

export default async function InvoicesPage() {
  const session = await requireSession();
  const client = session.client;

  const invoices = await prisma.invoice.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'desc' },
  });

  const statusColors: Record<string, string> = {
    UNPAID: 'bg-amber-100 text-amber-700',
    PAID: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-slate-200 text-slate-700',
  };

  return (
    <DashboardLayout clientName={client.name}>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Invoices</h1>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-500">You have no invoices yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Paid At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">
                      #{invoice.id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {invoice.description || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {formatPaisa(invoice.amountCents)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        statusColors[invoice.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {invoice.status === 'UNPAID' ? (
                      <Link
                        href="/dashboard/billing"
                        className="text-sm text-brand-700 hover:underline font-medium"
                      >
                        Pay Now →
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}